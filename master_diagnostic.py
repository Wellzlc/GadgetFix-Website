#!/usr/bin/env python3
"""
Master Website Diagnostic and Recovery Tool
Comprehensive orchestration of all diagnostic and recovery tools
"""

import sys
import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any
import argparse
from pathlib import Path

# Import our diagnostic modules
from domain_diagnostic import DomainDiagnostic
from dns_analyzer import DNSAnalyzer
from server_connectivity import ServerConnectivityTester
from ssl_certificate_analyzer import SSLCertificateAnalyzer
from domain_recovery_automation import DomainRecoveryAutomator
from website_monitor import WebsiteMonitor

logger = logging.getLogger(__name__)

class MasterDiagnostic:
    def __init__(self, domain: str, config_file: str = None):
        self.domain = domain.lower().strip()
        self.config_file = config_file
        self.results = {}
        self.diagnosis_log = []
        
        # Diagnostic phases
        self.phases = [
            'domain_registration_check',
            'dns_comprehensive_analysis', 
            'server_connectivity_test',
            'ssl_certificate_analysis',
            'recovery_planning',
            'monitoring_setup'
        ]
    
    def log_phase(self, phase: str, status: str, details: str = ""):
        """Log diagnostic phase"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'phase': phase,
            'status': status,
            'details': details
        }
        self.diagnosis_log.append(log_entry)
        logger.info(f"Phase {phase}: {status} - {details}")
    
    def run_phase_1_domain_registration(self) -> Dict:
        """Phase 1: Domain Registration and WHOIS Analysis"""
        self.log_phase("Domain Registration Check", "Starting", f"Analyzing {self.domain}")
        
        try:
            diagnostic = DomainDiagnostic(self.domain)
            results = diagnostic.run_full_diagnostic()
            
            phase_summary = {
                'phase': 'domain_registration_check',
                'status': 'completed',
                'duration': results.get('diagnostic_duration', 0),
                'domain_registered': results['registration'].get('registered', False),
                'expires_soon': results['registration'].get('expires_soon', False),
                'days_until_expiry': results['registration'].get('days_until_expiry', 0),
                'nameservers_configured': bool(results['nameservers'].get('nameservers', [])),
                'critical_issues': results['summary']['critical_issues'],
                'warnings': results['summary']['warnings'],
                'recommendations': results['summary']['recommendations'],
                'full_results': results
            }
            
            if not phase_summary['domain_registered']:
                phase_summary['status'] = 'critical'
                self.log_phase("Domain Registration Check", "CRITICAL", "Domain not registered")
            elif phase_summary['expires_soon']:
                phase_summary['status'] = 'warning'
                self.log_phase("Domain Registration Check", "WARNING", f"Domain expires in {phase_summary['days_until_expiry']} days")
            else:
                self.log_phase("Domain Registration Check", "PASSED", "Domain registration is healthy")
            
            return phase_summary
            
        except Exception as e:
            error_result = {
                'phase': 'domain_registration_check',
                'status': 'error',
                'error': str(e),
                'critical_issues': [f"Domain registration check failed: {str(e)}"]
            }
            self.log_phase("Domain Registration Check", "ERROR", str(e))
            return error_result
    
    def run_phase_2_dns_analysis(self) -> Dict:
        """Phase 2: Comprehensive DNS Analysis"""
        self.log_phase("DNS Analysis", "Starting", "Comprehensive DNS configuration analysis")
        
        try:
            analyzer = DNSAnalyzer(self.domain)
            results = analyzer.run_comprehensive_analysis()
            
            # Extract key metrics
            dns_records = results.get('dns_records', {})
            has_a_record = dns_records.get('A', {}).get('found', False)
            has_aaaa_record = dns_records.get('AAAA', {}).get('found', False)
            has_mx_record = dns_records.get('MX', {}).get('found', False)
            
            propagation_data = results.get('global_propagation', {})
            propagation_consistent = propagation_data.get('analysis', {}).get('propagation_consistent', False)
            successful_servers = propagation_data.get('analysis', {}).get('successful_responses', 0)
            
            nameserver_health = results.get('nameserver_health', {})
            ns_redundancy = nameserver_health.get('overall', {}).get('redundancy_sufficient', False)
            
            security_analysis = results.get('security_analysis', {})
            dnssec_enabled = security_analysis.get('dnssec', {}).get('enabled', False)
            
            phase_summary = {
                'phase': 'dns_comprehensive_analysis',
                'status': 'completed',
                'duration': results.get('analysis_duration', 0),
                'has_a_record': has_a_record,
                'has_aaaa_record': has_aaaa_record,
                'has_mx_record': has_mx_record,
                'propagation_consistent': propagation_consistent,
                'successful_dns_servers': successful_servers,
                'nameserver_redundancy': ns_redundancy,
                'dnssec_enabled': dnssec_enabled,
                'performance_score': results['summary']['performance_score'],
                'security_score': results['summary']['security_score'],
                'critical_issues': results['summary']['critical_issues'],
                'warnings': results['summary']['warnings'],
                'recommendations': results['summary']['recommendations'],
                'full_results': results
            }
            
            if not has_a_record:
                phase_summary['status'] = 'critical'
                self.log_phase("DNS Analysis", "CRITICAL", "No A records found")
            elif not propagation_consistent:
                phase_summary['status'] = 'warning'
                self.log_phase("DNS Analysis", "WARNING", "DNS propagation inconsistent")
            else:
                self.log_phase("DNS Analysis", "PASSED", f"DNS analysis completed - Performance: {phase_summary['performance_score']}/100")
            
            return phase_summary
            
        except Exception as e:
            error_result = {
                'phase': 'dns_comprehensive_analysis',
                'status': 'error',
                'error': str(e),
                'critical_issues': [f"DNS analysis failed: {str(e)}"]
            }
            self.log_phase("DNS Analysis", "ERROR", str(e))
            return error_result
    
    def run_phase_3_connectivity_test(self) -> Dict:
        """Phase 3: Server Connectivity Testing"""
        self.log_phase("Server Connectivity", "Starting", "Testing server connectivity and network access")
        
        try:
            tester = ServerConnectivityTester(self.domain)
            results = tester.run_comprehensive_connectivity_test()
            
            # Extract connectivity metrics
            ip_resolution = results.get('ip_resolution', {})
            has_ipv4 = bool(ip_resolution.get('ipv4', []))
            has_ipv6 = bool(ip_resolution.get('ipv6', []))
            
            http_tests = results.get('http_tests', {})
            http_success = http_tests.get('http', {}).get('success', False)
            https_success = http_tests.get('https', {}).get('success', False)
            
            network_analysis = results.get('network_analysis', {})
            ping_success = network_analysis.get('ping', {}).get('success', False)
            
            phase_summary = {
                'phase': 'server_connectivity_test',
                'status': 'completed',
                'duration': results.get('test_duration', 0),
                'has_ipv4': has_ipv4,
                'has_ipv6': has_ipv6,
                'http_accessible': http_success,
                'https_accessible': https_success,
                'ping_successful': ping_success,
                'connectivity_score': results['summary']['connectivity_score'],
                'overall_status': results['summary']['overall_status'],
                'critical_issues': results['summary']['critical_issues'],
                'warnings': results['summary']['warnings'],
                'recommendations': results['summary']['recommendations'],
                'full_results': results
            }
            
            if not has_ipv4 and not has_ipv6:
                phase_summary['status'] = 'critical'
                self.log_phase("Server Connectivity", "CRITICAL", "Domain does not resolve to any IP")
            elif not http_success and not https_success:
                phase_summary['status'] = 'critical'
                self.log_phase("Server Connectivity", "CRITICAL", "No HTTP/HTTPS connectivity")
            elif not https_success:
                phase_summary['status'] = 'warning'
                self.log_phase("Server Connectivity", "WARNING", "HTTPS not available")
            else:
                self.log_phase("Server Connectivity", "PASSED", f"Connectivity score: {phase_summary['connectivity_score']}/100")
            
            return phase_summary
            
        except Exception as e:
            error_result = {
                'phase': 'server_connectivity_test',
                'status': 'error',
                'error': str(e),
                'critical_issues': [f"Connectivity test failed: {str(e)}"]
            }
            self.log_phase("Server Connectivity", "ERROR", str(e))
            return error_result
    
    def run_phase_4_ssl_analysis(self) -> Dict:
        """Phase 4: SSL Certificate Analysis"""
        self.log_phase("SSL Certificate Analysis", "Starting", "Analyzing SSL certificate and security")
        
        try:
            analyzer = SSLCertificateAnalyzer(self.domain)
            results = analyzer.run_comprehensive_ssl_analysis()
            
            # Extract SSL metrics
            cert_info = results.get('certificate_info', {})
            cert_valid = cert_info.get('success', False)
            cert_expired = cert_info.get('is_expired', False)
            expires_soon = cert_info.get('expires_soon', False)
            days_until_expiry = cert_info.get('days_until_expiry', 0)
            
            chain_validation = cert_info.get('chain_validation', {})
            chain_valid = chain_validation.get('valid', False)
            
            phase_summary = {
                'phase': 'ssl_certificate_analysis',
                'status': 'completed',
                'duration': results.get('analysis_duration', 0),
                'certificate_valid': cert_valid,
                'certificate_expired': cert_expired,
                'expires_soon': expires_soon,
                'days_until_expiry': days_until_expiry,
                'chain_valid': chain_valid,
                'ssl_score': results['summary']['ssl_score'],
                'security_grade': results['summary']['security_grade'],
                'overall_status': results['summary']['overall_status'],
                'critical_issues': results['summary']['critical_issues'],
                'warnings': results['summary']['warnings'],
                'recommendations': results['summary']['recommendations'],
                'full_results': results
            }
            
            if not cert_valid:
                phase_summary['status'] = 'critical'
                self.log_phase("SSL Analysis", "CRITICAL", "SSL certificate not accessible")
            elif cert_expired:
                phase_summary['status'] = 'critical'
                self.log_phase("SSL Analysis", "CRITICAL", "SSL certificate has expired")
            elif expires_soon:
                phase_summary['status'] = 'warning'
                self.log_phase("SSL Analysis", "WARNING", f"SSL certificate expires in {days_until_expiry} days")
            else:
                self.log_phase("SSL Analysis", "PASSED", f"SSL grade: {phase_summary['security_grade']}")
            
            return phase_summary
            
        except Exception as e:
            # SSL analysis may fail if HTTPS is not available, which is not always critical
            warning_result = {
                'phase': 'ssl_certificate_analysis',
                'status': 'warning',
                'error': str(e),
                'warnings': [f"SSL analysis failed: {str(e)} - May indicate HTTPS is not configured"],
                'certificate_valid': False
            }
            self.log_phase("SSL Analysis", "WARNING", f"SSL analysis failed (may be expected): {str(e)}")
            return warning_result
    
    def run_phase_5_recovery_planning(self) -> Dict:
        """Phase 5: Recovery Planning and Automation"""
        self.log_phase("Recovery Planning", "Starting", "Generating recovery automation scripts")
        
        try:
            automator = DomainRecoveryAutomator(self.domain, self.config_file)
            results = automator.run_complete_recovery()
            
            phase_summary = {
                'phase': 'recovery_planning',
                'status': 'completed',
                'duration': results.get('total_duration', 0),
                'phases_completed': results['summary']['phases_completed'],
                'scripts_generated': len(results['summary']['scripts_generated']),
                'manual_actions_count': len(results['summary']['manual_actions_required']),
                'recovery_status': results['summary']['status'],
                'scripts_generated_list': results['summary']['scripts_generated'],
                'manual_actions_required': results['summary']['manual_actions_required'],
                'next_steps': results['summary']['next_steps'],
                'full_results': results
            }
            
            self.log_phase("Recovery Planning", "COMPLETED", f"Generated {phase_summary['scripts_generated']} scripts, {phase_summary['manual_actions_count']} manual actions")
            
            return phase_summary
            
        except Exception as e:
            error_result = {
                'phase': 'recovery_planning',
                'status': 'error',
                'error': str(e),
                'critical_issues': [f"Recovery planning failed: {str(e)}"]
            }
            self.log_phase("Recovery Planning", "ERROR", str(e))
            return error_result
    
    def run_phase_6_monitoring_setup(self) -> Dict:
        """Phase 6: Monitoring Setup"""
        self.log_phase("Monitoring Setup", "Starting", "Configuring monitoring and alerting")
        
        try:
            # Create monitoring configuration based on diagnostic results
            monitoring_config = self.generate_monitoring_config()
            
            phase_summary = {
                'phase': 'monitoring_setup',
                'status': 'completed',
                'monitoring_targets': len(monitoring_config['targets']),
                'alert_rules_configured': len(monitoring_config.get('alert_rules', [])),
                'config_file_path': f"monitor_config_{self.domain}.json",
                'monitoring_config': monitoring_config
            }
            
            # Save monitoring configuration
            config_path = phase_summary['config_file_path']
            with open(config_path, 'w') as f:
                json.dump(monitoring_config, f, indent=2)
            
            self.log_phase("Monitoring Setup", "COMPLETED", f"Monitoring config saved to {config_path}")
            
            return phase_summary
            
        except Exception as e:
            error_result = {
                'phase': 'monitoring_setup',
                'status': 'error',
                'error': str(e),
                'warnings': [f"Monitoring setup failed: {str(e)}"]
            }
            self.log_phase("Monitoring Setup", "WARNING", str(e))
            return error_result
    
    def generate_monitoring_config(self) -> Dict:
        """Generate monitoring configuration based on diagnostic results"""
        config = {
            "targets": [
                {
                    "name": f"{self.domain}_main",
                    "url": f"https://{self.domain}",
                    "check_interval": 60,
                    "timeout": 10,
                    "expected_status": 200,
                    "checks": ["http", "ssl", "dns"]
                },
                {
                    "name": f"{self.domain}_http",
                    "url": f"http://{self.domain}",
                    "check_interval": 300,
                    "timeout": 10,
                    "expected_status": 200,
                    "checks": ["http"]
                }
            ],
            "database_path": f"{self.domain}_monitor.db",
            "alert_settings": {
                "email": {
                    "enabled": False,
                    "smtp_server": "smtp.gmail.com",
                    "smtp_port": 587,
                    "username": "alerts@example.com",
                    "password": "your_app_password",
                    "from_address": "alerts@example.com",
                    "to_addresses": ["admin@example.com"]
                },
                "webhook": {
                    "enabled": False,
                    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
                    "method": "POST"
                }
            },
            "retention_days": 30,
            "performance_thresholds": {
                "response_time_warning": 2.0,
                "response_time_critical": 5.0,
                "uptime_warning": 0.95,
                "uptime_critical": 0.90
            }
        }
        
        return config
    
    def run_comprehensive_diagnostic(self) -> Dict:
        """Run complete diagnostic suite"""
        logger.info(f"Starting comprehensive diagnostic for {self.domain}")
        
        start_time = time.time()
        
        self.results = {
            'domain': self.domain,
            'timestamp': datetime.now().isoformat(),
            'phases': {},
            'diagnosis_log': []
        }
        
        # Phase 1: Domain Registration Check
        self.results['phases']['phase_1'] = self.run_phase_1_domain_registration()
        
        # Phase 2: DNS Analysis
        self.results['phases']['phase_2'] = self.run_phase_2_dns_analysis()
        
        # Phase 3: Server Connectivity Test
        self.results['phases']['phase_3'] = self.run_phase_3_connectivity_test()
        
        # Phase 4: SSL Certificate Analysis
        self.results['phases']['phase_4'] = self.run_phase_4_ssl_analysis()
        
        # Phase 5: Recovery Planning
        self.results['phases']['phase_5'] = self.run_phase_5_recovery_planning()
        
        # Phase 6: Monitoring Setup
        self.results['phases']['phase_6'] = self.run_phase_6_monitoring_setup()
        
        self.results['total_duration'] = time.time() - start_time
        self.results['diagnosis_log'] = self.diagnosis_log
        self.results['summary'] = self.generate_master_summary()
        
        self.log_phase("Master Diagnostic", "COMPLETED", f"All phases completed in {self.results['total_duration']:.2f}s")
        
        return self.results
    
    def generate_master_summary(self) -> Dict:
        """Generate comprehensive summary of all diagnostic phases"""
        summary = {
            'overall_status': 'unknown',
            'phases_completed': len([p for p in self.results['phases'].values() if p.get('status') in ['completed', 'warning']]),
            'phases_failed': len([p for p in self.results['phases'].values() if p.get('status') == 'error']),
            'critical_phases': len([p for p in self.results['phases'].values() if p.get('status') == 'critical']),
            'total_critical_issues': [],
            'total_warnings': [],
            'total_recommendations': [],
            'recovery_readiness': 'unknown',
            'next_immediate_actions': [],
            'scores': {}
        }
        
        # Aggregate issues from all phases
        for phase_name, phase_data in self.results['phases'].items():
            if 'critical_issues' in phase_data:
                summary['total_critical_issues'].extend([f"{phase_name}: {issue}" for issue in phase_data['critical_issues']])
            if 'warnings' in phase_data:
                summary['total_warnings'].extend([f"{phase_name}: {warning}" for warning in phase_data['warnings']])
            if 'recommendations' in phase_data:
                summary['total_recommendations'].extend([f"{phase_name}: {rec}" for rec in phase_data['recommendations']])
        
        # Extract scores
        phase_2 = self.results['phases'].get('phase_2', {})
        phase_3 = self.results['phases'].get('phase_3', {})
        phase_4 = self.results['phases'].get('phase_4', {})
        
        summary['scores'] = {
            'dns_performance': phase_2.get('performance_score', 0),
            'dns_security': phase_2.get('security_score', 0),
            'connectivity': phase_3.get('connectivity_score', 0),
            'ssl_security': phase_4.get('ssl_score', 0)
        }
        
        # Determine overall status
        if summary['critical_phases'] > 0 or summary['phases_failed'] > 0:
            summary['overall_status'] = 'critical'
        elif len(summary['total_critical_issues']) > 0:
            summary['overall_status'] = 'needs_recovery'
        elif len(summary['total_warnings']) > 3:
            summary['overall_status'] = 'needs_improvement'
        else:
            summary['overall_status'] = 'healthy'
        
        # Determine recovery readiness
        phase_1 = self.results['phases'].get('phase_1', {})
        
        if not phase_1.get('domain_registered', False):
            summary['recovery_readiness'] = 'domain_registration_required'
            summary['next_immediate_actions'].append("Register domain with a registrar")
        elif not phase_2.get('has_a_record', False):
            summary['recovery_readiness'] = 'dns_configuration_required'
            summary['next_immediate_actions'].append("Configure DNS A records")
        elif not phase_3.get('http_accessible', False):
            summary['recovery_readiness'] = 'server_setup_required'
            summary['next_immediate_actions'].append("Setup and configure web server")
        elif not phase_4.get('certificate_valid', False):
            summary['recovery_readiness'] = 'ssl_setup_required'
            summary['next_immediate_actions'].append("Install SSL certificate")
        else:
            summary['recovery_readiness'] = 'optimization_recommended'
            summary['next_immediate_actions'].append("Review recommendations for optimization")
        
        # Add phase-specific next actions
        phase_5 = self.results['phases'].get('phase_5', {})
        if phase_5.get('status') == 'completed':
            summary['next_immediate_actions'].extend(phase_5.get('next_steps', [])[:3])
        
        return summary
    
    def export_comprehensive_report(self, output_dir: str = None) -> str:
        """Export complete diagnostic and recovery package"""
        if not output_dir:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_dir = f"comprehensive_diagnostic_{self.domain}_{timestamp}"
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Export main diagnostic results
        results_file = os.path.join(output_dir, 'diagnostic_results.json')
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        # Export individual phase results
        phases_dir = os.path.join(output_dir, 'phase_results')
        os.makedirs(phases_dir, exist_ok=True)
        
        for phase_name, phase_data in self.results['phases'].items():
            if 'full_results' in phase_data:
                phase_file = os.path.join(phases_dir, f'{phase_name}_full.json')
                with open(phase_file, 'w') as f:
                    json.dump(phase_data['full_results'], f, indent=2, default=str)
        
        # Export recovery scripts (if available)
        phase_5_data = self.results['phases'].get('phase_5', {})
        if 'full_results' in phase_5_data:
            recovery_results = phase_5_data['full_results']
            
            scripts_dir = os.path.join(output_dir, 'recovery_scripts')
            os.makedirs(scripts_dir, exist_ok=True)
            
            for phase_name, phase_data in recovery_results.get('phases', {}).items():
                if 'install_script' in phase_data:
                    script_path = os.path.join(scripts_dir, f"{phase_name}_install.sh")
                    with open(script_path, 'w') as f:
                        f.write(phase_data['install_script'])
                    os.chmod(script_path, 0o755)
                
                if 'config_file' in phase_data:
                    config_path = os.path.join(scripts_dir, f"{phase_name}.conf")
                    with open(config_path, 'w') as f:
                        f.write(phase_data['config_file'])
        
        # Export monitoring configuration
        phase_6_data = self.results['phases'].get('phase_6', {})
        if 'monitoring_config' in phase_6_data:
            monitor_config_path = os.path.join(output_dir, 'monitoring_config.json')
            with open(monitor_config_path, 'w') as f:
                json.dump(phase_6_data['monitoring_config'], f, indent=2)
        
        # Generate comprehensive README
        readme_content = self.generate_comprehensive_readme()
        readme_path = os.path.join(output_dir, 'README.md')
        with open(readme_path, 'w') as f:
            f.write(readme_content)
        
        self.log_phase("Export", "COMPLETED", f"Comprehensive report exported to {output_dir}")
        return output_dir
    
    def generate_comprehensive_readme(self) -> str:
        """Generate comprehensive README for the diagnostic package"""
        summary = self.results['summary']
        
        readme = f"""# Comprehensive Website Diagnostic Report
