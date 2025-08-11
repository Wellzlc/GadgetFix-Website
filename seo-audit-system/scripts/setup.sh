#!/bin/bash

# Ultimate SEO Audit System - Environment Setup Script
# This script installs and configures all required tools and dependencies

set -e

echo "🚀 Setting up Ultimate SEO Audit System..."
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_status "Checking operating system..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        PACKAGE_MANAGER="apt"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PACKAGE_MANAGER="brew"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        PACKAGE_MANAGER="choco"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    print_status "Detected OS: $OS"
}

# Install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    case $OS in
        "linux")
            sudo apt update
            sudo apt install -y curl wget git python3 python3-pip nodejs npm chromium-browser
            ;;
        "macos")
            if ! command -v brew &> /dev/null; then
                print_status "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            brew install curl wget git python3 node chromium
            ;;
        "windows")
            if ! command -v choco &> /dev/null; then
                print_warning "Chocolatey not found. Please install it manually from https://chocolatey.org/"
                print_warning "Then run this script again."
                exit 1
            fi
            choco install -y curl wget git python3 nodejs googlechrome
            ;;
    esac
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate || source venv/Scripts/activate 2>/dev/null || true
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install required Python packages
    pip install requests beautifulsoup4 pandas numpy matplotlib seaborn \
                lxml selenium webdriver-manager advertools seoanalyzer \
                python-sitemap-parser robotparser validators tldextract \
                textstat readability Pillow aiohttp asyncio plotly dash \
                python-whois dnspython certificate-transparency-monitor
    
    print_status "Python dependencies installed successfully"
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    
    # Install global packages
    npm install -g lighthouse @lhci/cli psi puppeteer axe-core pagespeed-insights \
                   lighthouse-ci web-vitals-cli sitemap-generator-cli
    
    # Create package.json for local dependencies
    cat > package.json << EOF
{
  "name": "seo-audit-system",
  "version": "1.0.0",
  "description": "Ultimate Terminal-Based SEO Audit System",
  "main": "index.js",
  "dependencies": {
    "lighthouse": "^10.0.0",
    "puppeteer": "^21.0.0",
    "axe-core": "^4.8.0",
    "cheerio": "^1.0.0-rc.12",
    "node-fetch": "^3.3.0",
    "commander": "^11.0.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0",
    "inquirer": "^9.2.0"
  }
}
EOF
    
    npm install
    print_status "Node.js dependencies installed successfully"
}

# Download and setup additional tools
setup_additional_tools() {
    print_status "Setting up additional SEO tools..."
    
    # Create tools directory
    mkdir -p tools
    
    # Download testssl.sh for SSL analysis
    if [ ! -f "tools/testssl.sh" ]; then
        print_status "Downloading testssl.sh..."
        curl -L https://github.com/drwetter/testssl.sh/archive/3.2.tar.gz | tar xz -C tools --strip-components=1
        chmod +x tools/testssl.sh
    fi
    
    # Download PageSpeed Insights CLI alternative
    if [ ! -f "tools/psi.js" ]; then
        print_status "Creating PageSpeed Insights wrapper..."
        cat > tools/psi.js << 'EOF'
#!/usr/bin/env node
const psi = require('psi');

const url = process.argv[2];
if (!url) {
    console.error('Usage: node psi.js <url>');
    process.exit(1);
}

psi(url, { strategy: 'mobile' }).then(data => {
    console.log(JSON.stringify(data, null, 2));
}).catch(err => {
    console.error('Error:', err.message);
});
EOF
        chmod +x tools/psi.js
    fi
}

