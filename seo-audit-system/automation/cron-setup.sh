#!/bin/bash

# SEO Audit System - Automated Scheduling Setup
# This script sets up automated SEO audits using cron jobs

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

print_status "Setting up automated SEO audit scheduling..."
echo "Project root: $PROJECT_ROOT"

# Check if cron is available
if ! command -v cron &> /dev/null; then
    print_error "Cron is not installed or not available"
    echo "Please install cron to use automated scheduling:"
    echo "  Ubuntu/Debian: sudo apt-get install cron"
    echo "  CentOS/RHEL: sudo yum install cronie"
    echo "  macOS: Cron should be available by default"
    exit 1
fi

# Create automation scripts directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/automation/scripts"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/data/history"

# Function to get user input
get_user_input() {
    read -p "Enter the website URL to audit: " WEBSITE_URL
    
    if [[ ! "$WEBSITE_URL" =~ ^https?:// ]]; then
        WEBSITE_URL="https://$WEBSITE_URL"
    fi
    
    echo "Scheduling options:"
    echo "1. Daily quick audit (technical + performance)"
    echo "2. Weekly comprehensive audit (all modules)"
    echo "3. Monthly competitive analysis"
    echo "4. Custom schedule"
    
    read -p "Select scheduling option (1-4): " SCHEDULE_OPTION
    
    case $SCHEDULE_OPTION in
        1)
            CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM
            AUDIT_TYPE="quick"
            DESCRIPTION="Daily quick audit"
            ;;
        2)
            CRON_SCHEDULE="0 3 * * 0"  # Weekly on Sunday at 3 AM
            AUDIT_TYPE="comprehensive"
            DESCRIPTION="Weekly comprehensive audit"
            ;;
        3)
            CRON_SCHEDULE="0 4 1 * *"  # Monthly on 1st at 4 AM
            AUDIT_TYPE="competitive"
            DESCRIPTION="Monthly competitive analysis"
            ;;
        4)
            echo "Enter custom cron schedule (format: minute hour day month weekday)"
            echo "Examples:"
            echo "  0 2 * * * - Daily at 2 AM"
            echo "  0 3 * * 1 - Weekly on Monday at 3 AM"
            echo "  0 4 1,15 * * - Twice monthly on 1st and 15th at 4 AM"
            read -p "Cron schedule: " CRON_SCHEDULE
            
            echo "Audit types:"
            echo "1. Quick (technical + performance)"
            echo "2. Comprehensive (all modules)"
            echo "3. Technical only"
            echo "4. Performance only"
            echo "5. Content only"
            echo "6. Competitive only"
            
            read -p "Select audit type (1-6): " CUSTOM_AUDIT_TYPE
            
            case $CUSTOM_AUDIT_TYPE in
                1) AUDIT_TYPE="quick"; DESCRIPTION="Custom quick audit" ;;
                2) AUDIT_TYPE="comprehensive"; DESCRIPTION="Custom comprehensive audit" ;;
                3) AUDIT_TYPE="technical"; DESCRIPTION="Custom technical audit" ;;
                4) AUDIT_TYPE="performance"; DESCRIPTION="Custom performance audit" ;;
                5) AUDIT_TYPE="content"; DESCRIPTION="Custom content audit" ;;
                6) AUDIT_TYPE="competitive"; DESCRIPTION="Custom competitive audit" ;;
                *) print_error "Invalid option"; exit 1 ;;
            esac
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
    
    read -p "Email address for notifications (optional): " EMAIL_ADDRESS
    read -p "Slack webhook URL for notifications (optional): " SLACK_WEBHOOK
}