## Domain: {self.domain}

Generated: {self.results['timestamp']}
Total Duration: {self.results['total_duration']:.2f} seconds

## 📊 Executive Summary

- **Overall Status**: {summary['overall_status'].upper().replace('_', ' ')}
- **Recovery Readiness**: {summary['recovery_readiness'].upper().replace('_', ' ')}
- **Phases Completed**: {summary['phases_completed']}/6
- **Critical Issues**: {len(summary['total_critical_issues'])}
- **Warnings**: {len(summary['total_warnings'])}

## 🎯 Immediate Action Items

{chr(10).join([f"{i+1}. {action}" for i, action in enumerate(summary['next_immediate_actions'][:5])])}

## 📈 Performance Scores

- DNS Performance: {summary['scores'].get('dns_performance', 0)}/100
- DNS Security: {summary['scores'].get('dns_security', 0)}/100  
- Server Connectivity: {summary['scores'].get('connectivity', 0)}/100
- SSL Security: {summary['scores'].get('ssl_security', 0)}/100

## 🔍 Diagnostic Phases Results

"""
        
        # Add phase results
        phase_names = {
            'phase_1': 'Domain Registration Analysis',
            'phase_2': 'DNS Comprehensive Analysis',
            'phase_3': 'Server Connectivity Testing',
            'phase_4': 'SSL Certificate Analysis', 
            'phase_5': 'Recovery Planning & Automation',
            'phase_6': 'Monitoring Setup'
        }
        
        for phase_key, phase_name in phase_names.items():
            phase_data = self.results['phases'].get(phase_key, {})
            status = phase_data.get('status', 'unknown').upper()
            
            if status == 'COMPLETED':
                status_icon = '✅'
            elif status == 'WARNING':
                status_icon = '⚠️'
            elif status == 'CRITICAL':
                status_icon = '🚨'
            elif status == 'ERROR':
                status_icon = '❌'
            else:
                status_icon = '❓'
            
            readme += f"""
