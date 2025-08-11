#!/usr/bin/env python3
"""
Domain Recovery Automation System
Automated domain setup, DNS configuration, server deployment, and SSL certificate installation
"""

import subprocess
import json
import time
import os
import tempfile
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DomainRecoveryAutomator:
    def __init__(self, domain: str, config_file: str = None):
        self.domain = domain.lower().strip()
        self.config = self.load_configuration(config_file)
        self.results = {}
        self.recovery_log = []
        
        # Recovery phases
        self.recovery_phases = [
            'domain_verification',
            'dns_setup',
            'server_configuration',
            'ssl_installation',
            'monitoring_setup',
            'final_validation'
        ]
    
    def load_configuration(self, config_file: str = None) -> Dict:
        """Load recovery configuration"""
        default_config = {
            'dns': {
                'provider': 'cloudflare',
                'ttl': 300,
                'records': [
                    {'type': 'A', 'name': '@', 'value': '192.0.2.1'},
                    {'type': 'A', 'name': 'www', 'value': '192.0.2.1'},
                    {'type': 'MX', 'name': '@', 'value': 'mail.example.com', 'priority': 10}
                ]
            },
            'server': {
                'web_server': 'nginx',
                'document_root': '/var/www/html',
                'server_ip': '192.0.2.1',
                'ports': [80, 443]
            },
            'ssl': {
                'provider': 'letsencrypt',
                'email': 'admin@example.com',
                'auto_renew': True
            },
            'monitoring': {
                'check_interval': 300,
                'alert_email': 'alerts@example.com',
                'endpoints': ['/', '/health']
            }
        }
        
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                logger.error(f"Failed to load config file: {e}")
        
        return default_config
    
    def log_action(self, action: str, status: str, details: str = ""):
        """Log recovery actions"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'status': status,
            'details': details
        }
        self.recovery_log.append(log_entry)
        logger.info(f"{action}: {status} - {details}")
    
    def verify_domain_status(self) -> Dict:
        """Verify current domain status and requirements"""
        logger.info(f"Verifying domain status for {self.domain}")
        
        from domain_diagnostic import DomainDiagnostic
        from dns_analyzer import DNSAnalyzer
        from server_connectivity import ServerConnectivityTester
        
        # Run diagnostics
        domain_diag = DomainDiagnostic(self.domain)
        dns_analyzer = DNSAnalyzer(self.domain)
        connectivity_tester = ServerConnectivityTester(self.domain)
        
        status = {
            'domain_registration': domain_diag.check_domain_registration(),
            'dns_analysis': dns_analyzer.analyze_dns_records_comprehensive(),
            'connectivity': connectivity_tester.resolve_domain_ips(),
            'recovery_needed': []
        }
        
        # Determine what needs recovery
        if not status['domain_registration'].get('registered', False):
            status['recovery_needed'].append('domain_registration')
        
        if not status['dns_analysis'].get('A', {}).get('found', False):
            status['recovery_needed'].append('dns_configuration')
        
        if not status['connectivity']['ipv4']:
            status['recovery_needed'].append('server_setup')
        
        self.log_action("Domain Verification", "Completed", f"Recovery needed: {', '.join(status['recovery_needed'])}")
        return status
    
    def setup_dns_configuration(self) -> Dict:
        """Automated DNS configuration setup"""
        logger.info("Setting up DNS configuration")
        
        dns_config = self.config['dns']
        setup_results = {
            'provider': dns_config['provider'],
            'records_created': [],
            'errors': []
        }
        
        try:
            if dns_config['provider'].lower() == 'cloudflare':
                return self.setup_cloudflare_dns()
            elif dns_config['provider'].lower() == 'route53':
                return self.setup_route53_dns()
            else:
                return self.setup_generic_dns()
                
        except Exception as e:
            setup_results['errors'].append(str(e))
            self.log_action("DNS Setup", "Failed", str(e))
            return setup_results
    
    def setup_cloudflare_dns(self) -> Dict:
        """Setup DNS using Cloudflare API"""
        logger.info("Configuring DNS via Cloudflare API")
        
        # This is a template - requires actual API credentials
        dns_template = {
            'zone_creation': self.generate_cloudflare_zone_script(),
            'record_creation': self.generate_cloudflare_records_script(),
            'verification': self.generate_dns_verification_script()
        }
        
        results = {
            'provider': 'cloudflare',
            'scripts_generated': True,
            'manual_steps': [
                "1. Set CLOUDFLARE_API_TOKEN environment variable",
                "2. Run the generated zone creation script",
                "3. Run the record creation script",
                "4. Verify DNS propagation"
            ],
            'scripts': dns_template
        }
        
        self.log_action("Cloudflare DNS Setup", "Scripts Generated", "Manual execution required")
        return results
    
    def generate_cloudflare_zone_script(self) -> str:
        """Generate Cloudflare zone creation script"""
        script = f'''#!/bin/bash
# Cloudflare DNS Zone Setup Script for {self.domain}
# Requires: CLOUDFLARE_API_TOKEN environment variable

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN environment variable not set"
    exit 1
fi

DOMAIN="{self.domain}"
API_TOKEN="$CLOUDFLARE_API_TOKEN"

# Create zone
echo "Creating DNS zone for $DOMAIN..."
ZONE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones" \\
    -H "Authorization: Bearer $API_TOKEN" \\
    -H "Content-Type: application/json" \\
    --data '{{"name":"'$DOMAIN'","type":"full"}}')

ZONE_ID=$(echo $ZONE_RESPONSE | jq -r '.result.id')

if [ "$ZONE_ID" = "null" ]; then
    echo "Failed to create zone:"
    echo $ZONE_RESPONSE | jq '.errors'
    exit 1
fi

echo "Zone created successfully. Zone ID: $ZONE_ID"
echo "ZONE_ID=$ZONE_ID" > cloudflare_zone.env
echo "Please update your domain's nameservers to Cloudflare's nameservers"
'''
        return script
    
    def generate_cloudflare_records_script(self) -> str:
        """Generate Cloudflare DNS records creation script"""
        records = self.config['dns']['records']
        ttl = self.config['dns']['ttl']
        
        script = f'''#!/bin/bash
# Cloudflare DNS Records Setup Script for {self.domain}

source cloudflare_zone.env

if [ -z "$ZONE_ID" ]; then
    echo "Error: ZONE_ID not found. Run zone creation script first."
    exit 1
fi

API_TOKEN="$CLOUDFLARE_API_TOKEN"
'''
        
        for record in records:
            record_type = record['type']
            name = record['name']
            value = record['value']
            priority = record.get('priority', '')
            
            if record_type == 'MX':
                data = f'{{"type":"{record_type}","name":"{name}","content":"{value}","ttl":{ttl},"priority":{priority}}}'
            else:
                data = f'{{"type":"{record_type}","name":"{name}","content":"{value}","ttl":{ttl}}}'
            
            script += f'''
# Create {record_type} record for {name}
echo "Creating {record_type} record: {name} -> {value}"
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \\
    -H "Authorization: Bearer $API_TOKEN" \\
    -H "Content-Type: application/json" \\
    --data '{data}' | jq '.success'
'''
        
        script += '''
echo "DNS records creation completed"
echo "Waiting for propagation..."
sleep 30
'''
        
        return script
    
    def setup_route53_dns(self) -> Dict:
        """Setup DNS using AWS Route53"""
        logger.info("Configuring DNS via AWS Route53")
        
        # Generate AWS CLI commands
        hosted_zone_cmd = f'''aws route53 create-hosted-zone \\
    --name {self.domain} \\
    --caller-reference {datetime.now().strftime("%Y%m%d%H%M%S")} \\
    --hosted-zone-config Comment="Auto-created for domain recovery"'''
        
        records_batch = {
            "Changes": []
        }
        
        for record in self.config['dns']['records']:
            change = {
                "Action": "CREATE",
                "ResourceRecordSet": {
                    "Name": f"{record['name']}.{self.domain}" if record['name'] != '@' else self.domain,
                    "Type": record['type'],
                    "TTL": self.config['dns']['ttl'],
                    "ResourceRecords": [{"Value": record['value']}]
                }
            }
            
            if record['type'] == 'MX':
                change["ResourceRecordSet"]["ResourceRecords"][0]["Value"] = f"{record['priority']} {record['value']}"
            
            records_batch["Changes"].append(change)
        
        results = {
            'provider': 'route53',
            'hosted_zone_command': hosted_zone_cmd,
            'records_batch': records_batch,
            'manual_steps': [
                "1. Run AWS CLI hosted zone creation command",
                "2. Note the hosted zone ID from response",
                "3. Apply DNS records batch",
                "4. Update domain nameservers to Route53"
            ]
        }
        
        self.log_action("Route53 DNS Setup", "Commands Generated", "Manual execution required")
        return results
    
    def setup_generic_dns(self) -> Dict:
        """Generate generic DNS setup instructions"""
        logger.info("Generating generic DNS setup instructions")
        
        records_text = []
        for record in self.config['dns']['records']:
            if record['type'] == 'MX':
                records_text.append(f"{record['name']}\t{self.config['dns']['ttl']}\tIN\t{record['type']}\t{record['priority']}\t{record['value']}")
            else:
                records_text.append(f"{record['name']}\t{self.config['dns']['ttl']}\tIN\t{record['type']}\t{record['value']}")
        
        zone_file = f''';
; DNS Zone file for {self.domain}
; Generated on {datetime.now().isoformat()}
;
$TTL {self.config['dns']['ttl']}
$ORIGIN {self.domain}.

@\tIN\tSOA\tns1.{self.domain}.\tadmin.{self.domain}. (
\t\t\t{int(time.time())}\t; serial
\t\t\t3600\t\t; refresh
\t\t\t1800\t\t; retry
\t\t\t604800\t\t; expire
\t\t\t86400\t\t; minimum
)

; Name servers
@\tIN\tNS\tns1.{self.domain}.
@\tIN\tNS\tns2.{self.domain}.

; DNS records
{chr(10).join(records_text)}
'''
        
        results = {
            'provider': 'generic',
            'zone_file': zone_file,
            'manual_steps': [
                "1. Copy the zone file content to your DNS provider",
                "2. Update nameservers if necessary",
                "3. Verify DNS propagation",
                "4. Test domain resolution"
            ]
        }
        
        self.log_action("Generic DNS Setup", "Zone File Generated", "Manual configuration required")
        return results
    
    def configure_web_server(self) -> Dict:
        """Generate web server configuration"""
        logger.info("Generating web server configuration")
        
        server_type = self.config['server']['web_server'].lower()
        
        if server_type == 'nginx':
            return self.generate_nginx_config()
        elif server_type == 'apache':
            return self.generate_apache_config()
        else:
            return self.generate_generic_server_config()
    
    def generate_nginx_config(self) -> Dict:
        """Generate Nginx configuration"""
        server_config = self.config['server']
        
        nginx_config = f'''# Nginx configuration for {self.domain}
# Generated on {datetime.now().isoformat()}

server {{
    listen 80;
    server_name {self.domain} www.{self.domain};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}}

server {{
    listen 443 ssl http2;
    server_name {self.domain} www.{self.domain};
    
    root {server_config['document_root']};
    index index.html index.htm index.php;
    
    # SSL Configuration (to be updated after certificate installation)
    ssl_certificate /etc/ssl/certs/{self.domain}.crt;
    ssl_certificate_key /etc/ssl/private/{self.domain}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Basic locations
    location / {{
        try_files $uri $uri/ =404;
    }}
    
    location /health {{
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }}
    
    # Static files optimization
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
    
    # Security
    location ~ /\\. {{
        deny all;
    }}
}}'''
        
        install_script = f'''#!/bin/bash
# Nginx installation and configuration script for {self.domain}

# Install Nginx
if command -v apt-get > /dev/null; then
    sudo apt-get update
    sudo apt-get install -y nginx
elif command -v yum > /dev/null; then
    sudo yum install -y nginx
elif command -v dnf > /dev/null; then
    sudo dnf install -y nginx
fi

# Create document root
sudo mkdir -p {server_config['document_root']}
sudo chown -R www-data:www-data {server_config['document_root']}

# Create basic index page
sudo tee {server_config['document_root']}/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {self.domain}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 50px; }}
        h1 {{ color: #333; }}
    </style>
</head>
<body>
    <h1>Welcome to {self.domain}</h1>
    <p>Your website is now online!</p>
    <p>Server configured on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
</body>
</html>
EOF

# Install configuration
sudo tee /etc/nginx/sites-available/{self.domain} > /dev/null <<'EOF'
{nginx_config}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/{self.domain} /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload configuration
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "Nginx configuration completed for {self.domain}"
'''
        
        results = {
            'server_type': 'nginx',
            'config_file': nginx_config,
            'install_script': install_script,
            'config_path': f'/etc/nginx/sites-available/{self.domain}',
            'manual_steps': [
                "1. Run the installation script as root",
                "2. Verify Nginx is running: systemctl status nginx",
                "3. Test configuration: nginx -t",
                "4. Check firewall allows ports 80 and 443"
            ]
        }
        
        self.log_action("Nginx Configuration", "Generated", f"Config file and install script ready")
        return results
    
    def generate_apache_config(self) -> Dict:
        """Generate Apache configuration"""
        server_config = self.config['server']
        
        apache_config = f'''# Apache VirtualHost configuration for {self.domain}
# Generated on {datetime.now().isoformat()}

<VirtualHost *:80>
    ServerName {self.domain}
    ServerAlias www.{self.domain}
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{{HTTPS}} !=on
    RewriteRule ^(.*)$ https://%{{HTTP_HOST}}%{{REQUEST_URI}} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName {self.domain}
    ServerAlias www.{self.domain}
    
    DocumentRoot {server_config['document_root']}
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/{self.domain}.crt
    SSLCertificateKeyFile /etc/ssl/private/{self.domain}.key
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    SSLSessionTickets off
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=63072000"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    
    # Health check endpoint
    Alias /health {server_config['document_root']}/health.txt
    
    <Directory {server_config['document_root']}>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
    
    # Logging
    ErrorLog ${{APACHE_LOG_DIR}}/{self.domain}_error.log
    CustomLog ${{APACHE_LOG_DIR}}/{self.domain}_access.log combined
</VirtualHost>'''
        
        install_script = f'''#!/bin/bash
# Apache installation and configuration script for {self.domain}

# Install Apache
if command -v apt-get > /dev/null; then
    sudo apt-get update
    sudo apt-get install -y apache2
    sudo a2enmod rewrite ssl headers
elif command -v yum > /dev/null; then
    sudo yum install -y httpd mod_ssl
    sudo systemctl enable httpd
fi

# Create document root
sudo mkdir -p {server_config['document_root']}
sudo chown -R www-data:www-data {server_config['document_root']}

# Create basic index page
sudo tee {server_config['document_root']}/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {self.domain}</title>
</head>
<body>
    <h1>Welcome to {self.domain}</h1>
    <p>Your website is now online!</p>
</body>
</html>
EOF

# Create health check file
echo "healthy" | sudo tee {server_config['document_root']}/health.txt

# Install configuration
sudo tee /etc/apache2/sites-available/{self.domain}.conf > /dev/null <<'EOF'
{apache_config}
EOF

# Enable site
sudo a2ensite {self.domain}
sudo a2dissite 000-default

# Test and reload configuration
sudo apache2ctl configtest
sudo systemctl enable apache2
sudo systemctl restart apache2

echo "Apache configuration completed for {self.domain}"
'''
        
        results = {
            'server_type': 'apache',
            'config_file': apache_config,
            'install_script': install_script,
            'config_path': f'/etc/apache2/sites-available/{self.domain}.conf',
            'manual_steps': [
                "1. Run the installation script as root",
                "2. Verify Apache is running: systemctl status apache2",
                "3. Test configuration: apache2ctl configtest",
                "4. Check firewall allows ports 80 and 443"
            ]
        }
        
        self.log_action("Apache Configuration", "Generated", f"Config file and install script ready")
        return results
    
    def setup_ssl_certificate(self) -> Dict:
        """Setup SSL certificate"""
        logger.info("Setting up SSL certificate")
        
        ssl_config = self.config['ssl']
        provider = ssl_config['provider'].lower()
        
        if provider == 'letsencrypt':
            return self.setup_letsencrypt_ssl()
        else:
            return self.generate_ssl_instructions()
    
    def setup_letsencrypt_ssl(self) -> Dict:
        """Setup Let's Encrypt SSL certificate"""
        ssl_config = self.config['ssl']
        server_config = self.config['server']
        
        certbot_script = f'''#!/bin/bash
# Let's Encrypt SSL certificate installation for {self.domain}

# Install Certbot
if command -v apt-get > /dev/null; then
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
elif command -v yum > /dev/null; then
    sudo yum install -y certbot python3-certbot-nginx
fi

# Stop web server temporarily
sudo systemctl stop {server_config['web_server']}

# Obtain certificate
sudo certbot certonly --standalone \\
    --email {ssl_config['email']} \\
    --agree-tos \\
    --no-eff-email \\
    -d {self.domain} \\
    -d www.{self.domain}

# Start web server
sudo systemctl start {server_config['web_server']}

# Update web server configuration with certificate paths
if [ "{server_config['web_server']}" = "nginx" ]; then
    sudo sed -i 's|ssl_certificate /etc/ssl/certs/{self.domain}.crt|ssl_certificate /etc/letsencrypt/live/{self.domain}/fullchain.pem|g' /etc/nginx/sites-available/{self.domain}
    sudo sed -i 's|ssl_certificate_key /etc/ssl/private/{self.domain}.key|ssl_certificate_key /etc/letsencrypt/live/{self.domain}/privkey.pem|g' /etc/nginx/sites-available/{self.domain}
    sudo nginx -t && sudo systemctl reload nginx
elif [ "{server_config['web_server']}" = "apache" ]; then
    sudo sed -i 's|SSLCertificateFile /etc/ssl/certs/{self.domain}.crt|SSLCertificateFile /etc/letsencrypt/live/{self.domain}/fullchain.pem|g' /etc/apache2/sites-available/{self.domain}.conf
    sudo sed -i 's|SSLCertificateKeyFile /etc/ssl/private/{self.domain}.key|SSLCertificateKeyFile /etc/letsencrypt/live/{self.domain}/privkey.pem|g' /etc/apache2/sites-available/{self.domain}.conf
    sudo apache2ctl configtest && sudo systemctl reload apache2
fi

# Setup auto-renewal
if [ "{ssl_config['auto_renew']}" = "True" ]; then
    echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload {server_config['web_server']}" | sudo tee -a /etc/crontab
fi

echo "SSL certificate installation completed"
echo "Certificate will auto-renew every 12 hours"
'''
        
        results = {
            'provider': 'letsencrypt',
            'installation_script': certbot_script,
            'certificate_path': f'/etc/letsencrypt/live/{self.domain}/',
            'auto_renewal': ssl_config['auto_renew'],
            'manual_steps': [
                "1. Ensure domain points to server IP",
                "2. Run the SSL installation script as root",
                "3. Verify certificate: certbot certificates",
                "4. Test SSL: https://{domain}".format(domain=self.domain)
            ]
        }
        
        self.log_action("Let's Encrypt SSL", "Script Generated", "Ready for installation")
        return results
    
    def generate_monitoring_setup(self) -> Dict:
        """Generate monitoring and health check configuration"""
        logger.info("Setting up monitoring and health checks")
        
        monitoring_config = self.config['monitoring']
        
        # Simple monitoring script
        monitor_script = f'''#!/bin/bash
# Simple monitoring script for {self.domain}
# Generated on {datetime.now().isoformat()}

DOMAIN="{self.domain}"
ALERT_EMAIL="{monitoring_config['alert_email']}"
CHECK_INTERVAL={monitoring_config['check_interval']}
LOG_FILE="/var/log/{self.domain}_monitor.log"

log_message() {{
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}}

check_endpoint() {{
    local endpoint="$1"
    local url="https://$DOMAIN$endpoint"
    
    response=$(curl -s -o /dev/null -w "%{{http_code}}" --connect-timeout 10 "$url")
    
    if [ "$response" = "200" ]; then
        log_message "OK: $url (HTTP $response)"
        return 0
    else
        log_message "ERROR: $url (HTTP $response)"
        return 1
    fi
}}

send_alert() {{
    local message="$1"
    
    # Simple email alert (requires mail command)
    if command -v mail > /dev/null; then
        echo "$message" | mail -s "Alert: {self.domain} Monitor" "$ALERT_EMAIL"
    fi
    
    log_message "ALERT: $message"
}}

# Main monitoring loop
while true; do
    all_ok=true
    
    # Check each endpoint
'''
        
        for endpoint in monitoring_config['endpoints']:
            monitor_script += f'''    if ! check_endpoint "{endpoint}"; then
        all_ok=false
    fi
    
'''
        
        monitor_script += f'''    # Check DNS resolution
    if ! nslookup "$DOMAIN" > /dev/null 2>&1; then
        log_message "ERROR: DNS resolution failed for $DOMAIN"
        all_ok=false
    fi
    
    # Send alert if any check failed
    if [ "$all_ok" = false ]; then
        send_alert "Health checks failed for $DOMAIN"
    fi
    
    sleep $CHECK_INTERVAL
done
'''
        
        systemd_service = f'''[Unit]
Description=Website Monitor for {self.domain}
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
ExecStart=/usr/local/bin/{self.domain}_monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
'''
        
        install_script = f'''#!/bin/bash
# Install monitoring service for {self.domain}

# Copy monitor script
sudo tee /usr/local/bin/{self.domain}_monitor.sh > /dev/null <<'EOF'
{monitor_script}
EOF

sudo chmod +x /usr/local/bin/{self.domain}_monitor.sh

# Install systemd service
sudo tee /etc/systemd/system/{self.domain}-monitor.service > /dev/null <<'EOF'
{systemd_service}
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable {self.domain}-monitor.service
sudo systemctl start {self.domain}-monitor.service

echo "Monitoring service installed and started"
echo "Check status: systemctl status {self.domain}-monitor.service"
echo "View logs: journalctl -u {self.domain}-monitor.service -f"
'''
        
        results = {
            'monitoring_script': monitor_script,
            'systemd_service': systemd_service,
            'install_script': install_script,
            'log_file': f"/var/log/{self.domain}_monitor.log",
            'manual_steps': [
                "1. Run the monitoring install script as root",
                "2. Verify service is running: systemctl status {domain}-monitor.service".format(domain=self.domain),
                "3. Configure email alerts (install mail command)",
                "4. Review logs periodically"
            ]
        }
        
        self.log_action("Monitoring Setup", "Generated", "Service configuration ready")
        return results
    
    def run_final_validation(self) -> Dict:
        """Run final validation of recovery"""
        logger.info("Running final validation")
        
        validation_script = f'''#!/bin/bash
# Final validation script for {self.domain} recovery

echo "=== Domain Recovery Validation ==="
echo "Domain: {self.domain}"
echo "Timestamp: $(date)"
echo

# Check DNS resolution
echo "1. Testing DNS resolution..."
if nslookup {self.domain} > /dev/null 2>&1; then
    echo "✓ DNS resolution successful"
    echo "  IPv4: $(dig +short A {self.domain})"
    echo "  IPv6: $(dig +short AAAA {self.domain})"
else
    echo "✗ DNS resolution failed"
fi

# Check HTTP connectivity
echo
echo "2. Testing HTTP connectivity..."
if curl -s -o /dev/null -w "%{{http_code}}" http://{self.domain} | grep -q "301\\|302\\|200"; then
    echo "✓ HTTP accessible"
else
    echo "✗ HTTP not accessible"
fi

# Check HTTPS connectivity
echo
echo "3. Testing HTTPS connectivity..."
if curl -s -o /dev/null -w "%{{http_code}}" https://{self.domain} | grep -q "200"; then
    echo "✓ HTTPS accessible"
    echo "  SSL certificate info:"
    echo | openssl s_client -servername {self.domain} -connect {self.domain}:443 2>/dev/null | openssl x509 -noout -dates
else
    echo "✗ HTTPS not accessible"
fi

# Check web server status
echo
echo "4. Testing web server..."
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
elif systemctl is-active --quiet apache2; then
    echo "✓ Apache is running"
elif systemctl is-active --quiet httpd; then
    echo "✓ Apache (httpd) is running"
else
    echo "✗ No web server detected"
fi

# Check monitoring service
echo
echo "5. Testing monitoring service..."
if systemctl is-active --quiet {self.domain}-monitor.service; then
    echo "✓ Monitoring service is running"
else
    echo "✗ Monitoring service not running"
fi

echo
echo "=== Validation Complete ==="
'''
        
        results = {
            'validation_script': validation_script,
            'manual_steps': [
                "1. Run the validation script to verify recovery",
                "2. Test domain access from external network",
                "3. Verify SSL certificate validity",
                "4. Check monitoring alerts are working",
                "5. Document recovery process and configuration"
            ]
        }
        
        self.log_action("Final Validation", "Script Generated", "Ready for validation")
        return results
    
    def run_complete_recovery(self) -> Dict:
        """Run complete domain recovery process"""
        logger.info(f"Starting complete domain recovery for {self.domain}")
        
        start_time = time.time()
        
        recovery_results = {
            'domain': self.domain,
            'timestamp': datetime.now().isoformat(),
            'phases': {},
            'recovery_log': []
        }
        
        # Phase 1: Domain Verification
        self.log_action("Recovery Process", "Started", "Beginning complete recovery")
        recovery_results['phases']['domain_verification'] = self.verify_domain_status()
        
        # Phase 2: DNS Setup
        recovery_results['phases']['dns_setup'] = self.setup_dns_configuration()
        
        # Phase 3: Server Configuration
        recovery_results['phases']['server_configuration'] = self.configure_web_server()
        
        # Phase 4: SSL Installation
        recovery_results['phases']['ssl_installation'] = self.setup_ssl_certificate()
        
        # Phase 5: Monitoring Setup
        recovery_results['phases']['monitoring_setup'] = self.generate_monitoring_setup()
        
        # Phase 6: Final Validation
        recovery_results['phases']['final_validation'] = self.run_final_validation()
        
        recovery_results['total_duration'] = time.time() - start_time
        recovery_results['recovery_log'] = self.recovery_log
        recovery_results['summary'] = self.generate_recovery_summary(recovery_results)
        
        self.log_action("Recovery Process", "Completed", f"Total time: {recovery_results['total_duration']:.2f}s")
        
        return recovery_results
    
    def generate_recovery_summary(self, results: Dict) -> Dict:
        """Generate recovery process summary"""
        summary = {
            'status': 'completed',
            'phases_completed': len(results['phases']),
            'manual_actions_required': [],
            'scripts_generated': [],
            'next_steps': []
        }
        
        # Collect manual actions from each phase
        for phase_name, phase_data in results['phases'].items():
            if 'manual_steps' in phase_data:
                summary['manual_actions_required'].extend([
                    f"{phase_name}: {step}" for step in phase_data['manual_steps']
                ])
            
            # Track generated scripts
            if 'install_script' in phase_data or 'installation_script' in phase_data:
                summary['scripts_generated'].append(f"{phase_name}: Installation script")
            
            if 'config_file' in phase_data:
                summary['scripts_generated'].append(f"{phase_name}: Configuration file")
        
        # Next steps
        summary['next_steps'] = [
            "1. Execute DNS configuration scripts/commands",
            "2. Run server installation scripts",
            "3. Install SSL certificates",
            "4. Deploy monitoring services",
            "5. Run final validation script",
            "6. Test domain accessibility",
            "7. Document configuration for future reference"
        ]
        
        return summary
    
    def export_recovery_package(self, output_dir: str = None) -> str:
        """Export complete recovery package"""
        if not output_dir:
            output_dir = f"domain_recovery_{self.domain}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Run recovery process if not already done
        if not self.results:
            self.results = self.run_complete_recovery()
        
        # Export all scripts and configurations
        scripts_dir = os.path.join(output_dir, 'scripts')
        configs_dir = os.path.join(output_dir, 'configs')
        docs_dir = os.path.join(output_dir, 'documentation')
        
        for dir_path in [scripts_dir, configs_dir, docs_dir]:
            os.makedirs(dir_path, exist_ok=True)
        
        # Export phase-specific files
        for phase_name, phase_data in self.results['phases'].items():
            if 'install_script' in phase_data:
                script_path = os.path.join(scripts_dir, f"{phase_name}_install.sh")
                with open(script_path, 'w') as f:
                    f.write(phase_data['install_script'])
                os.chmod(script_path, 0o755)
            
            if 'installation_script' in phase_data:
                script_path = os.path.join(scripts_dir, f"{phase_name}_install.sh")
                with open(script_path, 'w') as f:
                    f.write(phase_data['installation_script'])
                os.chmod(script_path, 0o755)
            
            if 'config_file' in phase_data:
                config_path = os.path.join(configs_dir, f"{phase_name}.conf")
                with open(config_path, 'w') as f:
                    f.write(phase_data['config_file'])
            
            if 'validation_script' in phase_data:
                script_path = os.path.join(scripts_dir, f"{phase_name}.sh")
                with open(script_path, 'w') as f:
                    f.write(phase_data['validation_script'])
                os.chmod(script_path, 0o755)
        
        # Export comprehensive results
        results_path = os.path.join(output_dir, 'recovery_results.json')
        with open(results_path, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        # Generate README
        readme_content = f"""# Domain Recovery Package: {self.domain}

Generated on: {datetime.now().isoformat()}

## Overview
This package contains all necessary scripts and configurations to recover the domain {self.domain}.

## Directory Structure
- `scripts/` - Executable installation and configuration scripts
- `configs/` - Configuration files for web servers and services
- `documentation/` - Additional documentation and guides
- `recovery_results.json` - Detailed recovery process results

## Recovery Process
Execute the following steps in order:

{chr(10).join([f"{i+1}. {step}" for i, step in enumerate(self.results['summary']['next_steps'])])}

## Manual Actions Required
{chr(10).join([f"- {action}" for action in self.results['summary']['manual_actions_required']])}

## Generated Scripts
{chr(10).join([f"- {script}" for script in self.results['summary']['scripts_generated']])}

## Support
Review the recovery_results.json file for detailed information about each phase.
Check individual script files for specific installation instructions.

Recovery completed in {self.results['total_duration']:.2f} seconds.
Total phases completed: {self.results['summary']['phases_completed']}
"""
        
        readme_path = os.path.join(output_dir, 'README.md')
        with open(readme_path, 'w') as f:
            f.write(readme_content)
        
        self.log_action("Package Export", "Completed", f"Recovery package exported to {output_dir}")
        return output_dir

def main():
    """CLI interface for domain recovery automation"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Domain Recovery Automation System')
    parser.add_argument('domain', help='Domain name to recover')
    parser.add_argument('--config', '-c', help='Configuration file path')
    parser.add_argument('--export', '-e', help='Export recovery package to directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    automator = DomainRecoveryAutomator(args.domain, args.config)
    results = automator.run_complete_recovery()
    
    # Print summary
    print(f"\n=== Domain Recovery Complete: {args.domain} ===")
    print(f"Recovery completed: {results['timestamp']}")
    print(f"Total duration: {results['total_duration']:.2f} seconds")
    print(f"Phases completed: {results['summary']['phases_completed']}")
    
    summary = results['summary']
    
    print(f"\n📋 Scripts Generated: {len(summary['scripts_generated'])}")
    for script in summary['scripts_generated']:
        print(f"  • {script}")
    
    print(f"\n⚠️  Manual Actions Required: {len(summary['manual_actions_required'])}")
    for action in summary['manual_actions_required'][:5]:  # Show first 5
        print(f"  • {action}")
    if len(summary['manual_actions_required']) > 5:
        print(f"  ... and {len(summary['manual_actions_required']) - 5} more")
    
    print(f"\n🔧 Next Steps:")
    for step in summary['next_steps'][:3]:  # Show first 3
        print(f"  {step}")
    print("  ... (see full recovery package for complete steps)")
    
    # Export package
    if args.export:
        package_path = automator.export_recovery_package(args.export)
        print(f"\n📦 Recovery package exported to: {package_path}")
    else:
        package_path = automator.export_recovery_package()
        print(f"\n📦 Recovery package exported to: {package_path}")

if __name__ == "__main__":
    main()