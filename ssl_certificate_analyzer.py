#!/usr/bin/env python3
"""
SSL Certificate Diagnostic and Analysis Tool
Comprehensive SSL/TLS certificate validation, security analysis, and troubleshooting
"""

import ssl
import socket
import requests
import OpenSSL.crypto
import cryptography.x509
import cryptography.hazmat.primitives.hashes
from cryptography.hazmat.primitives import serialization
from cryptography.x509.oid import NameOID, ExtensionOID
import subprocess
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import concurrent.futures
import logging

logger = logging.getLogger(__name__)

class SSLCertificateAnalyzer:
    def __init__(self, domain: str, port: int = 443):
        self.domain = domain.lower().strip()
        self.port = port
        self.results = {}
        
        # Common SSL/TLS ports
        self.ssl_ports = [443, 993, 995, 465, 587, 636, 989, 990]
        
        # Weak cipher suites and protocols
        self.weak_ciphers = [
            'RC4', 'DES', '3DES', 'MD5', 'SHA1', 'NULL', 'EXPORT',
            'ADH', 'AECDH', 'PSK', 'SRP', 'KRB5'
        ]
        
        self.weak_protocols = ['SSLv2', 'SSLv3', 'TLSv1.0', 'TLSv1.1']
        
        # Certificate validation criteria
        self.min_key_sizes = {
            'RSA': 2048,
            'DSA': 2048,
            'EC': 256
        }
    
    def get_certificate_info(self) -> Dict:
        """Extract comprehensive certificate information"""
        logger.info(f"Retrieving certificate for {self.domain}:{self.port}")
        
        try:
            # Create SSL context
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            # Connect and get certificate
            with socket.create_connection((self.domain, self.port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=self.domain) as ssock:
                    cert_der = ssock.getpeercert_chain()[0]
                    cert_pem = ssl.DER_cert_to_PEM_cert(cert_der)
                    
                    # Parse certificate using cryptography library
                    cert = cryptography.x509.load_pem_x509_certificate(cert_pem.encode())
                    
                    return self.analyze_certificate(cert, cert_pem)
                    
        except ssl.SSLError as e:
            return {
                'success': False,
                'error_type': 'SSL_ERROR',
                'error': str(e),
                'message': 'SSL/TLS handshake failed'
            }
        except socket.timeout:
            return {
                'success': False,
                'error_type': 'TIMEOUT',
                'error': 'Connection timed out',
                'message': 'Server did not respond within timeout period'
            }
        except ConnectionRefusedError:
            return {
                'success': False,
                'error_type': 'CONNECTION_REFUSED',
                'error': 'Connection refused',
                'message': f'Server refused connection on port {self.port}'
            }
        except Exception as e:
            return {
                'success': False,
                'error_type': type(e).__name__,
                'error': str(e),
                'message': 'Unexpected error during certificate retrieval'
            }
    
    def analyze_certificate(self, cert: cryptography.x509.Certificate, cert_pem: str) -> Dict:
        """Comprehensive certificate analysis"""
        try:
            # Basic certificate information
            cert_info = {
                'success': True,
                'version': cert.version.name,
                'serial_number': str(cert.serial_number),
                'issuer': self.parse_name(cert.issuer),
                'subject': self.parse_name(cert.subject),
                'not_before': cert.not_valid_before.isoformat(),
                'not_after': cert.not_valid_after.isoformat(),
                'signature_algorithm': cert.signature_algorithm_oid._name,
                'fingerprints': self.calculate_fingerprints(cert_pem)
            }
            
            # Calculate validity period
            now = datetime.now()
            cert_info['days_until_expiry'] = (cert.not_valid_after - now).days
            cert_info['is_expired'] = cert.not_valid_after < now
            cert_info['expires_soon'] = cert_info['days_until_expiry'] <= 30
            cert_info['validity_period_days'] = (cert.not_valid_after - cert.not_valid_before).days
            
            # Public key information
            cert_info['public_key'] = self.analyze_public_key(cert.public_key())
            
            # Extensions analysis
            cert_info['extensions'] = self.analyze_extensions(cert)
            
            # Security analysis
            cert_info['security_analysis'] = self.analyze_certificate_security(cert)
            
            # Certificate chain validation
            cert_info['chain_validation'] = self.validate_certificate_chain()
            
            return cert_info
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to analyze certificate'
            }
    
    def parse_name(self, name: cryptography.x509.Name) -> Dict:
        """Parse X.509 distinguished name"""
        name_dict = {}
        name_components = []
        
        for attribute in name:
            oid_name = attribute.oid._name if hasattr(attribute.oid, '_name') else str(attribute.oid)
            value = attribute.value
            name_dict[oid_name] = value
            name_components.append(f"{oid_name}={value}")
        
        name_dict['full_name'] = ', '.join(name_components)
        return name_dict
    
    def calculate_fingerprints(self, cert_pem: str) -> Dict:
        """Calculate certificate fingerprints"""
        try:
            cert = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert_pem)
            
            return {
                'sha256': cert.digest('sha256').decode().replace(':', '').lower(),
                'sha1': cert.digest('sha1').decode().replace(':', '').lower(),
                'md5': cert.digest('md5').decode().replace(':', '').lower()
            }
        except Exception as e:
            return {'error': str(e)}
    
    def analyze_public_key(self, public_key) -> Dict:
        """Analyze certificate public key"""
        try:
            key_info = {
                'algorithm': public_key.__class__.__name__.replace('_', '').replace('PublicKey', '').upper()
            }
            
            if hasattr(public_key, 'key_size'):
                key_info['key_size'] = public_key.key_size
                
                # Check if key size meets security requirements
                algorithm = key_info['algorithm']
                min_size = self.min_key_sizes.get(algorithm, 0)
                key_info['adequate_key_size'] = public_key.key_size >= min_size
                key_info['minimum_recommended'] = min_size
            
            if hasattr(public_key, 'curve'):
                key_info['curve'] = public_key.curve.name
            
            # Public key in PEM format
            try:
                pem_public_key = public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ).decode()
                key_info['pem'] = pem_public_key
            except:
                pass
            
            return key_info
            
        except Exception as e:
            return {'error': str(e)}
    
    def analyze_extensions(self, cert: cryptography.x509.Certificate) -> Dict:
        """Analyze certificate extensions"""
        extensions = {}
        
        try:
            # Subject Alternative Name
            try:
                san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
                san_names = []
                for name in san_ext.value:
                    san_names.append(str(name))
                extensions['subject_alternative_name'] = {
                    'critical': san_ext.critical,
                    'names': san_names
                }
            except cryptography.x509.ExtensionNotFound:
                extensions['subject_alternative_name'] = None
            
            # Key Usage
            try:
                key_usage_ext = cert.extensions.get_extension_for_oid(ExtensionOID.KEY_USAGE)
                key_usage = key_usage_ext.value
                extensions['key_usage'] = {
                    'critical': key_usage_ext.critical,
                    'digital_signature': key_usage.digital_signature,
                    'key_encipherment': key_usage.key_encipherment,
                    'data_encipherment': getattr(key_usage, 'data_encipherment', False),
                    'key_agreement': getattr(key_usage, 'key_agreement', False),
                    'key_cert_sign': getattr(key_usage, 'key_cert_sign', False),
                    'crl_sign': getattr(key_usage, 'crl_sign', False)
                }
            except cryptography.x509.ExtensionNotFound:
                extensions['key_usage'] = None
            
            # Extended Key Usage
            try:
                ext_key_usage_ext = cert.extensions.get_extension_for_oid(ExtensionOID.EXTENDED_KEY_USAGE)
                ext_key_usage = ext_key_usage_ext.value
                extensions['extended_key_usage'] = {
                    'critical': ext_key_usage_ext.critical,
                    'usages': [str(usage) for usage in ext_key_usage]
                }
            except cryptography.x509.ExtensionNotFound:
                extensions['extended_key_usage'] = None
            
            # Basic Constraints
            try:
                basic_constraints_ext = cert.extensions.get_extension_for_oid(ExtensionOID.BASIC_CONSTRAINTS)
                basic_constraints = basic_constraints_ext.value
                extensions['basic_constraints'] = {
                    'critical': basic_constraints_ext.critical,
                    'ca': basic_constraints.ca,
                    'path_length': basic_constraints.path_length
                }
            except cryptography.x509.ExtensionNotFound:
                extensions['basic_constraints'] = None
            
            # Certificate Policies
            try:
                cert_policies_ext = cert.extensions.get_extension_for_oid(ExtensionOID.CERTIFICATE_POLICIES)
                policies = []
                for policy in cert_policies_ext.value:
                    policies.append({
                        'policy_identifier': str(policy.policy_identifier),
                        'qualifiers': [str(q) for q in policy.policy_qualifiers] if policy.policy_qualifiers else []
                    })
                extensions['certificate_policies'] = {
                    'critical': cert_policies_ext.critical,
                    'policies': policies
                }
            except cryptography.x509.ExtensionNotFound:
                extensions['certificate_policies'] = None
            
            # Authority Key Identifier
            try:
                auth_key_id_ext = cert.extensions.get_extension_for_oid(ExtensionOID.AUTHORITY_KEY_IDENTIFIER)
                auth_key_id = auth_key_id_ext.value
                extensions['authority_key_identifier'] = {
                    'critical': auth_key_id_ext.critical,
                    'key_identifier': auth_key_id.key_identifier.hex() if auth_key_id.key_identifier else None,
                    'authority_cert_issuer': str(auth_key_id.authority_cert_issuer) if auth_key_id.authority_cert_issuer else None,
                    'authority_cert_serial_number': str(auth_key_id.authority_cert_serial_number) if auth_key_id.authority_cert_serial_number else None
                }
            except cryptography.x509.ExtensionNotFound:
                extensions['authority_key_identifier'] = None
            
        except Exception as e:
            extensions['error'] = str(e)
        
        return extensions
    
    def analyze_certificate_security(self, cert: cryptography.x509.Certificate) -> Dict:
        """Analyze certificate security characteristics"""
        security = {
            'issues': [],
            'warnings': [],
            'recommendations': [],
            'security_score': 100
        }
        
        # Check signature algorithm
        sig_alg = cert.signature_algorithm_oid._name.lower()
        if 'md5' in sig_alg:
            security['issues'].append('Certificate uses weak MD5 signature algorithm')
            security['security_score'] -= 30
        elif 'sha1' in sig_alg:
            security['warnings'].append('Certificate uses SHA-1 signature algorithm (deprecated)')
            security['security_score'] -= 20
        
        # Check key size
        public_key_info = self.analyze_public_key(cert.public_key())
        if not public_key_info.get('adequate_key_size', True):
            security['issues'].append(f"Insufficient key size: {public_key_info.get('key_size')} bits")
            security['security_score'] -= 25
        
        # Check validity period
        validity_days = (cert.not_valid_after - cert.not_valid_before).days
        if validity_days > 397:  # Current CA/Browser Forum limit
            security['warnings'].append(f'Certificate validity period exceeds recommended maximum: {validity_days} days')
            security['security_score'] -= 10
        
        # Check for wildcard certificate
        subject_cn = None
        try:
            subject_cn = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        except:
            pass
        
        if subject_cn and subject_cn.startswith('*.'):
            security['warnings'].append('Wildcard certificate - ensure proper subdomain security')
        
        # Check extensions
        extensions = self.analyze_extensions(cert)
        
        if not extensions.get('subject_alternative_name'):
            security['warnings'].append('Missing Subject Alternative Name extension')
            security['security_score'] -= 5
        
        if not extensions.get('key_usage'):
            security['warnings'].append('Missing Key Usage extension')
            security['security_score'] -= 5
        
        # Check for CA certificate
        basic_constraints = extensions.get('basic_constraints')
        if basic_constraints and basic_constraints.get('ca'):
            security['warnings'].append('This is a CA certificate, not an end-entity certificate')
        
        return security
    
    def validate_certificate_chain(self) -> Dict:
        """Validate certificate chain"""
        logger.info(f"Validating certificate chain for {self.domain}:{self.port}")
        
        try:
            # Use requests to validate the full chain
            response = requests.get(f'https://{self.domain}', verify=True, timeout=10)
            
            return {
                'valid': True,
                'trusted': True,
                'message': 'Certificate chain is valid and trusted'
            }
            
        except requests.exceptions.SSLError as e:
            error_msg = str(e).lower()
            
            if 'certificate verify failed' in error_msg:
                return {
                    'valid': False,
                    'trusted': False,
                    'error': str(e),
                    'message': 'Certificate chain validation failed'
                }
            elif 'hostname' in error_msg:
                return {
                    'valid': False,
                    'trusted': False,
                    'error': str(e),
                    'message': 'Hostname verification failed'
                }
            else:
                return {
                    'valid': False,
                    'trusted': False,
                    'error': str(e),
                    'message': 'SSL error during chain validation'
                }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
                'message': 'Unable to validate certificate chain'
            }
    
    def test_ssl_configuration(self) -> Dict:
        """Test SSL/TLS configuration and supported protocols/ciphers"""
        logger.info(f"Testing SSL configuration for {self.domain}:{self.port}")
        
        config_test = {
            'supported_protocols': self.test_supported_protocols(),
            'cipher_suites': self.test_cipher_suites(),
            'security_features': self.test_security_features()
        }
        
        return config_test
    
    def test_supported_protocols(self) -> Dict:
        """Test supported SSL/TLS protocol versions"""
        protocols_to_test = [
            ('SSLv2', ssl.PROTOCOL_SSLv23),
            ('SSLv3', ssl.PROTOCOL_SSLv23),
            ('TLSv1.0', ssl.PROTOCOL_TLSv1),
            ('TLSv1.1', ssl.PROTOCOL_TLSv1_1),
            ('TLSv1.2', ssl.PROTOCOL_TLSv1_2),
            ('TLSv1.3', getattr(ssl, 'PROTOCOL_TLSv1_3', None))
        ]
        
        supported_protocols = {}
        
        for protocol_name, protocol_constant in protocols_to_test:
            if protocol_constant is None:
                continue
            
            try:
                context = ssl.SSLContext(protocol_constant)
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                
                with socket.create_connection((self.domain, self.port), timeout=5) as sock:
                    with context.wrap_socket(sock, server_hostname=self.domain) as ssock:
                        supported_protocols[protocol_name] = {
                            'supported': True,
                            'version': ssock.version(),
                            'cipher': ssock.cipher()
                        }
            except:
                supported_protocols[protocol_name] = {'supported': False}
        
        return supported_protocols
    
    def test_cipher_suites(self) -> Dict:
        """Test available cipher suites"""
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection((self.domain, self.port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=self.domain) as ssock:
                    cipher_info = ssock.cipher()
                    
                    if cipher_info:
                        cipher_name, protocol_version, secret_bits = cipher_info
                        
                        # Analyze cipher security
                        is_weak = any(weak in cipher_name.upper() for weak in self.weak_ciphers)
                        
                        return {
                            'negotiated_cipher': {
                                'name': cipher_name,
                                'protocol': protocol_version,
                                'strength': secret_bits,
                                'is_weak': is_weak
                            },
                            'available_ciphers': context.get_ciphers() if hasattr(context, 'get_ciphers') else []
                        }
            
            return {'error': 'Unable to retrieve cipher information'}
            
        except Exception as e:
            return {'error': str(e)}
    
    def test_security_features(self) -> Dict:
        """Test SSL security features"""
        features = {}
        
        try:
            # Test HSTS
            response = requests.head(f'https://{self.domain}', timeout=10)
            hsts_header = response.headers.get('Strict-Transport-Security')
            
            features['hsts'] = {
                'enabled': bool(hsts_header),
                'header_value': hsts_header
            }
            
            if hsts_header:
                # Parse HSTS header
                hsts_parts = hsts_header.split(';')
                max_age = None
                include_subdomains = False
                preload = False
                
                for part in hsts_parts:
                    part = part.strip().lower()
                    if part.startswith('max-age='):
                        max_age = int(part.split('=')[1])
                    elif part == 'includesubdomains':
                        include_subdomains = True
                    elif part == 'preload':
                        preload = True
                
                features['hsts'].update({
                    'max_age': max_age,
                    'include_subdomains': include_subdomains,
                    'preload': preload
                })
            
        except Exception as e:
            features['hsts'] = {'error': str(e)}
        
        # Test OCSP stapling (simplified check)
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection((self.domain, self.port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=self.domain) as ssock:
                    # This is a simplified check - proper OCSP stapling detection requires more complex analysis
                    features['ocsp_stapling'] = {'status': 'unknown', 'message': 'OCSP stapling detection not implemented'}
            
        except Exception as e:
            features['ocsp_stapling'] = {'error': str(e)}
        
        return features
    
    def run_comprehensive_ssl_analysis(self) -> Dict:
        """Run complete SSL certificate analysis"""
        logger.info(f"Running comprehensive SSL analysis for {self.domain}:{self.port}")
        
        start_time = time.time()
        
        self.results = {
            'domain': self.domain,
            'port': self.port,
            'timestamp': datetime.now().isoformat(),
            'certificate_info': self.get_certificate_info(),
            'ssl_configuration': self.test_ssl_configuration(),
            'multi_port_analysis': self.analyze_multiple_ports()
        }
        
        self.results['analysis_duration'] = time.time() - start_time
        self.results['summary'] = self.generate_ssl_summary()
        
        return self.results
    
    def analyze_multiple_ports(self) -> Dict:
        """Analyze SSL configuration on multiple ports"""
        port_results = {}
        
        def analyze_port(port):
            analyzer = SSLCertificateAnalyzer(self.domain, port)
            return port, analyzer.get_certificate_info()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(analyze_port, port) for port in self.ssl_ports[:4]]
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    port, result = future.result()
                    port_results[port] = result
                except Exception as e:
                    pass
        
        return port_results
    
    def generate_ssl_summary(self) -> Dict:
        """Generate SSL analysis summary"""
        summary = {
            'overall_status': 'unknown',
            'security_grade': 'F',
            'critical_issues': [],
            'warnings': [],
            'recommendations': [],
            'ssl_score': 0
        }
        
        cert_info = self.results.get('certificate_info', {})
        
        if not cert_info.get('success', False):
            summary['critical_issues'].append('Unable to retrieve SSL certificate')
            summary['overall_status'] = 'failed'
            return summary
        
        # Check certificate validity
        if cert_info.get('is_expired', False):
            summary['critical_issues'].append('SSL certificate has expired')
            summary['ssl_score'] = 0
        elif cert_info.get('expires_soon', False):
            days_left = cert_info.get('days_until_expiry', 0)
            summary['warnings'].append(f'SSL certificate expires in {days_left} days')
            summary['ssl_score'] += 60
        else:
            summary['ssl_score'] += 80
        
        # Chain validation
        chain_validation = cert_info.get('chain_validation', {})
        if chain_validation.get('valid', False):
            summary['ssl_score'] += 20
        else:
            summary['critical_issues'].append('SSL certificate chain is invalid')
        
        # Security analysis
        security_analysis = cert_info.get('security_analysis', {})
        if security_analysis.get('issues'):
            for issue in security_analysis['issues']:
                summary['critical_issues'].append(issue)
        
        if security_analysis.get('warnings'):
            summary['warnings'].extend(security_analysis['warnings'])
        
        security_score = security_analysis.get('security_score', 0)
        summary['ssl_score'] = min(summary['ssl_score'], security_score)
        
        # Protocol analysis
        ssl_config = self.results.get('ssl_configuration', {})
        supported_protocols = ssl_config.get('supported_protocols', {})
        
        # Check for weak protocols
        for protocol in self.weak_protocols:
            if supported_protocols.get(protocol, {}).get('supported', False):
                summary['critical_issues'].append(f'Weak protocol {protocol} is supported')
                summary['ssl_score'] -= 20
        
        # Check for modern protocols
        if supported_protocols.get('TLSv1.3', {}).get('supported', False):
            summary['ssl_score'] += 10
        elif supported_protocols.get('TLSv1.2', {}).get('supported', False):
            summary['ssl_score'] += 5
        
        # Cipher analysis
        cipher_info = ssl_config.get('cipher_suites', {})
        negotiated_cipher = cipher_info.get('negotiated_cipher', {})
        
        if negotiated_cipher.get('is_weak', False):
            summary['critical_issues'].append(f"Weak cipher suite: {negotiated_cipher.get('name')}")
            summary['ssl_score'] -= 30
        
        # Security features
        security_features = ssl_config.get('security_features', {})
        hsts_info = security_features.get('hsts', {})
        
        if not hsts_info.get('enabled', False):
            summary['recommendations'].append('Enable HTTP Strict Transport Security (HSTS)')
        
        # Determine overall grade
        if summary['ssl_score'] >= 90:
            summary['security_grade'] = 'A+'
            summary['overall_status'] = 'excellent'
        elif summary['ssl_score'] >= 80:
            summary['security_grade'] = 'A'
            summary['overall_status'] = 'good'
        elif summary['ssl_score'] >= 70:
            summary['security_grade'] = 'B'
            summary['overall_status'] = 'acceptable'
        elif summary['ssl_score'] >= 60:
            summary['security_grade'] = 'C'
            summary['overall_status'] = 'poor'
        elif summary['ssl_score'] >= 40:
            summary['security_grade'] = 'D'
            summary['overall_status'] = 'bad'
        else:
            summary['security_grade'] = 'F'
            summary['overall_status'] = 'failed'
        
        return summary
    
    def export_ssl_analysis(self, filename: str = None) -> str:
        """Export SSL analysis results"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ssl_analysis_{self.domain}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        logger.info(f"SSL analysis exported to {filename}")
        return filename

def main():
    """CLI interface for SSL certificate analyzer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SSL Certificate Diagnostic Tool')
    parser.add_argument('domain', help='Domain name to analyze')
    parser.add_argument('--port', '-p', type=int, default=443, help='Port number (default: 443)')
    parser.add_argument('--export', '-e', help='Export results to JSON file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    analyzer = SSLCertificateAnalyzer(args.domain, args.port)
    results = analyzer.run_comprehensive_ssl_analysis()
    
    # Print summary
    print(f"\n=== SSL Certificate Analysis: {args.domain}:{args.port} ===")
    print(f"Analysis completed: {results['timestamp']}")
    print(f"Analysis duration: {results['analysis_duration']:.2f} seconds")
    
    summary = results['summary']
    print(f"Overall status: {summary['overall_status'].upper()}")
    print(f"Security grade: {summary['security_grade']}")
    print(f"SSL score: {summary['ssl_score']}/100")
    
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
    
    # Certificate info
    cert_info = results['certificate_info']
    if cert_info.get('success'):
        print(f"\n📋 Certificate Details:")
        print(f"  Issued to: {cert_info.get('subject', {}).get('commonName', 'Unknown')}")
        print(f"  Issued by: {cert_info.get('issuer', {}).get('organizationName', 'Unknown')}")
        print(f"  Valid until: {cert_info.get('not_after', 'Unknown')}")
        print(f"  Days until expiry: {cert_info.get('days_until_expiry', 'Unknown')}")
        
        public_key = cert_info.get('public_key', {})
        print(f"  Key algorithm: {public_key.get('algorithm', 'Unknown')}")
        print(f"  Key size: {public_key.get('key_size', 'Unknown')} bits")
    
    # Export if requested
    if args.export:
        analyzer.export_ssl_analysis(args.export)

if __name__ == "__main__":
    main()