# Create audit execution script
create_audit_script() {
    local audit_type="$1"
    local website_url="$2"
    local email="$3"
    local slack_webhook="$4"
    
    local script_path="$PROJECT_ROOT/automation/scripts/run_${audit_type}_audit.sh"
    
    cat > "$script_path" << EOF
#!/bin/bash

# Automated SEO Audit Script - ${audit_type}
# Generated on $(date)

set -e

# Configuration
WEBSITE_URL="$website_url"
AUDIT_TYPE="$audit_type"
PROJECT_ROOT="$PROJECT_ROOT"
EMAIL_ADDRESS="$email"
SLACK_WEBHOOK="$slack_webhook"

# Logging
LOG_FILE="\$PROJECT_ROOT/logs/automated_audit_\$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "\$LOG_FILE")
exec 2>&1

echo "Starting automated SEO audit - \$AUDIT_TYPE"
echo "Website: \$WEBSITE_URL"
echo "Timestamp: \$(date)"
echo "=================================="

# Change to project directory
cd "\$PROJECT_ROOT"

# Activate Python virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi

# Run audit based on type
case \$AUDIT_TYPE in
    "quick")
        echo "Running quick audit (technical + performance)..."
        python3 scripts/technical-audit.py "\$WEBSITE_URL" || echo "Technical audit failed"
        python3 scripts/performance-audit.py "\$WEBSITE_URL" || echo "Performance audit failed"
        ;;
    "comprehensive")
        echo "Running comprehensive audit (all modules)..."
        python3 scripts/technical-audit.py "\$WEBSITE_URL" || echo "Technical audit failed"
        python3 scripts/performance-audit.py "\$WEBSITE_URL" || echo "Performance audit failed"
        python3 scripts/content-audit.py "\$WEBSITE_URL" || echo "Content audit failed"
        python3 scripts/competitive-audit.py "\$WEBSITE_URL" || echo "Competitive audit failed"
        ;;
    "technical")
        echo "Running technical audit..."
        python3 scripts/technical-audit.py "\$WEBSITE_URL"
        ;;
    "performance")
        echo "Running performance audit..."
        python3 scripts/performance-audit.py "\$WEBSITE_URL"
        ;;
    "content")
        echo "Running content audit..."
        python3 scripts/content-audit.py "\$WEBSITE_URL"
        ;;
    "competitive")
        echo "Running competitive audit..."
        python3 scripts/competitive-audit.py "\$WEBSITE_URL"
        ;;
    *)
        echo "Unknown audit type: \$AUDIT_TYPE"
        exit 1
        ;;
esac

# Generate report
echo "Generating report..."
python3 scripts/generate-report.py --latest || echo "Report generation failed"