### {status_icon} {phase_name}
**Status**: {status}
**Duration**: {phase_data.get('duration', 0):.2f}s

"""
            
            if phase_data.get('critical_issues'):
                readme += "**Critical Issues:**\n"
                for issue in phase_data['critical_issues'][:3]:
                    readme += f"- {issue}\n"
                readme += "\n"
            
            if phase_data.get('warnings'):
                readme += "**Warnings:**\n"
                for warning in phase_data['warnings'][:3]:
                    readme += f"- {warning}\n"
                readme += "\n"
        
        readme += f"""
## 🚨 Critical Issues Summary

{chr(10).join([f"- {issue}" for issue in summary['total_critical_issues'][:10]])}

{"..." if len(summary['total_critical_issues']) > 10 else ""}

## 📁 Package Contents

- `diagnostic_results.json` - Complete diagnostic results
- `phase_results/` - Detailed results for each diagnostic phase
- `recovery_scripts/` - Generated recovery automation scripts
- `monitoring_config.json` - Website monitoring configuration
- `README.md` - This comprehensive guide

## 🛠️ Recovery Process

1. **Review Critical Issues**: Address all critical issues listed above
2. **Execute Recovery Scripts**: Run scripts in `recovery_scripts/` directory
3. **Manual Configuration**: Complete any manual steps as documented
4. **Deploy Monitoring**: Use `monitoring_config.json` to setup monitoring
5. **Validate Recovery**: Run diagnostic again to verify fixes

