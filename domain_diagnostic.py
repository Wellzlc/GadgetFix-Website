#!/usr/bin/env python3
"""
Website Accessibility Diagnostic Tool - Domain Analysis
Comprehensive domain registration and DNS diagnostic toolkit
"""

import dns.resolver
import dns.query
import dns.zone
import whois
import socket
import ssl
import requests
import subprocess
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import concurrent.futures
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DomainDiagnostic:
    def __init__(self, domain: str):
        self.domain = domain.lower().strip()
        self.results = {}
        
        # DNS servers for testing
        self.dns_servers = [
            '8.8.8.8',      # Google
            '1.1.1.1',      # Cloudflare
            '208.67.222.222',  # OpenDNS
            '9.9.9.9',      # Quad9
        ]
        
        # DNS record types to check
        self.record_types = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'PTR']
    
    def check_domain_registration(self) -> Dict:
        """Check domain registration status via WHOIS"""
        logger.info(f"Checking domain registration for {self.domain}")
        try:
            w = whois.whois(self.domain)
            
            if isinstance(w.expiration_date, list):
                expiration = w.expiration_date[0] if w.expiration_date else None
            else:
                expiration = w.expiration_date
            
            if isinstance(w.creation_date, list):
                creation = w.creation_date[0] if w.creation_date else None
            else:
                creation = w.creation_date
                
            result = {
                'registered': bool(w.domain_name),
                'registrar': w.registrar,
                'creation_date': creation.isoformat() if creation else None,
                'expiration_date': expiration.isoformat() if expiration else None,
                'nameservers': list(w.name_servers) if w.name_servers else [],
                'status': w.status if isinstance(w.status, str) else (list(w.status) if w.status else []),
                'owner': w.registrant_name or w.name,
                'emails': list(w.emails) if w.emails else [],
                'raw_data': str(w)
            }
            
            if expiration:
                days_until_expiry = (expiration - datetime.now()).days
                result['days_until_expiry'] = days_until_expiry
                result['expires_soon'] = days_until_expiry < 30
                
            return result
            
        except Exception as e:
            logger.error(f"WHOIS lookup failed: {e}")
            return {
                'registered': False,
                'error': str(e),
                'message': 'Domain may be unregistered or WHOIS data unavailable'
            }
    
    def check_dns_records(self, dns_server: str = None) -> Dict:
        """Check all DNS record types for the domain"""
        if dns_server:
            resolver = dns.resolver.Resolver()
            resolver.nameservers = [dns_server]
        else:
            resolver = dns.resolver.Resolver()
        
        records = {}
        
        for record_type in self.record_types:
            try:
                answers = resolver.resolve(self.domain, record_type)
                records[record_type] = {
                    'found': True,
                    'values': [str(rdata) for rdata in answers],
                    'ttl': answers.ttl
                }
            except dns.resolver.NXDOMAIN:
                records[record_type] = {'found': False, 'error': 'NXDOMAIN'}
            except dns.resolver.NoAnswer:
                records[record_type] = {'found': False, 'error': 'NoAnswer'}
            except Exception as e:
                records[record_type] = {'found': False, 'error': str(e)}
        
        return records
    
    def check_dns_propagation(self) -> Dict:
        """Check DNS propagation across multiple DNS servers"""
        logger.info("Checking DNS propagation across multiple servers")
        propagation_results = {}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_server = {
                executor.submit(self.check_dns_records, server): server 
                for server in self.dns_servers
            }
            
            for future in concurrent.futures.as_completed(future_to_server):
                server = future_to_server[future]
                try:
                    result = future.result()
                    propagation_results[server] = result
                except Exception as e:
                    propagation_results[server] = {'error': str(e)}
        
        # Analyze propagation consistency
        consistent = True
        a_records = set()
        
        for server, results in propagation_results.items():
            if 'A' in results and results['A']['found']:
                a_records.update(results['A']['values'])
        
        if len(a_records) > 1:
            consistent = False
        
        return {
            'servers': propagation_results,
            'consistent': consistent,
            'unique_a_records': list(a_records)
        }
    
    def check_nameservers(self) -> Dict:
        """Analyze nameserver configuration"""
        logger.info("Checking nameserver configuration")
        try:
            ns_records = dns.resolver.resolve(self.domain, 'NS')
            nameservers = [str(ns) for ns in ns_records]
            
            ns_analysis = {}
            for ns in nameservers:
                try:
                    # Check if nameserver is responding
                    resolver = dns.resolver.Resolver()
                    resolver.nameservers = [socket.gethostbyname(ns.rstrip('.'))]
                    test_query = resolver.resolve(self.domain, 'A')
                    
                    ns_analysis[ns] = {
                        'responding': True,
                        'ip': socket.gethostbyname(ns.rstrip('.')),
                        'response_time': time.time()
                    }
                except Exception as e:
                    ns_analysis[ns] = {
                        'responding': False,
                        'error': str(e)
                    }
            
            return {
                'nameservers': nameservers,
                'count': len(nameservers),
                'analysis': ns_analysis,
                'sufficient': len(nameservers) >= 2
            }
            
        except Exception as e:
            return {'error': str(e), 'nameservers': []}
    
    def test_domain_availability(self) -> Dict:
        """Test if domain is available for registration"""
        logger.info(f"Testing domain availability for {self.domain}")
        
        # Common TLD variations
        tlds = ['.com', '.net', '.org', '.info', '.biz', '.us']
        domain_base = self.domain.split('.')[0]
        
        availability = {}
        
        for tld in tlds:
            test_domain = f"{domain_base}{tld}"
            try:
                w = whois.whois(test_domain)
                availability[test_domain] = {
                    'available': not bool(w.domain_name),
                    'registered': bool(w.domain_name)
                }
            except:
                availability[test_domain] = {'available': True, 'registered': False}
        
        return availability
    
    def run_full_diagnostic(self) -> Dict:
        """Run complete domain diagnostic suite"""
        logger.info(f"Running full diagnostic for {self.domain}")
        
        start_time = time.time()
        
        self.results = {
            'domain': self.domain,
            'timestamp': datetime.now().isoformat(),
            'registration': self.check_domain_registration(),
            'dns_propagation': self.check_dns_propagation(),
            'nameservers': self.check_nameservers(),
            'domain_availability': self.test_domain_availability()
        }
        
        self.results['diagnostic_duration'] = time.time() - start_time
        
        # Generate summary
        self.results['summary'] = self.generate_summary()
        
        return self.results
    
    def generate_summary(self) -> Dict:
        """Generate diagnostic summary with recommendations"""
        summary = {
            'critical_issues': [],
            'warnings': [],
            'recommendations': []
        }
        
        # Check registration
        if not self.results['registration'].get('registered', False):
            summary['critical_issues'].append('Domain is not registered')
            summary['recommendations'].append('Register domain with a reputable registrar')
        
        # Check expiration
        if self.results['registration'].get('expires_soon', False):
            days = self.results['registration'].get('days_until_expiry', 0)
            summary['warnings'].append(f'Domain expires in {days} days')
            summary['recommendations'].append('Renew domain before expiration')
        
        # Check DNS
        propagation = self.results['dns_propagation']
        if not propagation.get('consistent', True):
            summary['warnings'].append('DNS propagation is inconsistent')
            summary['recommendations'].append('Wait for DNS propagation or check nameserver configuration')
        
        # Check if A records exist
        has_a_record = False
        for server_data in propagation['servers'].values():
            if isinstance(server_data, dict) and 'A' in server_data:
                if server_data['A']['found']:
                    has_a_record = True
                    break
        
        if not has_a_record:
            summary['critical_issues'].append('No A records found - domain cannot resolve to website')
            summary['recommendations'].append('Configure A record pointing to web server IP address')
        
        # Check nameservers
        ns_data = self.results['nameservers']
        if 'error' in ns_data:
            summary['critical_issues'].append('Nameserver configuration issues')
            summary['recommendations'].append('Configure proper nameservers with DNS provider')
        elif not ns_data.get('sufficient', False):
            summary['warnings'].append('Insufficient nameservers (recommended: 2+)')
            summary['recommendations'].append('Add additional nameservers for redundancy')
        
        return summary
    
    def export_report(self, filename: str = None) -> str:
        """Export diagnostic results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"domain_diagnostic_{self.domain}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        logger.info(f"Diagnostic report exported to {filename}")
        return filename

def main():
    """CLI interface for domain diagnostic"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Website Domain Diagnostic Tool')
    parser.add_argument('domain', help='Domain name to diagnose')
    parser.add_argument('--export', '-e', help='Export results to JSON file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    diagnostic = DomainDiagnostic(args.domain)
    results = diagnostic.run_full_diagnostic()
    
    # Print summary
    print(f"\n=== Domain Diagnostic Report: {args.domain} ===")
    print(f"Report generated: {results['timestamp']}")
    print(f"Diagnostic duration: {results['diagnostic_duration']:.2f} seconds")
    
    summary = results['summary']
    
    if summary['critical_issues']:
        print("\n🚨 CRITICAL ISSUES:")
        for issue in summary['critical_issues']:
            print(f"  • {issue}")
    
    if summary['warnings']:
        print("\n⚠️  WARNINGS:")
        for warning in summary['warnings']:
            print(f"  • {warning}")
    
    if summary['recommendations']:
        print("\n💡 RECOMMENDATIONS:")
        for rec in summary['recommendations']:
            print(f"  • {rec}")
    
    if not summary['critical_issues'] and not summary['warnings']:
        print("\n✅ No critical issues found")
    
    # Export if requested
    if args.export:
        diagnostic.export_report(args.export)
    
    print(f"\n📊 Full diagnostic data available in results object")

if __name__ == "__main__":
    main()