# Archive results
ARCHIVE_DIR="\$PROJECT_ROOT/data/history/\$(date +%Y-%m)"
mkdir -p "\$ARCHIVE_DIR"
cp reports/*.json "\$ARCHIVE_DIR/" 2>/dev/null || true

echo "Audit completed successfully!"

# Send notifications
if [ -n "\$EMAIL_ADDRESS" ]; then
    echo "Sending email notification..."
    \$PROJECT_ROOT/automation/scripts/send_notification.py email "\$EMAIL_ADDRESS" "\$LOG_FILE" || echo "Email notification failed"
fi

if [ -n "\$SLACK_WEBHOOK" ]; then
    echo "Sending Slack notification..."
    \$PROJECT_ROOT/automation/scripts/send_notification.py slack "\$SLACK_WEBHOOK" "\$LOG_FILE" || echo "Slack notification failed"
fi

EOF

    chmod +x "$script_path"
    echo "$script_path"
}

# Create notification script
create_notification_script() {
    local script_path="$PROJECT_ROOT/automation/scripts/send_notification.py"
    
    cat > "$script_path" << 'EOF'
#!/usr/bin/env python3
"""
SEO Audit Notification Script
Send notifications via email or Slack after audit completion
"""

import json
import logging
import smtplib
import sys
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import requests

def send_email_notification(email_address: str, log_file: str):
    """Send email notification with audit summary"""
    try:
        # Read log file for summary
        with open(log_file, 'r') as f:
            log_content = f.read()
            
        # Extract key information
        subject = f"SEO Audit Completed - {datetime.now().strftime('%Y-%m-%d')}"
        
        # Create summary from log
        lines = log_content.split('\n')
        summary_lines = [line for line in lines if any(keyword in line.lower() 
                        for keyword in ['completed', 'score', 'issues', 'recommendations'])]
        
        summary = '\n'.join(summary_lines[-10:])  # Last 10 relevant lines
        
        body = f"""
SEO Audit Notification
======================

Your automated SEO audit has been completed.

Summary:
{summary}

Full log file: {log_file}

This is an automated message from the SEO Audit System.
        """
        
        # Note: Email sending requires SMTP configuration
        # This is a placeholder - configure with your SMTP settings
        print(f"Email notification prepared for {email_address}")
        print(f"Subject: {subject}")
        print(f"Body preview: {body[:200]}...")
        
    except Exception as e:
        print(f"Error sending email notification: {e}")

def send_slack_notification(webhook_url: str, log_file: str):
    """Send Slack notification with audit summary"""
    try:
        # Read log file for summary
        with open(log_file, 'r') as f:
            log_content = f.read()
            
        # Extract key information
        lines = log_content.split('\n')
        summary_lines = [line for line in lines if any(keyword in line.lower() 
                        for keyword in ['completed', 'score', 'issues', 'recommendations'])]
        
        summary = '\n'.join(summary_lines[-5:])  # Last 5 relevant lines
        
        # Create Slack message
        message = {
            "text": "SEO Audit Completed",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🔍 SEO Audit Completed"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Timestamp:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n*Status:* Completed"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Summary:*\n```{summary}```"
                    }
                }
            ]
        }
        
        # Send to Slack
        response = requests.post(webhook_url, json=message, timeout=10)
        response.raise_for_status()
        
        print("Slack notification sent successfully")
        
    except Exception as e:
        print(f"Error sending Slack notification: {e}")

def main():
    if len(sys.argv) < 4:
        print("Usage: python send_notification.py <email|slack> <address/webhook> <log_file>")
        sys.exit(1)
        
    notification_type = sys.argv[1]
    address = sys.argv[2]
    log_file = sys.argv[3]
    
    if notification_type == "email":
        send_email_notification(address, log_file)
    elif notification_type == "slack":
        send_slack_notification(address, log_file)
    else:
        print(f"Unknown notification type: {notification_type}")
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

    chmod +x "$script_path"
}

# Create monitoring dashboard script
create_monitoring_script() {
    local script_path="$PROJECT_ROOT/automation/scripts/monitor_trends.py"
    
    cat > "$script_path" << 'EOF'
#!/usr/bin/env python3
"""
SEO Audit Trend Monitoring
Monitor SEO performance trends over time
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

class SEOTrendMonitor:
    def __init__(self, data_dir: str = "data/history"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def collect_historical_data(self, days: int = 30) -> Dict:
        """Collect historical audit data from the last N days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        historical_data = {
            'technical_scores': [],
            'performance_scores': [],
            'content_scores': [],
            'dates': []
        }
        
        # Look through monthly archives
        for month_dir in self.data_dir.iterdir():
            if not month_dir.is_dir():
                continue
                
            for audit_file in month_dir.glob("*.json"):
                try:
                    # Parse timestamp from filename
                    timestamp_str = audit_file.stem.split('_')[-2] + '_' + audit_file.stem.split('_')[-1]
                    file_date = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                    
                    if file_date < cutoff_date:
                        continue
                        
                    # Load and parse audit data
                    with open(audit_file, 'r') as f:
                        audit_data = json.load(f)
                        
                    # Extract scores based on audit type
                    if 'technical_audit' in audit_file.name:
                        score = self.calculate_technical_score(audit_data)
                        if score is not None:
                            historical_data['technical_scores'].append((file_date, score))
                            
                    elif 'performance_audit' in audit_file.name:
                        score = audit_data.get('summary', {}).get('overall_score', 0)
                        if score > 0:
                            historical_data['performance_scores'].append((file_date, score))
                            
                    elif 'content_audit' in audit_file.name:
                        score = audit_data.get('summary', {}).get('seo_optimization_score', 0)
                        if score > 0:
                            historical_data['content_scores'].append((file_date, score))
                            
                except Exception as e:
                    logging.error(f"Error processing {audit_file}: {e}")
                    
        return historical_data
    
    def calculate_technical_score(self, technical_data: Dict) -> int:
        """Calculate technical SEO score from audit data"""
        score = 0
        
        if technical_data.get('robots_txt', {}).get('exists'):
            score += 20
        if technical_data.get('sitemap', {}).get('found_sitemaps'):
            score += 20
        if technical_data.get('ssl_certificate', {}).get('https_supported'):
            score += 20
            
        # Check pages for meta tags and headers
        for page in technical_data.get('pages', []):
            meta_issues = len(page.get('meta_tags', {}).get('issues', []))
            if meta_issues == 0:
                score += 20
            elif meta_issues <= 2:
                score += 10
                
            header_issues = len(page.get('header_structure', {}).get('issues', []))
            if header_issues == 0:
                score += 20
            elif header_issues <= 1:
                score += 10
            break
            
        return min(score, 100)
    
    def generate_trend_report(self, output_file: str = None):
        """Generate trend analysis report"""
        historical_data = self.collect_historical_data()
        
        if not any(historical_data.values()):
            print("No historical data found for trend analysis")
            return
            
        # Create plots
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('SEO Performance Trends (Last 30 Days)', fontsize=16)
        
        # Technical scores trend
        if historical_data['technical_scores']:
            dates, scores = zip(*historical_data['technical_scores'])
            axes[0, 0].plot(dates, scores, marker='o')
            axes[0, 0].set_title('Technical SEO Score')
            axes[0, 0].set_ylabel('Score')
            axes[0, 0].tick_params(axis='x', rotation=45)
            
        # Performance scores trend
        if historical_data['performance_scores']:
            dates, scores = zip(*historical_data['performance_scores'])
            axes[0, 1].plot(dates, scores, marker='o', color='orange')
            axes[0, 1].set_title('Performance Score')
            axes[0, 1].set_ylabel('Score')
            axes[0, 1].tick_params(axis='x', rotation=45)
            
        # Content scores trend
        if historical_data['content_scores']:
            dates, scores = zip(*historical_data['content_scores'])
            axes[1, 0].plot(dates, scores, marker='o', color='green')
            axes[1, 0].set_title('Content SEO Score')
            axes[1, 0].set_ylabel('Score')
            axes[1, 0].tick_params(axis='x', rotation=45)
            
        # Summary statistics
        summary_text = self.generate_summary_stats(historical_data)
        axes[1, 1].text(0.1, 0.5, summary_text, transform=axes[1, 1].transAxes, 
                       fontsize=10, verticalalignment='center')
        axes[1, 1].set_title('Summary Statistics')
        axes[1, 1].axis('off')
        
        plt.tight_layout()
        
        if not output_file:
            output_file = f"reports/trend_analysis_{datetime.now().strftime('%Y%m%d')}.png"
            
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"Trend analysis saved to: {output_file}")
        
    def generate_summary_stats(self, historical_data: Dict) -> str:
        """Generate summary statistics text"""
        stats = []
        
        for score_type, data in historical_data.items():
            if data and score_type.endswith('_scores'):
                scores = [score for date, score in data]
                avg_score = sum(scores) / len(scores)
                trend = "↑" if len(scores) > 1 and scores[-1] > scores[0] else "↓"
                
                stats.append(f"{score_type.replace('_scores', '').title()}:")
                stats.append(f"  Average: {avg_score:.1f}")
                stats.append(f"  Trend: {trend}")
                stats.append("")
                
        return "\n".join(stats)

def main():
    monitor = SEOTrendMonitor()
    monitor.generate_trend_report()

if __name__ == "__main__":
    main()
EOF

    chmod +x "$script_path"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    cat << 'EOF'
   _____  _____ ____     ___       __  __       ___       __  
  / ___/ / ___// __ \   /   |     / / / /      /   |     / /_ 
  \__ \ / /   / / / /  / /| |    / / / /      / /| |    / __/ 
 ___/ // /___/ /_/ /  / ___ |   / /_/ /      / ___ |   / /_   
/____/ \____/_____/  /_/  |_|   \____/      /_/  |_|   \__/   
EOF
    echo -e "${NC}"
    echo "Automated SEO Audit Scheduling Setup"
    echo "===================================="
    
    # Get user input
    get_user_input
    
    # Create necessary scripts
    print_status "Creating audit execution script..."
    audit_script=$(create_audit_script "$AUDIT_TYPE" "$WEBSITE_URL" "$EMAIL_ADDRESS" "$SLACK_WEBHOOK")
    
    print_status "Creating notification script..."
    create_notification_script
    
    print_status "Creating monitoring script..."
    create_monitoring_script
    
    # Add cron job
    print_status "Setting up cron job..."
    
    # Create temporary crontab file
    TEMP_CRON=$(mktemp)
    
    # Get existing crontab (if any)
    crontab -l 2>/dev/null > "$TEMP_CRON" || true
    
    # Add our cron job
    echo "# SEO Audit System - $DESCRIPTION" >> "$TEMP_CRON"
    echo "$CRON_SCHEDULE $audit_script" >> "$TEMP_CRON"
    echo "" >> "$TEMP_CRON"
    
    # Install new crontab
    crontab "$TEMP_CRON"
    rm "$TEMP_CRON"
    
    print_status "Setup completed successfully! 🎉"
    echo ""
    echo "Configuration Summary:"
    echo "======================"
    echo "Website URL: $WEBSITE_URL"
    echo "Audit Type: $AUDIT_TYPE"
    echo "Schedule: $CRON_SCHEDULE ($DESCRIPTION)"
    echo "Audit Script: $audit_script"
    
    if [ -n "$EMAIL_ADDRESS" ]; then
        echo "Email Notifications: $EMAIL_ADDRESS"
    fi
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        echo "Slack Notifications: Configured"
    fi
    
    echo ""
    echo "Management Commands:"
    echo "==================="
    echo "View cron jobs: crontab -l"
    echo "Edit cron jobs: crontab -e"
    echo "View logs: tail -f $PROJECT_ROOT/logs/automated_audit_*.log"
    echo "Generate trend report: $PROJECT_ROOT/automation/scripts/monitor_trends.py"
    echo ""
    print_warning "Make sure the system user running cron has access to the project directory and Python environment"
    print_warning "Test the audit script manually before relying on automated execution"
}

# Run main function
main "$@"