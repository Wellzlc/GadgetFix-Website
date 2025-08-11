#!/usr/bin/env python3
"""
Advanced DNS Configuration Analysis Tool
Comprehensive DNS record analysis, zone file validation, and configuration testing
"""

import dns.resolver
import dns.zone
import dns.query
import dns.rdatatype
import dns.message
import socket
import ipaddress
import subprocess
import json
import time
import concurrent.futures
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class DNSAnalyzer:
    def __init__(self, domain: str):
        self.domain = domain.lower().strip()
        self.results = {}
        
        # Comprehensive DNS server list for global testing
        self.global_dns_servers = {
            'Google Primary': '8.8.8.8',
            'Google Secondary': '8.8.4.4',
            'Cloudflare Primary': '1.1.1.1',
            'Cloudflare Secondary': '1.0.0.1',
            'OpenDNS Primary': '208.67.222.222',
            'OpenDNS Secondary': '208.67.220.220',
            'Quad9 Primary': '9.9.9.9',
            'Quad9 Secondary': '149.112.112.112',
            'Level3': '4.2.2.2',
            'Verisign': '64.6.64.6'
        }
        
        # All DNS record types to analyze
        self.comprehensive_record_types = [
            'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'PTR', 
            'SRV', 'CAA', 'DNSKEY', 'DS', 'NSEC', 'NSEC3', 'RRSIG',
            'HINFO', 'LOC', 'NAPTR', 'SPF'
        ]
    
    def analyze_dns_records_comprehensive(self) -> Dict:
        """Comprehensive DNS record analysis"""
        logger.info(f"Analyzing DNS records for {self.domain}")
        
        record_analysis = {}
        
        for record_type in self.comprehensive_record_types:
            try:
                resolver = dns.resolver.Resolver()
                resolver.timeout = 10
                resolver.lifetime = 30
                
                answers = resolver.resolve(self.domain, record_type)
                
                record_data = {
                    'found': True,
                    'count': len(answers),
                    'ttl': answers.ttl,
                    'values': [],
                    'canonical_name': str(answers.canonical_name) if answers.canonical_name != answers.qname else None
                }
                
                for rdata in answers:
                    record_info = {
                        'value': str(rdata),
                        'type': record_type
                    }
                    
                    # Add type-specific analysis
                    if record_type == 'MX':
                        record_info.update({
                            'priority': rdata.preference,
                            'exchange': str(rdata.exchange)
                        })
                    elif record_type == 'SRV':
                        record_info.update({
                            'priority': rdata.priority,
                            'weight': rdata.weight,
                            'port': rdata.port,
                            'target': str(rdata.target)
                        })
                    elif record_type == 'SOA':
                        record_info.update({
                            'mname': str(rdata.mname),
                            'rname': str(rdata.rname),
                            'serial': rdata.serial,
                            'refresh': rdata.refresh,
                            'retry': rdata.retry,
                            'expire': rdata.expire,
                            'minimum': rdata.minimum
                        })
                    elif record_type == 'CAA':
                        record_info.update({
                            'flags': rdata.flags,
                            'tag': rdata.tag.decode(),
                            'value': rdata.value.decode()
                        })
                    
                    record_data['values'].append(record_info)
                
                record_analysis[record_type] = record_data
                
            except dns.resolver.NXDOMAIN:
                record_analysis[record_type] = {
                    'found': False,
                    'error': 'NXDOMAIN',
                    'message': 'Domain does not exist'
                }
            except dns.resolver.NoAnswer:
                record_analysis[record_type] = {
                    'found': False,
                    'error': 'NoAnswer',
                    'message': f'No {record_type} records found'
                }
            except dns.resolver.Timeout:
                record_analysis[record_type] = {
                    'found': False,
                    'error': 'Timeout',
                    'message': 'DNS query timed out'
                }
            except Exception as e:
                record_analysis[record_type] = {
                    'found': False,
                    'error': str(type(e).__name__),
                    'message': str(e)
                }
        
        return record_analysis
    
    def test_global_dns_propagation(self) -> Dict:
        """Test DNS propagation across global DNS servers"""
        logger.info("Testing global DNS propagation")
        
        propagation_results = {}
        
        def test_dns_server(server_name: str, server_ip: str) -> Tuple[str, Dict]:
            try:
                resolver = dns.resolver.Resolver()
                resolver.nameservers = [server_ip]
                resolver.timeout = 5
                resolver.lifetime = 10
                
                # Test A record resolution
                start_time = time.time()
                answers = resolver.resolve(self.domain, 'A')
                response_time = time.time() - start_time
                
                return server_name, {
                    'success': True,
                    'response_time': response_time,
                    'a_records': [str(rdata) for rdata in answers],
                    'ttl': answers.ttl,
                    'server_ip': server_ip
                }
            except Exception as e:
                return server_name, {
                    'success': False,
                    'error': str(e),
                    'server_ip': server_ip
                }
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(test_dns_server, name, ip) 
                for name, ip in self.global_dns_servers.items()
            ]
            
            for future in concurrent.futures.as_completed(futures):
                server_name, result = future.result()
                propagation_results[server_name] = result
        
        # Analyze propagation consistency
        successful_servers = {k: v for k, v in propagation_results.items() if v.get('success')}
        unique_a_records = set()
        response_times = []
        
        for result in successful_servers.values():
            unique_a_records.update(result.get('a_records', []))
            response_times.append(result.get('response_time', 0))
        
        analysis = {
            'servers_tested': len(propagation_results),
            'successful_responses': len(successful_servers),
            'failed_responses': len(propagation_results) - len(successful_servers),
            'unique_a_records': list(unique_a_records),
            'propagation_consistent': len(unique_a_records) <= 1,
            'average_response_time': sum(response_times) / len(response_times) if response_times else 0,
            'fastest_server': min(successful_servers.items(), key=lambda x: x[1].get('response_time', float('inf')))[0] if successful_servers else None,
            'slowest_server': max(successful_servers.items(), key=lambda x: x[1].get('response_time', 0))[0] if successful_servers else None
        }
        
        return {
            'servers': propagation_results,
            'analysis': analysis
        }
    
    def analyze_nameserver_health(self) -> Dict:
        """Comprehensive nameserver health analysis"""
        logger.info("Analyzing nameserver health")
        
        try:
            # Get authoritative nameservers
            ns_records = dns.resolver.resolve(self.domain, 'NS')
            nameservers = [str(ns).rstrip('.') for ns in ns_records]
            
            ns_analysis = {}
            
            def test_nameserver(ns: str) -> Tuple[str, Dict]:
                try:
                    # Resolve nameserver IP
                    ns_ip = socket.gethostbyname(ns)
                    
                    # Test response time and functionality
                    resolver = dns.resolver.Resolver()
                    resolver.nameservers = [ns_ip]
                    resolver.timeout = 5
                    
                    start_time = time.time()
                    test_response = resolver.resolve(self.domain, 'A')
                    response_time = time.time() - start_time
                    
                    # Test different record types
                    record_support = {}
                    for rtype in ['A', 'AAAA', 'MX', 'TXT', 'NS']:
                        try:
                            resolver.resolve(self.domain, rtype)
                            record_support[rtype] = True
                        except:
                            record_support[rtype] = False
                    
                    return ns, {
                        'healthy': True,
                        'ip': ns_ip,
                        'response_time': response_time,
                        'record_support': record_support,
                        'responsive': response_time < 2.0,
                        'geolocation': self.get_ip_geolocation(ns_ip)
                    }
                    
                except Exception as e:
                    return ns, {
                        'healthy': False,
                        'error': str(e),
                        'ip': None
                    }
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=len(nameservers)) as executor:
                futures = [executor.submit(test_nameserver, ns) for ns in nameservers]
                for future in concurrent.futures.as_completed(futures):
                    ns, result = future.result()
                    ns_analysis[ns] = result
            
            # Overall nameserver analysis
            healthy_count = sum(1 for result in ns_analysis.values() if result.get('healthy', False))
            avg_response_time = sum(
                result.get('response_time', 0) for result in ns_analysis.values() 
                if result.get('healthy', False)
            ) / max(healthy_count, 1)
            
            overall_analysis = {
                'total_nameservers': len(nameservers),
                'healthy_nameservers': healthy_count,
                'redundancy_sufficient': healthy_count >= 2,
                'average_response_time': avg_response_time,
                'all_responsive': all(result.get('responsive', False) for result in ns_analysis.values() if result.get('healthy')),
                'geographic_diversity': len(set(result.get('geolocation', {}).get('country', 'Unknown') for result in ns_analysis.values() if result.get('healthy'))) > 1
            }
            
            return {
                'nameservers': nameservers,
                'analysis': ns_analysis,
                'overall': overall_analysis
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def get_ip_geolocation(self, ip: str) -> Dict:
        """Get basic geolocation info for IP (simplified)"""
        try:
            # This is a simplified implementation
            # In production, you'd use a proper geolocation service
            import requests
            response = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    'country': data.get('country', 'Unknown'),
                    'region': data.get('regionName', 'Unknown'),
                    'city': data.get('city', 'Unknown'),
                    'isp': data.get('isp', 'Unknown')
                }
        except:
            pass
        return {'country': 'Unknown', 'region': 'Unknown', 'city': 'Unknown', 'isp': 'Unknown'}
    
    def analyze_dns_security(self) -> Dict:
        """Analyze DNS security features"""
        logger.info("Analyzing DNS security features")
        
        security_analysis = {
            'dnssec': self.check_dnssec(),
            'caa_records': self.check_caa_records(),
            'spf_records': self.check_spf_records(),
            'dmarc_records': self.check_dmarc_records(),
            'dns_over_https': self.test_dns_over_https()
        }
        
        return security_analysis
    
    def check_dnssec(self) -> Dict:
        """Check DNSSEC configuration"""
        try:
            # Check for DNSKEY records
            dnskey_records = dns.resolver.resolve(self.domain, 'DNSKEY')
            
            # Check for DS records at parent
            parent_domain = '.'.join(self.domain.split('.')[1:])
            ds_records = dns.resolver.resolve(self.domain, 'DS')
            
            return {
                'enabled': True,
                'dnskey_count': len(dnskey_records),
                'ds_records': len(ds_records),
                'status': 'Properly configured'
            }
        except dns.resolver.NXDOMAIN:
            return {'enabled': False, 'status': 'Domain does not exist'}
        except dns.resolver.NoAnswer:
            return {'enabled': False, 'status': 'No DNSSEC records found'}
        except Exception as e:
            return {'enabled': False, 'error': str(e)}
    
    def check_caa_records(self) -> Dict:
        """Check CAA (Certificate Authority Authorization) records"""
        try:
            caa_records = dns.resolver.resolve(self.domain, 'CAA')
            policies = []
            
            for caa in caa_records:
                policies.append({
                    'flags': caa.flags,
                    'tag': caa.tag.decode(),
                    'value': caa.value.decode()
                })
            
            return {
                'configured': True,
                'policies': policies,
                'count': len(policies)
            }
        except dns.resolver.NoAnswer:
            return {'configured': False, 'message': 'No CAA records found'}
        except Exception as e:
            return {'configured': False, 'error': str(e)}
    
    def check_spf_records(self) -> Dict:
        """Check SPF (Sender Policy Framework) records"""
        try:
            txt_records = dns.resolver.resolve(self.domain, 'TXT')
            spf_records = []
            
            for txt in txt_records:
                txt_value = str(txt).strip('"')
                if txt_value.startswith('v=spf1'):
                    spf_records.append(txt_value)
            
            return {
                'configured': len(spf_records) > 0,
                'records': spf_records,
                'count': len(spf_records),
                'multiple_records': len(spf_records) > 1
            }
        except Exception as e:
            return {'configured': False, 'error': str(e)}
    
    def check_dmarc_records(self) -> Dict:
        """Check DMARC records"""
        dmarc_domain = f"_dmarc.{self.domain}"
        try:
            txt_records = dns.resolver.resolve(dmarc_domain, 'TXT')
            dmarc_records = []
            
            for txt in txt_records:
                txt_value = str(txt).strip('"')
                if txt_value.startswith('v=DMARC1'):
                    dmarc_records.append(txt_value)
            
            return {
                'configured': len(dmarc_records) > 0,
                'records': dmarc_records,
                'domain': dmarc_domain
            }
        except Exception as e:
            return {'configured': False, 'error': str(e)}
    
    def test_dns_over_https(self) -> Dict:
        """Test DNS over HTTPS (DoH) support"""
        try:
            import requests
            
            # Test with Cloudflare DoH
            doh_url = "https://1.1.1.1/dns-query"
            params = {
                'name': self.domain,
                'type': 'A'
            }
            headers = {'Accept': 'application/dns-json'}
            
            response = requests.get(doh_url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'supported': True,
                    'status': data.get('Status', -1),
                    'answers': len(data.get('Answer', [])),
                    'response_data': data
                }
            else:
                return {
                    'supported': False,
                    'status_code': response.status_code
                }
        except Exception as e:
            return {'supported': False, 'error': str(e)}
    
    def run_comprehensive_analysis(self) -> Dict:
        """Run complete DNS analysis suite"""
        logger.info(f"Running comprehensive DNS analysis for {self.domain}")
        
        start_time = time.time()
        
        self.results = {
            'domain': self.domain,
            'timestamp': datetime.now().isoformat(),
            'dns_records': self.analyze_dns_records_comprehensive(),
            'global_propagation': self.test_global_dns_propagation(),
            'nameserver_health': self.analyze_nameserver_health(),
            'security_analysis': self.analyze_dns_security()
        }
        
        self.results['analysis_duration'] = time.time() - start_time
        self.results['summary'] = self.generate_analysis_summary()
        
        return self.results
    
    def generate_analysis_summary(self) -> Dict:
        """Generate comprehensive analysis summary"""
        summary = {
            'status': 'unknown',
            'critical_issues': [],
            'warnings': [],
            'recommendations': [],
            'security_score': 0,
            'performance_score': 0
        }
        
        # Check basic DNS functionality
        dns_records = self.results.get('dns_records', {})
        if dns_records.get('A', {}).get('found', False):
            summary['status'] = 'functional'
            summary['performance_score'] += 25
        else:
            summary['critical_issues'].append('No A records found - domain cannot resolve')
            summary['status'] = 'non_functional'
        
        # Check propagation consistency
        propagation = self.results.get('global_propagation', {})
        if propagation.get('analysis', {}).get('propagation_consistent', False):
            summary['performance_score'] += 25
        else:
            summary['warnings'].append('DNS propagation is inconsistent across global servers')
        
        # Check nameserver health
        ns_health = self.results.get('nameserver_health', {})
        if ns_health.get('overall', {}).get('redundancy_sufficient', False):
            summary['performance_score'] += 25
        else:
            summary['critical_issues'].append('Insufficient nameserver redundancy')
        
        if ns_health.get('overall', {}).get('all_responsive', False):
            summary['performance_score'] += 25
        else:
            summary['warnings'].append('Some nameservers are slow to respond')
        
        # Security analysis
        security = self.results.get('security_analysis', {})
        
        if security.get('dnssec', {}).get('enabled', False):
            summary['security_score'] += 30
        else:
            summary['recommendations'].append('Enable DNSSEC for enhanced security')
        
        if security.get('caa_records', {}).get('configured', False):
            summary['security_score'] += 20
        else:
            summary['recommendations'].append('Configure CAA records to restrict certificate authorities')
        
        if security.get('spf_records', {}).get('configured', False):
            summary['security_score'] += 25
        else:
            summary['recommendations'].append('Configure SPF records for email security')
        
        if security.get('dmarc_records', {}).get('configured', False):
            summary['security_score'] += 25
        else:
            summary['recommendations'].append('Configure DMARC records for email authentication')
        
        return summary
    
    def export_analysis(self, filename: str = None) -> str:
        """Export DNS analysis to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"dns_analysis_{self.domain}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        logger.info(f"DNS analysis exported to {filename}")
        return filename

def main():
    """CLI interface for DNS analyzer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Comprehensive DNS Configuration Analyzer')
    parser.add_argument('domain', help='Domain name to analyze')
    parser.add_argument('--export', '-e', help='Export results to JSON file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    analyzer = DNSAnalyzer(args.domain)
    results = analyzer.run_comprehensive_analysis()
    
    # Print analysis summary
    print(f"\n=== DNS Analysis Report: {args.domain} ===")
    print(f"Analysis completed: {results['timestamp']}")
    print(f"Analysis duration: {results['analysis_duration']:.2f} seconds")
    
    summary = results['summary']
    print(f"Overall status: {summary['status'].upper()}")
    print(f"Performance score: {summary['performance_score']}/100")
    print(f"Security score: {summary['security_score']}/100")
    
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
    
    if not summary['critical_issues']:
        print("\n✅ DNS configuration is functional")
    
    # Export if requested
    if args.export:
        analyzer.export_analysis(args.export)

if __name__ == "__main__":
    main()