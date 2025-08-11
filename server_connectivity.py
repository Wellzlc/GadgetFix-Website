#!/usr/bin/env python3
"""
Server Connectivity Testing Suite
Comprehensive server connectivity, port scanning, and response analysis
"""

import socket
import ssl
import requests
import subprocess
import threading
import time
import json
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse
import concurrent.futures
import logging

logger = logging.getLogger(__name__)

class ServerConnectivityTester:
    def __init__(self, domain: str, timeout: int = 10):
        self.domain = domain.lower().strip()
        self.timeout = timeout
        self.results = {}
        
        # Common web server ports
        self.web_ports = [80, 443, 8080, 8443, 3000, 3001, 5000, 8000]
        
        # Extended port list for comprehensive scanning
        self.common_ports = [
            21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995,
            3389, 5432, 3306, 1433, 6379, 27017, 8080, 8443,
            3000, 5000, 8000, 9000, 9090
        ]
        
        # HTTP headers to test
        self.test_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    def resolve_domain_ips(self) -> Dict:
        """Resolve domain to IP addresses"""
        logger.info(f"Resolving IP addresses for {self.domain}")
        
        ips = {'ipv4': [], 'ipv6': [], 'errors': []}
        
        try:
            # IPv4 resolution
            ipv4_info = socket.getaddrinfo(self.domain, None, socket.AF_INET)
            ips['ipv4'] = list(set([info[4][0] for info in ipv4_info]))
        except Exception as e:
            ips['errors'].append(f"IPv4 resolution failed: {e}")
        
        try:
            # IPv6 resolution
            ipv6_info = socket.getaddrinfo(self.domain, None, socket.AF_INET6)
            ips['ipv6'] = list(set([info[4][0] for info in ipv6_info]))
        except Exception as e:
            ips['errors'].append(f"IPv6 resolution failed: {e}")
        
        return ips
    
    def test_port_connectivity(self, ip: str, port: int) -> Dict:
        """Test connectivity to specific IP:port combination"""
        try:
            start_time = time.time()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.timeout)
            
            result = sock.connect_ex((ip, port))
            connect_time = time.time() - start_time
            
            sock.close()
            
            if result == 0:
                return {
                    'open': True,
                    'response_time': connect_time,
                    'error': None
                }
            else:
                return {
                    'open': False,
                    'response_time': connect_time,
                    'error': f"Connection failed (code: {result})"
                }
        except Exception as e:
            return {
                'open': False,
                'response_time': None,
                'error': str(e)
            }
    
    def scan_ports(self, target_ips: List[str], port_list: List[int] = None) -> Dict:
        """Comprehensive port scanning"""
        if port_list is None:
            port_list = self.web_ports
        
        logger.info(f"Scanning {len(port_list)} ports on {len(target_ips)} IPs")
        
        scan_results = {}
        
        def scan_ip_port(ip: str, port: int) -> Tuple[str, int, Dict]:
            return ip, port, self.test_port_connectivity(ip, port)
        
        # Use thread pool for concurrent scanning
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            futures = []
            for ip in target_ips:
                for port in port_list:
                    futures.append(executor.submit(scan_ip_port, ip, port))
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    ip, port, result = future.result()
                    if ip not in scan_results:
                        scan_results[ip] = {}
                    scan_results[ip][port] = result
                except Exception as e:
                    logger.error(f"Port scan error: {e}")
        
        return scan_results
    
    def test_http_connectivity(self, protocol: str = 'http') -> Dict:
        """Test HTTP/HTTPS connectivity with detailed analysis"""
        url = f"{protocol}://{self.domain}"
        logger.info(f"Testing HTTP connectivity to {url}")
        
        try:
            start_time = time.time()
            
            response = requests.get(
                url,
                headers=self.test_headers,
                timeout=self.timeout,
                allow_redirects=True,
                verify=True
            )
            
            response_time = time.time() - start_time
            
            # Analyze response
            result = {
                'success': True,
                'status_code': response.status_code,
                'response_time': response_time,
                'final_url': response.url,
                'redirected': response.url != url,
                'redirect_count': len(response.history),
                'content_length': len(response.content),
                'content_type': response.headers.get('content-type', 'Unknown'),
                'server': response.headers.get('server', 'Unknown'),
                'headers': dict(response.headers),
                'encoding': response.encoding,
                'cookies': len(response.cookies),
                'connection_info': {
                    'remote_addr': getattr(response.raw._connection, 'sock', {}).getpeername() if hasattr(response.raw, '_connection') else None
                }
            }
            
            # Analyze redirect chain
            if response.history:
                redirect_chain = []
                for redirect in response.history:
                    redirect_chain.append({
                        'status_code': redirect.status_code,
                        'url': redirect.url,
                        'location': redirect.headers.get('location', '')
                    })
                result['redirect_chain'] = redirect_chain
            
            # Check for common issues
            result['issues'] = self.analyze_http_response(response)
            
            return result
            
        except requests.exceptions.SSLError as e:
            return {
                'success': False,
                'error_type': 'SSL_ERROR',
                'error': str(e),
                'message': 'SSL certificate verification failed'
            }
        except requests.exceptions.Timeout as e:
            return {
                'success': False,
                'error_type': 'TIMEOUT',
                'error': str(e),
                'message': f'Request timed out after {self.timeout} seconds'
            }
        except requests.exceptions.ConnectionError as e:
            return {
                'success': False,
                'error_type': 'CONNECTION_ERROR',
                'error': str(e),
                'message': 'Failed to establish connection'
            }
        except Exception as e:
            return {
                'success': False,
                'error_type': type(e).__name__,
                'error': str(e),
                'message': 'Unexpected error occurred'
            }
    
    def analyze_http_response(self, response) -> List[str]:
        """Analyze HTTP response for common issues"""
        issues = []
        
        # Check status code
        if response.status_code >= 400:
            issues.append(f"HTTP error status: {response.status_code}")
        
        # Check for missing security headers
        security_headers = [
            'strict-transport-security',
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'content-security-policy'
        ]
        
        missing_headers = [h for h in security_headers if h not in response.headers]
        if missing_headers:
            issues.append(f"Missing security headers: {', '.join(missing_headers)}")
        
        # Check content type
        content_type = response.headers.get('content-type', '').lower()
        if 'text/html' not in content_type and response.status_code == 200:
            issues.append(f"Unexpected content type: {content_type}")
        
        # Check for redirects
        if len(response.history) > 5:
            issues.append(f"Excessive redirects: {len(response.history)}")
        
        # Check response size
        if len(response.content) < 100 and response.status_code == 200:
            issues.append("Suspiciously small response content")
        
        return issues
    
    def perform_traceroute(self, target_ip: str) -> Dict:
        """Perform traceroute to target IP"""
        logger.info(f"Performing traceroute to {target_ip}")
        
        try:
            # Use appropriate traceroute command based on OS
            import platform
            if platform.system().lower() == 'windows':
                cmd = ['tracert', '-h', '30', target_ip]
            else:
                cmd = ['traceroute', '-m', '30', target_ip]
            
            start_time = time.time()
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            duration = time.time() - start_time
            
            if result.returncode == 0:
                # Parse traceroute output
                hops = self.parse_traceroute_output(result.stdout)
                
                return {
                    'success': True,
                    'duration': duration,
                    'hop_count': len(hops),
                    'hops': hops,
                    'raw_output': result.stdout
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr,
                    'duration': duration
                }
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Traceroute timed out after 60 seconds'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def parse_traceroute_output(self, output: str) -> List[Dict]:
        """Parse traceroute output into structured data"""
        hops = []
        lines = output.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or 'Tracing route' in line or 'traceroute' in line:
                continue
            
            # Basic parsing - this could be enhanced for different OS outputs
            parts = line.split()
            if parts and parts[0].isdigit():
                hop_info = {
                    'hop_number': int(parts[0]),
                    'raw_line': line
                }
                
                # Extract IP addresses and response times
                ips = []
                times = []
                
                for part in parts[1:]:
                    if part.count('.') == 3:  # IPv4 address
                        try:
                            socket.inet_aton(part)
                            ips.append(part)
                        except:
                            pass
                    elif part.endswith('ms'):
                        try:
                            times.append(float(part[:-2]))
                        except:
                            pass
                
                hop_info['ips'] = ips
                hop_info['response_times'] = times
                hop_info['avg_time'] = sum(times) / len(times) if times else None
                
                hops.append(hop_info)
        
        return hops
    
    def test_ping_connectivity(self, target_ip: str) -> Dict:
        """Test ping connectivity"""
        logger.info(f"Testing ping connectivity to {target_ip}")
        
        try:
            import platform
            if platform.system().lower() == 'windows':
                cmd = ['ping', '-n', '4', target_ip]
            else:
                cmd = ['ping', '-c', '4', target_ip]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Parse ping statistics
                stats = self.parse_ping_output(result.stdout)
                return {
                    'success': True,
                    'statistics': stats,
                    'raw_output': result.stdout
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr,
                    'raw_output': result.stdout
                }
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Ping timed out'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def parse_ping_output(self, output: str) -> Dict:
        """Parse ping output for statistics"""
        stats = {
            'packets_sent': 0,
            'packets_received': 0,
            'packet_loss': 0,
            'min_time': None,
            'max_time': None,
            'avg_time': None
        }
        
        lines = output.lower().split('\n')
        
        for line in lines:
            # Look for packet loss information
            if 'packets transmitted' in line or 'sent' in line:
                parts = line.split()
                for i, part in enumerate(parts):
                    if part.isdigit():
                        if 'sent' in line or 'transmitted' in line:
                            stats['packets_sent'] = int(part)
                        if 'received' in line:
                            try:
                                stats['packets_received'] = int(parts[i])
                            except:
                                pass
                        if '%' in parts[i+1:i+3]:
                            try:
                                loss_str = next(p for p in parts[i:i+3] if '%' in p)
                                stats['packet_loss'] = float(loss_str.replace('%', ''))
                            except:
                                pass
            
            # Look for timing information
            if 'min/avg/max' in line or 'minimum' in line:
                import re
                times = re.findall(r'(\d+\.?\d*)', line)
                if len(times) >= 3:
                    stats['min_time'] = float(times[-3])
                    stats['avg_time'] = float(times[-2])
                    stats['max_time'] = float(times[-1])
        
        return stats
    
    def run_comprehensive_connectivity_test(self) -> Dict:
        """Run complete server connectivity test suite"""
        logger.info(f"Running comprehensive connectivity test for {self.domain}")
        
        start_time = time.time()
        
        # Resolve domain IPs
        ip_resolution = self.resolve_domain_ips()
        all_ips = ip_resolution['ipv4'] + ip_resolution['ipv6']
        
        self.results = {
            'domain': self.domain,
            'timestamp': datetime.now().isoformat(),
            'ip_resolution': ip_resolution,
            'port_scanning': {},
            'http_tests': {},
            'network_analysis': {}
        }
        
        if all_ips:
            # Port scanning
            self.results['port_scanning'] = {
                'web_ports': self.scan_ports(ip_resolution['ipv4'], self.web_ports),
                'common_ports': self.scan_ports(ip_resolution['ipv4'][:2], self.common_ports[:10])  # Limit for speed
            }
            
            # HTTP connectivity tests
            self.results['http_tests'] = {
                'http': self.test_http_connectivity('http'),
                'https': self.test_http_connectivity('https')
            }
            
            # Network analysis (using first IPv4 if available)
            if ip_resolution['ipv4']:
                primary_ip = ip_resolution['ipv4'][0]
                self.results['network_analysis'] = {
                    'ping': self.test_ping_connectivity(primary_ip),
                    'traceroute': self.perform_traceroute(primary_ip),
                    'primary_ip': primary_ip
                }
        
        self.results['test_duration'] = time.time() - start_time
        self.results['summary'] = self.generate_connectivity_summary()
        
        return self.results
    
    def generate_connectivity_summary(self) -> Dict:
        """Generate connectivity test summary"""
        summary = {
            'overall_status': 'unknown',
            'critical_issues': [],
            'warnings': [],
            'recommendations': [],
            'connectivity_score': 0
        }
        
        # Check DNS resolution
        ip_res = self.results.get('ip_resolution', {})
        if ip_res.get('ipv4') or ip_res.get('ipv6'):
            summary['connectivity_score'] += 20
        else:
            summary['critical_issues'].append('Domain does not resolve to any IP addresses')
            summary['overall_status'] = 'failed'
        
        # Check HTTP connectivity
        http_tests = self.results.get('http_tests', {})
        
        http_success = http_tests.get('http', {}).get('success', False)
        https_success = http_tests.get('https', {}).get('success', False)
        
        if https_success:
            summary['connectivity_score'] += 40
            summary['overall_status'] = 'good'
        elif http_success:
            summary['connectivity_score'] += 20
            summary['warnings'].append('HTTPS is not available, only HTTP')
            summary['recommendations'].append('Enable HTTPS with SSL certificate')
            summary['overall_status'] = 'partial'
        else:
            summary['critical_issues'].append('No HTTP/HTTPS connectivity available')
            if summary['overall_status'] == 'unknown':
                summary['overall_status'] = 'failed'
        
        # Check port availability
        port_scan = self.results.get('port_scanning', {})
        open_ports = []
        
        for scan_type, scan_data in port_scan.items():
            for ip, ports in scan_data.items():
                for port, port_data in ports.items():
                    if port_data.get('open', False):
                        open_ports.append(port)
        
        if 443 in open_ports:
            summary['connectivity_score'] += 20
        elif 80 in open_ports:
            summary['connectivity_score'] += 10
            summary['recommendations'].append('Enable HTTPS on port 443')
        
        if open_ports:
            summary['connectivity_score'] += 20
        else:
            summary['warnings'].append('No common web server ports are accessible')
        
        # Network performance analysis
        network = self.results.get('network_analysis', {})
        ping_data = network.get('ping', {})
        
        if ping_data.get('success', False):
            packet_loss = ping_data.get('statistics', {}).get('packet_loss', 100)
            avg_time = ping_data.get('statistics', {}).get('avg_time', 0)
            
            if packet_loss == 0:
                summary['connectivity_score'] += 10
            elif packet_loss < 10:
                summary['warnings'].append(f'Some packet loss detected: {packet_loss}%')
            else:
                summary['warnings'].append(f'High packet loss: {packet_loss}%')
            
            if avg_time and avg_time > 200:
                summary['warnings'].append(f'High latency detected: {avg_time}ms')
        
        # Final scoring
        if summary['connectivity_score'] >= 80:
            summary['overall_status'] = 'excellent'
        elif summary['connectivity_score'] >= 60:
            summary['overall_status'] = 'good'
        elif summary['connectivity_score'] >= 40:
            summary['overall_status'] = 'partial'
        else:
            summary['overall_status'] = 'poor'
        
        return summary
    
    def export_results(self, filename: str = None) -> str:
        """Export connectivity test results"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"connectivity_test_{self.domain}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        logger.info(f"Connectivity test results exported to {filename}")
        return filename

def main():
    """CLI interface for server connectivity tester"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Server Connectivity Testing Suite')
    parser.add_argument('domain', help='Domain name to test')
    parser.add_argument('--timeout', '-t', type=int, default=10, help='Connection timeout in seconds')
    parser.add_argument('--export', '-e', help='Export results to JSON file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    tester = ServerConnectivityTester(args.domain, args.timeout)
    results = tester.run_comprehensive_connectivity_test()
    
    # Print summary
    print(f"\n=== Server Connectivity Test: {args.domain} ===")
    print(f"Test completed: {results['timestamp']}")
    print(f"Test duration: {results['test_duration']:.2f} seconds")
    
    summary = results['summary']
    print(f"Overall status: {summary['overall_status'].upper()}")
    print(f"Connectivity score: {summary['connectivity_score']}/100")
    
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
    
    # Show IP resolution results
    ip_res = results['ip_resolution']
    if ip_res['ipv4']:
        print(f"\n🌐 IPv4 addresses: {', '.join(ip_res['ipv4'])}")
    if ip_res['ipv6']:
        print(f"🌐 IPv6 addresses: {', '.join(ip_res['ipv6'])}")
    
    # Export if requested
    if args.export:
        tester.export_results(args.export)

if __name__ == "__main__":
    main()