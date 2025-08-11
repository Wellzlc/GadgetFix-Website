# Website Accessibility Diagnostic and Recovery Toolkit

A comprehensive suite of tools for diagnosing and recovering completely inaccessible websites with DNS, hosting, and configuration failures.

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run comprehensive diagnostic
python master_diagnostic.py your-domain.com

# View results
ls comprehensive_diagnostic_your-domain.com_*/
```

## 📦 Toolkit Components

### 1. Master Diagnostic Tool (`master_diagnostic.py`)
**The main orchestration tool that runs all diagnostic phases.**

```bash
# Run complete diagnostic suite
python master_diagnostic.py example.com

# Export results to specific directory
python master_diagnostic.py example.com --export my_diagnosis

# Run specific diagnostic phase only
python master_diagnostic.py example.com --phase 3

# Verbose output with debugging
python master_diagnostic.py example.com --verbose
```

**What it does:**
- Orchestrates all diagnostic tools in logical sequence
- Generates comprehensive recovery package
- Provides executive summary with immediate action items
- Exports all results, scripts, and documentation

### 2. Domain Registration Diagnostic (`domain_diagnostic.py`)
**WHOIS analysis and domain registration verification.**

```bash
# Check domain registration status
python domain_diagnostic.py example.com

# Export detailed WHOIS data
python domain_diagnostic.py example.com --export domain_analysis.json
```

**Features:**
- Domain registration status and expiration
- Registrar and nameserver information
- Domain availability checking for similar TLDs
- WHOIS data parsing and validation

### 3. DNS Configuration Analyzer (`dns_analyzer.py`)
**Comprehensive DNS record analysis and security assessment.**

```bash
# Analyze DNS configuration
python dns_analyzer.py example.com

# Export DNS analysis
python dns_analyzer.py example.com --export dns_report.json
```

**Features:**
- All DNS record types analysis (A, AAAA, MX, TXT, etc.)
- Global DNS propagation testing
- Nameserver health and performance analysis
- DNS security features (DNSSEC, CAA, SPF, DMARC)
- DNS over HTTPS testing

### 4. Server Connectivity Tester (`server_connectivity.py`)
**Network connectivity, port scanning, and server response analysis.**

```bash
# Test server connectivity
python server_connectivity.py example.com

# Custom timeout and export
python server_connectivity.py example.com --timeout 15 --export connectivity.json
```

**Features:**
- Multi-IP resolution testing
- Port scanning (web ports and common services)
- HTTP/HTTPS response analysis
- Network performance (ping, traceroute)
- Connection error diagnosis

### 5. SSL Certificate Analyzer (`ssl_certificate_analyzer.py`)
**SSL/TLS certificate validation and security analysis.**

```bash
# Analyze SSL certificate
python ssl_certificate_analyzer.py example.com

# Check specific port
python ssl_certificate_analyzer.py example.com --port 8443
```

**Features:**
- Certificate chain validation
- Expiration date monitoring
- Security grade assessment
- Cipher suite analysis
- Protocol version testing
- Security headers evaluation

### 6. Domain Recovery Automation (`domain_recovery_automation.py`)
**Automated recovery script generation and configuration management.**

```bash
# Generate recovery package
python domain_recovery_automation.py example.com

# Use custom configuration
python domain_recovery_automation.py example.com --config recovery_config.json

# Export to specific directory
python domain_recovery_automation.py example.com --export recovery_package/
```

**Features:**
- DNS configuration scripts (Cloudflare, Route53, generic)
- Web server setup (Nginx, Apache)
- SSL certificate installation (Let's Encrypt)
- Monitoring system deployment
- Complete recovery documentation

### 7. Website Monitor (`website_monitor.py`)
**Real-time monitoring, alerting, and performance tracking.**

```bash
# Create sample configuration
python website_monitor.py --create-config

# Start monitoring daemon
python website_monitor.py --daemon --config monitor_config.json

# View current status
python website_monitor.py --status --config monitor_config.json
```

**Features:**
- Multi-endpoint health checking
- Email and webhook alerting
- Performance metrics collection
- SQLite database logging
- Real-time status reporting
- Uptime and response time tracking

## 🔧 Configuration

### Recovery Configuration (`recovery_config.json`)
```json
{
  "dns": {
    "provider": "cloudflare",
    "ttl": 300,
    "records": [
      {"type": "A", "name": "@", "value": "192.0.2.1"},
      {"type": "A", "name": "www", "value": "192.0.2.1"}
    ]
  },
  "server": {
    "web_server": "nginx",
    "document_root": "/var/www/html",
    "server_ip": "192.0.2.1"
  },
  "ssl": {
    "provider": "letsencrypt",
    "email": "admin@example.com",
    "auto_renew": true
  }
}
```

### Monitoring Configuration (`monitor_config.json`)
```json
{
  "targets": [
    {
      "name": "main_website",
      "url": "https://example.com",
      "check_interval": 60,
      "checks": ["http", "ssl", "dns"]
    }
  ],
  "alert_settings": {
    "email": {
      "enabled": true,
      "smtp_server": "smtp.gmail.com",
      "to_addresses": ["admin@example.com"]
    }
  }
}
```

## 📊 Diagnostic Decision Tree

```
1. Domain Resolution Check
   ├─ ❌ Domain not registered → Register domain
   ├─ ⚠️  Domain expires soon → Renew domain
   └─ ✅ Domain registered → Continue

2. DNS Configuration Analysis
   ├─ ❌ No A records → Configure DNS records
   ├─ ⚠️  Propagation issues → Wait/check nameservers
   └─ ✅ DNS working → Continue

3. Server Connectivity Test
   ├─ ❌ No IP resolution → Check DNS configuration
   ├─ ❌ No HTTP response → Setup web server
   └─ ✅ Server responding → Continue