# Create configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Lighthouse configuration
    cat > config/lighthouse-config.json << 'EOF'
{
  "extends": "lighthouse:default",
  "settings": {
    "formFactor": "mobile",
    "throttling": {
      "rttMs": 150,
      "throughputKbps": 1.6 * 1024,
      "cpuSlowdownMultiplier": 4
    },
    "screenEmulation": {
      "mobile": true,
      "width": 412,
      "height": 823,
      "deviceScaleFactor": 1.75
    },
    "emulatedUserAgent": "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36",
    "maxWaitForLoad": 45000,
    "maxWaitForFcp": 15000,
    "pauseAfterLoadMs": 1000,
    "networkQuietThresholdMs": 1000,
    "cpuQuietThresholdMs": 1000
  },
  "audits": [
    "first-contentful-paint",
    "largest-contentful-paint",
    "first-meaningful-paint",
    "speed-index",
    "screenshot-thumbnails",
    "final-screenshot",
    "cumulative-layout-shift",
    "total-blocking-time",
    "max-potential-fid",
    "server-response-time",
    "interactive",
    "user-timings",
    "critical-request-chains",
    "redirects",
    "installable-manifest",
    "apple-touch-icon",
    "splashscreen",
    "themed-omnibox",
    "maskable-icon",
    "content-width",
    "image-aspect-ratio",
    "image-size-responsive",
    "preload-fonts",
    "robots-txt",
    "tap-targets",
    "hreflang",
    "plugins",
    "canonical",
    "structured-data"
  ]
}
EOF

    # General audit settings
    cat > config/audit-settings.json << 'EOF'
{
  "general": {
    "timeout": 60000,
    "retries": 3,
    "delay_between_requests": 1000,
    "user_agent": "SEO-Audit-Bot/1.0 (Ultimate SEO Audit System)",
    "concurrent_requests": 5
  },
  "performance": {
    "core_web_vitals": {
      "lcp_threshold": 2.5,
      "inp_threshold": 200,
      "cls_threshold": 0.1
    },
    "page_speed": {
      "mobile_threshold": 85,
      "desktop_threshold": 90
    }
  },
  "seo": {
    "title_length": {
      "min": 30,
      "max": 60
    },
    "meta_description_length": {
      "min": 150,
      "max": 160
    },
    "h1_count": 1,
    "content_length": {
      "min": 300,
      "recommended": 1000
    }
  },
  "accessibility": {
    "wcag_level": "AA",
    "color_contrast_threshold": 4.5,
    "touch_target_size": 48
  },
  "technical": {
    "check_ssl": true,
    "check_robots": true,
    "check_sitemap": true,
    "check_schema": true,
    "check_canonical": true
  }
}
EOF

    # Default keywords file
    cat > config/keywords.txt << 'EOF'
# Add your target keywords here (one per line)
# Example:
# seo audit
# website optimization
# technical seo
# page speed optimization
# core web vitals
EOF

    # API configuration template
    cat > config/api-config.json << 'EOF'
{
  "google_pagespeed": {
    "api_key": "YOUR_GOOGLE_PAGESPEED_API_KEY",
    "endpoint": "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  },
  "google_search_console": {
    "client_id": "YOUR_GSC_CLIENT_ID",
    "client_secret": "YOUR_GSC_CLIENT_SECRET"
  },
  "screaming_frog": {
    "api_key": "YOUR_SCREAMING_FROG_API_KEY",
    "endpoint": "https://api.screamingfrog.co.uk/seo-spider/"
  }
}
EOF
}

# Set permissions
set_permissions() {
    print_status "Setting file permissions..."
    chmod +x scripts/*.py 2>/dev/null || true
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x *.sh 2>/dev/null || true
    chmod +x tools/* 2>/dev/null || true
}

# Main setup function
main() {
    echo -e "${BLUE}"
    cat << 'EOF'
   _____ ______ ____     ___            _____ __     _____           __
  / ___// ____/ __ \   /   |  __  __   / __(_) /_   / ___/__  _____ / /____  ____ _
  \__ \/ __/ / / / /  / /| | / / / /  / /_/ / __/   \__ \/ / / / __ / __ \ \/ __ `/
 ___/ / /___/ /_/ /  / ___ |/ /_/ /  / __/ / /_    ___/ / /_/ / /_/ / / / /  / /_/ /
/____/_____/\____/  /_/  |_|\__,_/  /_/ /_/\__/   /____/\__, /\__,_/_/ /_/__/\__,_/
                                                        /____/
EOF
    echo -e "${NC}"
    echo "Ultimate Terminal-Based SEO Audit System Setup"
    echo "=============================================="
    
    check_os
    install_system_deps
    install_python_deps
    install_node_deps
    setup_additional_tools
    create_config_files
    set_permissions
    
    print_status "Setup completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Edit config/api-config.json with your API keys (optional)"
    echo "2. Add target keywords to config/keywords.txt"
    echo "3. Run your first audit: ./run-audit.sh https://example.com"
    echo ""
    print_warning "Remember to activate the Python virtual environment:"
    echo "source venv/bin/activate  # Linux/macOS"
    echo "source venv/Scripts/activate  # Windows Git Bash"
}

# Run main function
main "$@"