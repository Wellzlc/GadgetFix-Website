#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#  🚀 CLAUDE CODE AGENTS INITIALIZATION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════
#  Advanced AI-Powered Development Assistance Suite
#  Version: 1.0.0 | Last Updated: 2025-01-13
# ═══════════════════════════════════════════════════════════════════════════════

# Color definitions for beautiful terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
RESET='\033[0m'

# ASCII Art Header
print_header() {
    echo -e "${CYAN}"
    cat << "EOF"
     _____ _                 _        _                     _       
    / ____| |               | |      | |   /\              | |      
   | |    | | __ _ _   _  __| | ___  | |  /  \   __ _  ___ | |_ ___ 
   | |    | |/ _` | | | |/ _` |/ _ \ | | / /\ \ / _` |/ _ \| __/ __|
   | |____| | (_| | |_| | (_| |  __/ | |/ ____ \ (_| |  __/| |_\__ \
    \_____|_|\__,_|\__,_|\__,_|\___| |_/_/    \_\__, |\___| \__|___/
                                                  __/ |              
                                                 |___/               
EOF
    echo -e "${RESET}"
}

# Function to display agent with formatting
display_agent() {
    local emoji=$1
    local name=$2
    local model=$3
    local description=$4
    local example=$5
    
    echo -e "${emoji} ${BOLD}${WHITE}${name}${RESET} ${YELLOW}[${model}]${RESET}"
    echo -e "   ${CYAN}${description}${RESET}"
    echo -e "   ${GREEN}Example:${RESET} ${example}"
    echo ""
}

# Main menu function
show_agents_menu() {
    clear
    print_header
    
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════════════════════${RESET}"
    echo -e "${BOLD}${WHITE}                        AVAILABLE AI DEVELOPMENT AGENTS                          ${RESET}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════════════════════${RESET}"
    echo ""
    
    # Core Development Agents
    echo -e "${YELLOW}━━━ ${BOLD}Core Development${RESET} ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    
    display_agent "🐛" "Bug Debugger" "Sonnet 3.5" \
        "Advanced debugging and error resolution" \
        "claude code @bug-debugger \"Fix TypeError in authentication module\""
    
    display_agent "📝" "Code Reviewer" "Sonnet 3.5" \
        "Comprehensive code quality assessment" \
        "claude code @code-reviewer \"Review the payment processing module\""
    
    display_agent "♻️" "Refactoring Specialist" "Sonnet 3.5" \
        "Clean up and optimize existing code" \
        "claude code @refactoring-specialist \"Refactor the user service class\""
    
    # Testing & Quality
    echo -e "${YELLOW}━━━ ${BOLD}Testing & Quality${RESET} ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    
    display_agent "🧪" "Test Generator" "Haiku 3.5" \
        "Create comprehensive test suites" \
        "claude code @test-generator \"Generate tests for order processing\""
    
    display_agent "🔒" "Security Auditor" "Opus 3" \
        "Security vulnerability assessment" \
        "claude code @security-auditor \"Audit authentication system for vulnerabilities\""
    
    # Performance & Optimization
    echo -e "${YELLOW}━━━ ${BOLD}Performance & Optimization${RESET} ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    
    display_agent "⚡" "Performance Optimizer" "Sonnet 3.5" \
        "Identify and fix performance bottlenecks" \
        "claude code @performance-optimizer \"Optimize the search algorithm\""
    
    display_agent "🗄️" "Database Optimizer" "Sonnet 3.5" \
        "Database query and schema optimization" \
        "claude code @database-optimizer \"Optimize slow product queries\""
    
    # Documentation & SEO
    echo -e "${YELLOW}━━━ ${BOLD}Documentation & SEO${RESET} ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    
    display_agent "📚" "Documentation Writer" "Haiku 3.5" \
        "Generate comprehensive documentation" \
        "claude code @docs-writer \"Document the API endpoints\""
    
    display_agent "🔍" "SEO Auditor" "Haiku 3.5" \
        "SEO analysis and optimization" \
        "claude code @seo-auditor \"Analyze homepage SEO performance\""
    
    # Architecture & Infrastructure
    echo -e "${YELLOW}━━━ ${BOLD}Architecture & Infrastructure${RESET} ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    
    display_agent "🏗️" "Architecture Advisor" "Opus 3" \
        "System design and architectural guidance" \
        "claude code @architecture-advisor \"Design microservices architecture\""
    
    display_agent "🚢" "DevOps Pipeline" "Sonnet 3.5" \
        "CI/CD and deployment automation" \
        "claude code @devops-pipeline \"Setup GitHub Actions workflow\""
    
    display_agent "🔌" "API Integration" "Haiku 3.5" \
        "Third-party API integration assistance" \
        "claude code @api-integration \"Integrate Stripe payment processing\""
    
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════════════════════${RESET}"
}

# Quick command reference
show_quick_reference() {
    echo -e "${BOLD}${CYAN}Quick Command Reference:${RESET}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${GREEN}List all agents:${RESET}        agents"
    echo -e "${GREEN}Debug mode:${RESET}             claude code @bug-debugger <task>"
    echo -e "${GREEN}Review code:${RESET}            claude code @code-reviewer <file/module>"
    echo -e "${GREEN}Generate tests:${RESET}         claude code @test-generator <component>"
    echo -e "${GREEN}Optimize performance:${RESET}   claude code @performance-optimizer <code>"
    echo -e "${GREEN}Check security:${RESET}         claude code @security-auditor <system>"
    echo -e "${GREEN}Write documentation:${RESET}    claude code @docs-writer <topic>"
    echo ""
}

# Agent initialization
initialize_agents() {
    echo -e "${YELLOW}🔄 Initializing Claude Code Agents...${RESET}"
    
    # Check if agents are already configured
    if [ -f ".claude-agents/config.json" ]; then
        echo -e "${GREEN}✅ Agents already configured${RESET}"
    else
        echo -e "${CYAN}📦 Setting up agent configurations...${RESET}"
        mkdir -p .claude-agents
        
        # Create configuration file
        cat > .claude-agents/config.json << 'EOL'
{
  "agents": {
    "bug-debugger": {
      "name": "Bug Debugger",
      "model": "claude-3-5-sonnet",
      "emoji": "🐛",
      "shortcuts": ["debug", "fix"]
    },
    "code-reviewer": {
      "name": "Code Reviewer",
      "model": "claude-3-5-sonnet",
      "emoji": "📝",
      "shortcuts": ["review", "cr"]
    },
    "test-generator": {
      "name": "Test Generator",
      "model": "claude-3-5-haiku",
      "emoji": "🧪",
      "shortcuts": ["test", "tg"]
    },
    "refactoring-specialist": {
      "name": "Refactoring Specialist",
      "model": "claude-3-5-sonnet",
      "emoji": "♻️",
      "shortcuts": ["refactor", "clean"]
    },
    "docs-writer": {
      "name": "Documentation Writer",
      "model": "claude-3-5-haiku",
      "emoji": "📚",
      "shortcuts": ["docs", "document"]
    },
    "performance-optimizer": {
      "name": "Performance Optimizer",
      "model": "claude-3-5-sonnet",
      "emoji": "⚡",
      "shortcuts": ["perf", "optimize"]
    },
    "security-auditor": {
      "name": "Security Auditor",
      "model": "claude-3-opus",
      "emoji": "🔒",
      "shortcuts": ["security", "audit"]
    },
    "database-optimizer": {
      "name": "Database Optimizer",
      "model": "claude-3-5-sonnet",
      "emoji": "🗄️",
      "shortcuts": ["db", "database"]
    },
    "seo-auditor": {
      "name": "SEO Auditor",
      "model": "claude-3-5-haiku",
      "emoji": "🔍",
      "shortcuts": ["seo", "search"]
    },
    "architecture-advisor": {
      "name": "Architecture Advisor",
      "model": "claude-3-opus",
      "emoji": "🏗️",
      "shortcuts": ["arch", "design"]
    },
    "devops-pipeline": {
      "name": "DevOps Pipeline",
      "model": "claude-3-5-sonnet",
      "emoji": "🚢",
      "shortcuts": ["devops", "deploy"]
    },
    "api-integration": {
      "name": "API Integration",
      "model": "claude-3-5-haiku",
      "emoji": "🔌",
      "shortcuts": ["api", "integrate"]
    }
  }
}
EOL
        echo -e "${GREEN}✅ Agent configurations created${RESET}"
    fi
    
    echo -e "${GREEN}🎉 All agents ready for use!${RESET}"
    echo ""
}

# Main execution
main() {
    case "$1" in
        "list"|"")
            show_agents_menu
            show_quick_reference
            ;;
        "init")
            initialize_agents
            ;;
        "help")
            show_quick_reference
            ;;
        *)
            echo -e "${RED}Unknown command: $1${RESET}"
            echo -e "Usage: $0 [list|init|help]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"