4. SSL Certificate Analysis
   ├─ ❌ No HTTPS → Install SSL certificate
   ├─ ⚠️  Certificate expires soon → Renew certificate
   └─ ✅ SSL working → Continue

5. Recovery Planning
   └─ Generate automation scripts

6. Monitoring Setup
   └─ Configure ongoing monitoring
```

## 🛠️ Troubleshooting Common Issues

### Domain Not Registered
```bash
# Check domain availability
python domain_diagnostic.py example.com

# Look for registration recommendations
python master_diagnostic.py example.com --phase 1
```

**Solution:** Register domain with a reputable registrar.

### DNS Not Resolving
```bash
# Comprehensive DNS analysis
python dns_analyzer.py example.com

# Check specific DNS servers
python dns_analyzer.py example.com --verbose
```

**Solutions:**
- Configure A records pointing to server IP
- Update nameservers if using DNS service
- Wait for DNS propagation (up to 48 hours)

### Server Not Responding
```bash
# Test connectivity
python server_connectivity.py example.com

# Check port availability
python server_connectivity.py example.com --verbose
```

**Solutions:**
- Setup web server (use generated scripts)
- Configure firewall to allow HTTP/HTTPS
- Check server hosting status

### SSL Certificate Issues
```bash
# Analyze SSL configuration
python ssl_certificate_analyzer.py example.com

# Check certificate chain
python ssl_certificate_analyzer.py example.com --verbose
```

**Solutions:**
- Install SSL certificate (Let's Encrypt script provided)
- Fix certificate chain issues
- Update certificate if expired

## 📁 Generated Output Structure

```
comprehensive_diagnostic_domain.com_20240101_120000/
├── README.md                          # Comprehensive recovery guide
├── diagnostic_results.json            # Complete diagnostic data
├── phase_results/                     # Detailed phase results
│   ├── phase_1_full.json             # Domain registration details
│   ├── phase_2_full.json             # DNS analysis details
│   ├── phase_3_full.json             # Connectivity test details
│   ├── phase_4_full.json             # SSL certificate details
│   └── phase_5_full.json             # Recovery planning details
├── recovery_scripts/                  # Automation scripts
│   ├── dns_setup_install.sh          # DNS configuration script
│   ├── server_configuration_install.sh # Web server setup script
│   ├── ssl_installation_install.sh    # SSL certificate script
│   └── final_validation.sh           # Validation script
└── monitoring_config.json            # Monitoring configuration
```

## 🔄 Recovery Workflow

### Phase 1: Diagnosis
```bash
python master_diagnostic.py your-domain.com --export diagnosis_results
```

### Phase 2: Recovery Execution
```bash
cd diagnosis_results/recovery_scripts/

# 1. Configure DNS (follow provider-specific instructions)
# 2. Setup web server
sudo ./server_configuration_install.sh

# 3. Install SSL certificate  
sudo ./ssl_installation_install.sh

# 4. Validate recovery
./final_validation.sh
```

### Phase 3: Monitoring Setup
```bash
# Start monitoring
python website_monitor.py --daemon --config diagnosis_results/monitoring_config.json

# Check status
python website_monitor.py --status --config diagnosis_results/monitoring_config.json
```

### Phase 4: Validation
```bash
# Re-run diagnostic to verify fixes
python master_diagnostic.py your-domain.com --export post_recovery_results
```

## 🚨 Emergency Recovery Checklist

- [ ] **Domain Registration**: Verify domain is registered and not expired
- [ ] **DNS Configuration**: Ensure A records point to correct server IP
- [ ] **Nameserver Setup**: Configure authoritative nameservers
- [ ] **Server Setup**: Web server running and accessible on ports 80/443
- [ ] **SSL Certificate**: Valid certificate installed and configured
- [ ] **Firewall Rules**: HTTP (80) and HTTPS (443) ports open
- [ ] **Content Deployment**: Website files deployed to document root
- [ ] **Monitoring Active**: Health checks running and alerts configured

## 📧 Support and Maintenance

### Automated Monitoring
The toolkit includes comprehensive monitoring capabilities:
- Real-time health checking
- Email and webhook alerts  
- Performance metrics tracking
- Automatic issue detection

### Regular Maintenance
- SSL certificate renewal (automated with Let's Encrypt)
- DNS record validation
- Server performance monitoring
- Security updates and patches

## 🔐 Security Best Practices

- Use HTTPS with strong SSL/TLS configuration
- Enable DNSSEC for DNS security
- Configure CAA records to restrict certificate authorities
- Implement SPF, DKIM, and DMARC for email security
- Regular security monitoring and alerting
- Keep web server and SSL certificates updated

---

## 📞 Example Usage Scenarios

### Scenario 1: Completely Down Website
```bash
# Quick diagnosis
python master_diagnostic.py broken-site.com

# Expected output: Multiple critical issues identified
# Recovery package generated with step-by-step scripts
```

### Scenario 2: SSL Certificate Expired  
```bash
# Focused SSL analysis
python ssl_certificate_analyzer.py expired-ssl-site.com

# Generate new certificate
python domain_recovery_automation.py expired-ssl-site.com
# Execute SSL installation script
```

### Scenario 3: DNS Configuration Issues
```bash
# Detailed DNS analysis
python dns_analyzer.py dns-problem-site.com

# Check propagation across global DNS servers
# Generate DNS configuration scripts
```

### Scenario 4: Performance Monitoring
```bash
# Setup continuous monitoring
python website_monitor.py --create-config
# Edit monitor_config.json with your domains
python website_monitor.py --daemon --config monitor_config.json
```

This comprehensive toolkit provides everything needed to diagnose, recover, and monitor website accessibility issues. Each tool can be used independently or as part of the complete diagnostic suite.