## 📞 Next Steps

Based on the analysis, your recovery readiness is: **{summary['recovery_readiness'].replace('_', ' ').title()}**

### Immediate Actions Required:
{chr(10).join([f"{i+1}. {action}" for i, action in enumerate(summary['next_immediate_actions'])])}

### Recovery Scripts Available:
"""
        
        # Add recovery scripts info
        phase_5_data = self.results['phases'].get('phase_5', {})
        if phase_5_data.get('scripts_generated_list'):
            for script in phase_5_data['scripts_generated_list']:
                readme += f"- {script}\n"
        
        readme += f"""

## 📊 Detailed Analysis

For detailed technical analysis, review the individual JSON files:

- Domain registration details: `phase_results/phase_1_full.json`
- DNS configuration analysis: `phase_results/phase_2_full.json` 
- Server connectivity results: `phase_results/phase_3_full.json`
- SSL certificate analysis: `phase_results/phase_4_full.json`
- Recovery automation details: `phase_results/phase_5_full.json`

## 🔄 Re-running Diagnostics

To re-run the diagnostic after making changes:

```bash
python master_diagnostic.py {self.domain} --export results_updated
```

---

*Generated by Website Accessibility Diagnostic and Recovery System*
*Report ID: {self.domain}_{datetime.now().strftime('%Y%m%d_%H%M%S')}*
"""
        
        return readme

def main():
    """CLI interface for master diagnostic tool"""
    parser = argparse.ArgumentParser(
        description='Master Website Diagnostic and Recovery Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python master_diagnostic.py example.com
  python master_diagnostic.py example.com --config recovery_config.json
  python master_diagnostic.py example.com --export my_results --verbose
        """
    )
    
    parser.add_argument('domain', help='Domain name to diagnose')
    parser.add_argument('--config', '-c', help='Configuration file for recovery automation')
    parser.add_argument('--export', '-e', help='Export comprehensive results to directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--phase', '-p', type=int, choices=[1,2,3,4,5,6], help='Run specific phase only')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
    else:
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
    
    try:
        diagnostic = MasterDiagnostic(args.domain, args.config)
        
        if args.phase:
            # Run specific phase
            phase_methods = {
                1: diagnostic.run_phase_1_domain_registration,
                2: diagnostic.run_phase_2_dns_analysis,
                3: diagnostic.run_phase_3_connectivity_test,
                4: diagnostic.run_phase_4_ssl_analysis,
                5: diagnostic.run_phase_5_recovery_planning,
                6: diagnostic.run_phase_6_monitoring_setup
            }
            
            print(f"Running Phase {args.phase} only...")
            result = phase_methods[args.phase]()
            print(json.dumps(result, indent=2, default=str))
            return
        
        # Run comprehensive diagnostic
        results = diagnostic.run_comprehensive_diagnostic()
        
        # Display summary
        print(f"\n{'='*60}")
        print(f"COMPREHENSIVE DIAGNOSTIC COMPLETE: {args.domain}")
        print(f"{'='*60}")
        print(f"Generated: {results['timestamp']}")
        print(f"Total Duration: {results['total_duration']:.2f} seconds")
        
        summary = results['summary']
        print(f"\n📊 OVERALL STATUS: {summary['overall_status'].upper().replace('_', ' ')}")
        print(f"🎯 RECOVERY READINESS: {summary['recovery_readiness'].upper().replace('_', ' ')}")
        print(f"✅ Phases Completed: {summary['phases_completed']}/6")
        
        if summary['total_critical_issues']:
            print(f"\n🚨 CRITICAL ISSUES ({len(summary['total_critical_issues'])}):")
            for issue in summary['total_critical_issues'][:5]:
                print(f"  • {issue}")
            if len(summary['total_critical_issues']) > 5:
                print(f"  ... and {len(summary['total_critical_issues']) - 5} more")
        
        if summary['total_warnings']:
            print(f"\n⚠️  WARNINGS ({len(summary['total_warnings'])}):")
            for warning in summary['total_warnings'][:3]:
                print(f"  • {warning}")
            if len(summary['total_warnings']) > 3:
                print(f"  ... and {len(summary['total_warnings']) - 3} more")
        
        print(f"\n🎯 IMMEDIATE ACTIONS REQUIRED:")
        for i, action in enumerate(summary['next_immediate_actions'][:5], 1):
            print(f"  {i}. {action}")
        
        print(f"\n📈 PERFORMANCE SCORES:")
        scores = summary['scores']
        print(f"  • DNS Performance: {scores.get('dns_performance', 0)}/100")
        print(f"  • DNS Security: {scores.get('dns_security', 0)}/100")
        print(f"  • Server Connectivity: {scores.get('connectivity', 0)}/100")
        print(f"  • SSL Security: {scores.get('ssl_security', 0)}/100")
        
        # Export results
        if args.export:
            export_path = diagnostic.export_comprehensive_report(args.export)
        else:
            export_path = diagnostic.export_comprehensive_report()
        
        print(f"\n📦 COMPREHENSIVE REPORT EXPORTED:")
        print(f"  📁 {export_path}")
        print(f"  📄 See {export_path}/README.md for detailed guidance")
        
        print(f"\n{'='*60}")
        print(f"DIAGNOSTIC PACKAGE READY FOR RECOVERY")
        print(f"{'='*60}")
        
    except KeyboardInterrupt:
        print("\nDiagnostic interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Diagnostic failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()