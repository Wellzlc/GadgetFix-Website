#!/usr/bin/env python3
"""
Website Monitoring and Health Check System
Real-time monitoring, alerting, and performance tracking for website accessibility
"""

import requests
import socket
import ssl
import dns.resolver
import smtplib
import json
import time
import threading
import queue
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Callable
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from dataclasses import dataclass, asdict
import sqlite3
import os

logger = logging.getLogger(__name__)

@dataclass
class HealthCheck:
    """Health check result data structure"""
    timestamp: str
    check_type: str
    endpoint: str
    status: str
    response_time: float
    status_code: Optional[int] = None
    error: Optional[str] = None
    details: Optional[Dict] = None

@dataclass
class AlertRule:
    """Alert rule configuration"""
    name: str
    condition: str
    threshold: float
    consecutive_failures: int
    cooldown_minutes: int
    enabled: bool = True

class WebsiteMonitor:
    def __init__(self, config_file: str = None):
        self.config = self.load_config(config_file)
        self.db_path = self.config.get('database_path', 'website_monitor.db')
        self.running = False
        self.check_queue = queue.Queue()
        self.alert_queue = queue.Queue()
        self.last_alerts = {}
        
        # Initialize database
        self.init_database()
        
        # Load alert rules
        self.alert_rules = self.load_alert_rules()
        
        # Start background threads
        self.worker_threads = []
    
    def load_config(self, config_file: str = None) -> Dict:
        """Load monitoring configuration"""
        default_config = {
            'targets': [
                {
                    'name': 'main_website',
                    'url': 'https://example.com',
                    'check_interval': 60,
                    'timeout': 10,
                    'expected_status': 200,
                    'checks': ['http', 'ssl', 'dns']
                }
            ],
            'database_path': 'website_monitor.db',
            'alert_settings': {
                'email': {
                    'enabled': True,
                    'smtp_server': 'smtp.gmail.com',
                    'smtp_port': 587,
                    'username': 'alerts@example.com',
                    'password': 'app_password',
                    'from_address': 'alerts@example.com',
                    'to_addresses': ['admin@example.com']
                },
                'webhook': {
                    'enabled': False,
                    'url': 'https://hooks.slack.com/services/...',
                    'method': 'POST'
                }
            },
            'retention_days': 30,
            'performance_thresholds': {
                'response_time_warning': 2.0,
                'response_time_critical': 5.0,
                'uptime_warning': 0.95,
                'uptime_critical': 0.90
            }
        }
        
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                logger.error(f"Failed to load config: {e}")
        
        return default_config
    
    def init_database(self):
        """Initialize SQLite database for storing monitoring data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Health checks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS health_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                target_name TEXT NOT NULL,
                check_type TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                status TEXT NOT NULL,
                response_time REAL,
                status_code INTEGER,
                error TEXT,
                details TEXT
            )
        ''')
        
        # Alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                target_name TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                resolved BOOLEAN DEFAULT FALSE,
                resolved_at TEXT
            )
        ''')
        
        # Performance metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                target_name TEXT NOT NULL,
                metric_type TEXT NOT NULL,
                value REAL NOT NULL,
                period TEXT NOT NULL
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_health_checks_target ON health_checks(target_name)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp)')
        
        conn.commit()
        conn.close()
    
    def load_alert_rules(self) -> List[AlertRule]:
        """Load alert rules configuration"""
        default_rules = [
            AlertRule(
                name="HTTP_DOWN",
                condition="http_status_not_200",
                threshold=1,
                consecutive_failures=3,
                cooldown_minutes=5
            ),
            AlertRule(
                name="SSL_EXPIRING",
                condition="ssl_expires_days",
                threshold=7,
                consecutive_failures=1,
                cooldown_minutes=60
            ),
            AlertRule(
                name="HIGH_RESPONSE_TIME",
                condition="response_time_seconds",
                threshold=5.0,
                consecutive_failures=5,
                cooldown_minutes=15
            ),
            AlertRule(
                name="DNS_FAILURE",
                condition="dns_resolution_failed",
                threshold=1,
                consecutive_failures=2,
                cooldown_minutes=10
            )
        ]
        
        return default_rules
    
    def perform_http_check(self, target: Dict) -> HealthCheck:
        """Perform HTTP health check"""
        url = target['url']
        timeout = target.get('timeout', 10)
        expected_status = target.get('expected_status', 200)
        
        try:
            start_time = time.time()
            response = requests.get(
                url,
                timeout=timeout,
                verify=True,
                allow_redirects=True,
                headers={'User-Agent': 'Website-Monitor/1.0'}
            )
            response_time = time.time() - start_time
            
            status = "UP" if response.status_code == expected_status else "DOWN"
            
            details = {
                'final_url': response.url,
                'redirects': len(response.history),
                'content_length': len(response.content),
                'headers': dict(response.headers)
            }
            
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="HTTP",
                endpoint=url,
                status=status,
                response_time=response_time,
                status_code=response.status_code,
                details=details
            )
            
        except requests.exceptions.Timeout:
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="HTTP",
                endpoint=url,
                status="TIMEOUT",
                response_time=timeout,
                error="Request timed out"
            )
        except requests.exceptions.ConnectionError as e:
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="HTTP",
                endpoint=url,
                status="CONNECTION_ERROR",
                response_time=0,
                error=str(e)
            )
        except Exception as e:
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="HTTP",
                endpoint=url,
                status="ERROR",
                response_time=0,
                error=str(e)
            )
    
    def perform_ssl_check(self, target: Dict) -> HealthCheck:
        """Perform SSL certificate check"""
        from urllib.parse import urlparse
        
        parsed_url = urlparse(target['url'])
        hostname = parsed_url.hostname
        port = parsed_url.port or 443
        
        try:
            start_time = time.time()
            
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    
            response_time = time.time() - start_time
            
            # Parse certificate expiration
            not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            days_until_expiry = (not_after - datetime.now()).days
            
            status = "UP" if days_until_expiry > 0 else "EXPIRED"
            
            details = {
                'subject': dict(x[0] for x in cert['subject']),
                'issuer': dict(x[0] for x in cert['issuer']),
                'not_after': cert['notAfter'],
                'days_until_expiry': days_until_expiry,
                'serial_number': cert['serialNumber'],
                'version': cert['version']
            }
            
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="SSL",
                endpoint=f"{hostname}:{port}",
                status=status,
                response_time=response_time,
                details=details
            )
            
        except Exception as e:
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="SSL",
                endpoint=f"{hostname}:{port}",
                status="ERROR",
                response_time=0,
                error=str(e)
            )
    
    def perform_dns_check(self, target: Dict) -> HealthCheck:
        """Perform DNS resolution check"""
        from urllib.parse import urlparse
        
        hostname = urlparse(target['url']).hostname
        
        try:
            start_time = time.time()
            answers = dns.resolver.resolve(hostname, 'A')
            response_time = time.time() - start_time
            
            ips = [str(rdata) for rdata in answers]
            
            details = {
                'hostname': hostname,
                'ip_addresses': ips,
                'ttl': answers.ttl,
                'record_count': len(ips)
            }
            
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="DNS",
                endpoint=hostname,
                status="UP",
                response_time=response_time,
                details=details
            )
            
        except dns.resolver.NXDOMAIN:
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="DNS",
                endpoint=hostname,
                status="NXDOMAIN",
                response_time=0,
                error="Domain does not exist"
            )
        except Exception as e:
            return HealthCheck(
                timestamp=datetime.now().isoformat(),
                check_type="DNS",
                endpoint=hostname,
                status="ERROR",
                response_time=0,
                error=str(e)
            )
    
    def store_health_check(self, target_name: str, check: HealthCheck):
        """Store health check result in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO health_checks 
            (timestamp, target_name, check_type, endpoint, status, response_time, status_code, error, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            check.timestamp,
            target_name,
            check.check_type,
            check.endpoint,
            check.status,
            check.response_time,
            check.status_code,
            check.error,
            json.dumps(check.details) if check.details else None
        ))
        
        conn.commit()
        conn.close()
    
    def evaluate_alert_rules(self, target_name: str, check: HealthCheck):
        """Evaluate alert rules against health check result"""
        for rule in self.alert_rules:
            if not rule.enabled:
                continue
            
            should_alert = False
            alert_message = ""
            
            # Evaluate rule conditions
            if rule.condition == "http_status_not_200" and check.check_type == "HTTP":
                should_alert = check.status != "UP"
                alert_message = f"HTTP check failed: {check.error or 'Status ' + str(check.status_code)}"
            
            elif rule.condition == "ssl_expires_days" and check.check_type == "SSL":
                if check.details and 'days_until_expiry' in check.details:
                    days_left = check.details['days_until_expiry']
                    should_alert = days_left <= rule.threshold
                    alert_message = f"SSL certificate expires in {days_left} days"
            
            elif rule.condition == "response_time_seconds":
                should_alert = check.response_time > rule.threshold
                alert_message = f"High response time: {check.response_time:.2f}s (threshold: {rule.threshold}s)"
            
            elif rule.condition == "dns_resolution_failed" and check.check_type == "DNS":
                should_alert = check.status != "UP"
                alert_message = f"DNS resolution failed: {check.error}"
            
            if should_alert:
                self.handle_alert(target_name, rule, alert_message, check)
    
    def handle_alert(self, target_name: str, rule: AlertRule, message: str, check: HealthCheck):
        """Handle alert generation and cooldown logic"""
        alert_key = f"{target_name}_{rule.name}"
        now = datetime.now()
        
        # Check cooldown
        if alert_key in self.last_alerts:
            last_alert_time = datetime.fromisoformat(self.last_alerts[alert_key])
            if (now - last_alert_time).total_seconds() < rule.cooldown_minutes * 60:
                return  # Still in cooldown
        
        # Check consecutive failures
        if self.check_consecutive_failures(target_name, rule, check):
            severity = self.determine_severity(rule, check)
            
            self.send_alert(target_name, rule.name, severity, message, check)
            self.store_alert(target_name, rule.name, severity, message)
            
            self.last_alerts[alert_key] = now.isoformat()
    
    def check_consecutive_failures(self, target_name: str, rule: AlertRule, current_check: HealthCheck) -> bool:
        """Check if consecutive failure threshold is met"""
        if rule.consecutive_failures <= 1:
            return True
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get recent checks of the same type
        cursor.execute('''
            SELECT status FROM health_checks
            WHERE target_name = ? AND check_type = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (target_name, current_check.check_type, rule.consecutive_failures))
        
        recent_statuses = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        # Check if all recent checks (including current) are failures
        failure_statuses = ['DOWN', 'ERROR', 'TIMEOUT', 'CONNECTION_ERROR', 'EXPIRED', 'NXDOMAIN']
        consecutive_failures = 0
        
        for status in recent_statuses:
            if status in failure_statuses:
                consecutive_failures += 1
            else:
                break
        
        return consecutive_failures >= rule.consecutive_failures
    
    def determine_severity(self, rule: AlertRule, check: HealthCheck) -> str:
        """Determine alert severity"""
        if rule.name in ['HTTP_DOWN', 'DNS_FAILURE']:
            return 'CRITICAL'
        elif rule.name == 'SSL_EXPIRING':
            if check.details and check.details.get('days_until_expiry', 0) <= 1:
                return 'CRITICAL'
            else:
                return 'WARNING'
        elif rule.name == 'HIGH_RESPONSE_TIME':
            if check.response_time > self.config['performance_thresholds']['response_time_critical']:
                return 'CRITICAL'
            else:
                return 'WARNING'
        
        return 'INFO'
    
    def send_alert(self, target_name: str, alert_type: str, severity: str, message: str, check: HealthCheck):
        """Send alert notifications"""
        alert_settings = self.config['alert_settings']
        
        # Email alerts
        if alert_settings['email']['enabled']:
            self.send_email_alert(target_name, alert_type, severity, message, check)
        
        # Webhook alerts
        if alert_settings['webhook']['enabled']:
            self.send_webhook_alert(target_name, alert_type, severity, message, check)
    
    def send_email_alert(self, target_name: str, alert_type: str, severity: str, message: str, check: HealthCheck):
        """Send email alert"""
        try:
            email_config = self.config['alert_settings']['email']
            
            msg = MimeMultipart()
            msg['From'] = email_config['from_address']
            msg['To'] = ', '.join(email_config['to_addresses'])
            msg['Subject'] = f"[{severity}] Website Monitor Alert: {target_name}"
            
            body = f"""
Website Monitor Alert

Target: {target_name}
Alert Type: {alert_type}
Severity: {severity}
Timestamp: {check.timestamp}

Message: {message}

Check Details:
- Type: {check.check_type}
- Endpoint: {check.endpoint}
- Status: {check.status}
- Response Time: {check.response_time:.2f}s
- Status Code: {check.status_code or 'N/A'}
- Error: {check.error or 'None'}

This alert was generated by the Website Monitor system.
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['username'], email_config['password'])
            text = msg.as_string()
            server.sendmail(email_config['from_address'], email_config['to_addresses'], text)
            server.quit()
            
            logger.info(f"Email alert sent for {target_name}: {message}")
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
    
    def send_webhook_alert(self, target_name: str, alert_type: str, severity: str, message: str, check: HealthCheck):
        """Send webhook alert"""
        try:
            webhook_config = self.config['alert_settings']['webhook']
            
            payload = {
                'target': target_name,
                'alert_type': alert_type,
                'severity': severity,
                'message': message,
                'timestamp': check.timestamp,
                'check_details': asdict(check)
            }
            
            response = requests.post(
                webhook_config['url'],
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Webhook alert sent for {target_name}: {message}")
            else:
                logger.error(f"Webhook alert failed with status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}")
    
    def store_alert(self, target_name: str, alert_type: str, severity: str, message: str):
        """Store alert in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (timestamp, target_name, alert_type, severity, message)
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime.now().isoformat(), target_name, alert_type, severity, message))
        
        conn.commit()
        conn.close()
    
    def monitor_target(self, target: Dict):
        """Monitor a single target continuously"""
        target_name = target['name']
        check_interval = target.get('check_interval', 60)
        checks = target.get('checks', ['http'])
        
        logger.info(f"Starting monitoring for {target_name}")
        
        while self.running:
            try:
                # Perform configured checks
                for check_type in checks:
                    if check_type == 'http':
                        check_result = self.perform_http_check(target)
                    elif check_type == 'ssl':
                        check_result = self.perform_ssl_check(target)
                    elif check_type == 'dns':
                        check_result = self.perform_dns_check(target)
                    else:
                        continue
                    
                    # Store result and evaluate alerts
                    self.store_health_check(target_name, check_result)
                    self.evaluate_alert_rules(target_name, check_result)
                    
                    logger.debug(f"{target_name} {check_type} check: {check_result.status}")
                
                # Wait for next check
                time.sleep(check_interval)
                
            except Exception as e:
                logger.error(f"Error monitoring {target_name}: {e}")
                time.sleep(30)  # Wait before retrying
    
    def start_monitoring(self):
        """Start monitoring all configured targets"""
        if self.running:
            logger.warning("Monitoring is already running")
            return
        
        self.running = True
        logger.info("Starting website monitoring")
        
        # Start monitoring thread for each target
        for target in self.config['targets']:
            thread = threading.Thread(
                target=self.monitor_target,
                args=(target,),
                daemon=True
            )
            thread.start()
            self.worker_threads.append(thread)
        
        # Start maintenance thread
        maintenance_thread = threading.Thread(
            target=self.maintenance_worker,
            daemon=True
        )
        maintenance_thread.start()
        self.worker_threads.append(maintenance_thread)
        
        logger.info(f"Monitoring started for {len(self.config['targets'])} targets")
    
    def stop_monitoring(self):
        """Stop monitoring"""
        if not self.running:
            logger.warning("Monitoring is not running")
            return
        
        logger.info("Stopping website monitoring")
        self.running = False
        
        # Wait for threads to finish
        for thread in self.worker_threads:
            thread.join(timeout=5)
        
        self.worker_threads.clear()
        logger.info("Website monitoring stopped")
    
    def maintenance_worker(self):
        """Background maintenance tasks"""
        while self.running:
            try:
                # Clean old data
                self.cleanup_old_data()
                
                # Calculate performance metrics
                self.calculate_performance_metrics()
                
                # Sleep for 1 hour
                time.sleep(3600)
                
            except Exception as e:
                logger.error(f"Maintenance error: {e}")
                time.sleep(300)  # Wait 5 minutes before retry
    
    def cleanup_old_data(self):
        """Clean up old monitoring data"""
        retention_days = self.config.get('retention_days', 30)
        cutoff_date = (datetime.now() - timedelta(days=retention_days)).isoformat()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Clean old health checks
        cursor.execute('DELETE FROM health_checks WHERE timestamp < ?', (cutoff_date,))
        
        # Clean old resolved alerts
        cursor.execute('DELETE FROM alerts WHERE resolved = TRUE AND resolved_at < ?', (cutoff_date,))
        
        # Clean old performance metrics
        cursor.execute('DELETE FROM performance_metrics WHERE timestamp < ?', (cutoff_date,))
        
        conn.commit()
        conn.close()
        
        logger.debug(f"Cleaned up data older than {retention_days} days")
    
    def calculate_performance_metrics(self):
        """Calculate and store performance metrics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Calculate hourly metrics for the last 24 hours
        for target in self.config['targets']:
            target_name = target['name']
            
            # Average response time
            cursor.execute('''
                SELECT AVG(response_time) as avg_response_time,
                       COUNT(*) as total_checks,
                       SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) as successful_checks
                FROM health_checks
                WHERE target_name = ? AND timestamp > datetime('now', '-1 hour')
            ''', (target_name,))
            
            result = cursor.fetchone()
            if result and result[0]:
                avg_response_time, total_checks, successful_checks = result
                uptime = (successful_checks / total_checks) * 100 if total_checks > 0 else 0
                
                now = datetime.now().isoformat()
                
                # Store metrics
                cursor.execute('''
                    INSERT INTO performance_metrics (timestamp, target_name, metric_type, value, period)
                    VALUES (?, ?, ?, ?, ?)
                ''', (now, target_name, 'avg_response_time', avg_response_time, 'hourly'))
                
                cursor.execute('''
                    INSERT INTO performance_metrics (timestamp, target_name, metric_type, value, period)
                    VALUES (?, ?, ?, ?, ?)
                ''', (now, target_name, 'uptime_percentage', uptime, 'hourly'))
        
        conn.commit()
        conn.close()
    
    def get_status_report(self) -> Dict:
        """Generate current status report"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'targets': {},
            'summary': {
                'total_targets': len(self.config['targets']),
                'healthy_targets': 0,
                'unhealthy_targets': 0,
                'active_alerts': 0
            }
        }
        
        for target in self.config['targets']:
            target_name = target['name']
            
            # Get latest check results
            cursor.execute('''
                SELECT check_type, status, response_time, timestamp, error
                FROM health_checks
                WHERE target_name = ?
                ORDER BY timestamp DESC
                LIMIT 10
            ''', (target_name,))
            
            recent_checks = cursor.fetchall()
            
            # Get active alerts
            cursor.execute('''
                SELECT alert_type, severity, message, timestamp
                FROM alerts
                WHERE target_name = ? AND resolved = FALSE
                ORDER BY timestamp DESC
            ''', (target_name,))
            
            active_alerts = cursor.fetchall()
            
            # Calculate uptime for last 24 hours
            cursor.execute('''
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) as successful
                FROM health_checks
                WHERE target_name = ? AND timestamp > datetime('now', '-24 hours')
            ''', (target_name,))
            
            uptime_data = cursor.fetchone()
            uptime_24h = (uptime_data[1] / uptime_data[0] * 100) if uptime_data[0] > 0 else 0
            
            # Determine overall health
            latest_statuses = [check[1] for check in recent_checks[:3]]  # Last 3 checks
            is_healthy = all(status == 'UP' for status in latest_statuses) if latest_statuses else False
            
            if is_healthy:
                report['summary']['healthy_targets'] += 1
            else:
                report['summary']['unhealthy_targets'] += 1
            
            report['targets'][target_name] = {
                'url': target['url'],
                'status': 'HEALTHY' if is_healthy else 'UNHEALTHY',
                'uptime_24h': round(uptime_24h, 2),
                'recent_checks': [
                    {
                        'type': check[0],
                        'status': check[1],
                        'response_time': check[2],
                        'timestamp': check[3],
                        'error': check[4]
                    }
                    for check in recent_checks
                ],
                'active_alerts': [
                    {
                        'type': alert[0],
                        'severity': alert[1],
                        'message': alert[2],
                        'timestamp': alert[3]
                    }
                    for alert in active_alerts
                ],
                'alert_count': len(active_alerts)
            }
            
            report['summary']['active_alerts'] += len(active_alerts)
        
        conn.close()
        return report
    
    def export_report(self, filename: str = None) -> str:
        """Export monitoring report to file"""
        report = self.get_status_report()
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"website_monitor_report_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Monitoring report exported to {filename}")
        return filename

def create_sample_config():
    """Create a sample configuration file"""
    config = {
        "targets": [
            {
                "name": "main_website",
                "url": "https://example.com",
                "check_interval": 60,
                "timeout": 10,
                "expected_status": 200,
                "checks": ["http", "ssl", "dns"]
            },
            {
                "name": "api_endpoint",
                "url": "https://api.example.com/health",
                "check_interval": 30,
                "timeout": 5,
                "expected_status": 200,
                "checks": ["http"]
            }
        ],
        "database_path": "website_monitor.db",
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
    
    with open('monitor_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("Sample configuration created: monitor_config.json")
    print("Edit this file with your actual targets and alert settings.")

def main():
    """CLI interface for website monitor"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Website Monitoring and Health Check System')
    parser.add_argument('--config', '-c', help='Configuration file path')
    parser.add_argument('--create-config', action='store_true', help='Create sample configuration file')
    parser.add_argument('--daemon', '-d', action='store_true', help='Run as daemon')
    parser.add_argument('--status', '-s', action='store_true', help='Show status report')
    parser.add_argument('--export', '-e', help='Export report to file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.create_config:
        create_sample_config()
        return
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    monitor = WebsiteMonitor(args.config)
    
    if args.status:
        report = monitor.get_status_report()
        print(f"\n=== Website Monitor Status Report ===")
        print(f"Generated: {report['timestamp']}")
        print(f"Targets: {report['summary']['total_targets']}")
        print(f"Healthy: {report['summary']['healthy_targets']}")
        print(f"Unhealthy: {report['summary']['unhealthy_targets']}")
        print(f"Active Alerts: {report['summary']['active_alerts']}")
        
        for target_name, target_data in report['targets'].items():
            print(f"\n📊 {target_name}:")
            print(f"  Status: {target_data['status']}")
            print(f"  24h Uptime: {target_data['uptime_24h']}%")
            print(f"  Active Alerts: {target_data['alert_count']}")
            
            if target_data['recent_checks']:
                latest = target_data['recent_checks'][0]
                print(f"  Latest Check: {latest['status']} ({latest['response_time']:.2f}s)")
        
        if args.export:
            monitor.export_report(args.export)
    
    elif args.daemon:
        try:
            monitor.start_monitoring()
            logger.info("Website monitoring started. Press Ctrl+C to stop.")
            
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("Shutdown signal received")
            monitor.stop_monitoring()
        except Exception as e:
            logger.error(f"Monitoring error: {e}")
            monitor.stop_monitoring()
    
    else:
        print("Use --daemon to start monitoring, --status to view status, or --create-config to create sample config")

if __name__ == "__main__":
    main()