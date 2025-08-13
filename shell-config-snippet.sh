#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#  🚀 CLAUDE CODE AGENTS - SHELL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
#  Add this to your ~/.bashrc or ~/.zshrc file
#  Installation: cat shell-config-snippet.sh >> ~/.bashrc && source ~/.bashrc
# ═══════════════════════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 COLOR DEFINITIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export CLAUDE_RED='\033[0;31m'
export CLAUDE_GREEN='\033[0;32m'
export CLAUDE_YELLOW='\033[1;33m'
export CLAUDE_BLUE='\033[0;34m'
export CLAUDE_MAGENTA='\033[0;35m'
export CLAUDE_CYAN='\033[0;36m'
export CLAUDE_WHITE='\033[1;37m'
export CLAUDE_RESET='\033[0m'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 AUTO-LOAD AGENTS IN PROJECT DIRECTORIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Function to check and load agents when entering a project directory
claude_agents_autoload() {
    if [ -f ".claude-agents/config.json" ] || [ -f "init-agents.sh" ]; then
        echo -e "${CLAUDE_CYAN}🚀 Claude Code Agents detected in this project!${CLAUDE_RESET}"
        echo -e "${CLAUDE_YELLOW}Type 'agents' to see available AI assistants${CLAUDE_RESET}"
        
        # Set environment variable to indicate agents are available
        export CLAUDE_AGENTS_AVAILABLE=1
        
        # Load agent configurations if available
        if [ -f ".claude-agents/config.json" ]; then
            export CLAUDE_AGENTS_CONFIG="$PWD/.claude-agents/config.json"
        fi
    else
        unset CLAUDE_AGENTS_AVAILABLE
        unset CLAUDE_AGENTS_CONFIG
    fi
}

# Hook into directory change (works for both bash and zsh)
if [ -n "$ZSH_VERSION" ]; then
    # Zsh hook
    autoload -U add-zsh-hook
    add-zsh-hook chpwd claude_agents_autoload
    # Also run on shell startup
    claude_agents_autoload
elif [ -n "$BASH_VERSION" ]; then
    # Bash hook using PROMPT_COMMAND
    claude_prompt_command() {
        if [ "$PWD" != "$CLAUDE_LAST_PWD" ]; then
            CLAUDE_LAST_PWD="$PWD"
            claude_agents_autoload
        fi
    }
    PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND$'\n'}claude_prompt_command"
    # Also run on shell startup
    claude_agents_autoload
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📋 MAIN AGENTS COMMAND
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

agents() {
    if [ -f "init-agents.sh" ]; then
        bash init-agents.sh list
    else
        echo -e "${CLAUDE_YELLOW}📦 Claude Code Agents - Quick Reference${CLAUDE_RESET}"
        echo ""
        echo -e "${CLAUDE_CYAN}Available Agents:${CLAUDE_RESET}"
        echo "  🐛 bug-debugger       - Debug and fix errors"
        echo "  📝 code-reviewer      - Review code quality"
        echo "  🧪 test-generator     - Generate test suites"
        echo "  ♻️  refactor          - Refactor and clean code"
        echo "  📚 docs              - Write documentation"
        echo "  ⚡ perf              - Optimize performance"
        echo "  🔒 security          - Security audit"
        echo "  🗄️  db               - Database optimization"
        echo "  🔍 seo               - SEO analysis"
        echo "  🏗️  arch             - Architecture advice"
        echo "  🚢 devops            - DevOps automation"
        echo "  🔌 api               - API integration"
        echo ""
        echo -e "${CLAUDE_GREEN}Usage:${CLAUDE_RESET} claude code @<agent> \"<task>\""
        echo -e "${CLAUDE_GREEN}Example:${CLAUDE_RESET} claude code @debug \"Fix login error\""
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 AGENT SHORTCUTS / ALIASES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Bug Debugger shortcuts
alias debug='claude code @bug-debugger'
alias fix='claude code @bug-debugger'
alias claude-debug='claude code @bug-debugger'

# Code Reviewer shortcuts
alias review='claude code @code-reviewer'
alias cr='claude code @code-reviewer'
alias claude-review='claude code @code-reviewer'

# Test Generator shortcuts
alias test='claude code @test-generator'
alias tg='claude code @test-generator'
alias claude-test='claude code @test-generator'

# Refactoring Specialist shortcuts
alias refactor='claude code @refactoring-specialist'
alias clean='claude code @refactoring-specialist'
alias claude-refactor='claude code @refactoring-specialist'

# Documentation Writer shortcuts
alias docs='claude code @docs-writer'
alias document='claude code @docs-writer'
alias claude-docs='claude code @docs-writer'

# Performance Optimizer shortcuts
alias perf='claude code @performance-optimizer'
alias optimize='claude code @performance-optimizer'
alias claude-perf='claude code @performance-optimizer'

# Security Auditor shortcuts
alias security='claude code @security-auditor'
alias audit='claude code @security-auditor'
alias claude-security='claude code @security-auditor'

# Database Optimizer shortcuts
alias db='claude code @database-optimizer'
alias database='claude code @database-optimizer'
alias claude-db='claude code @database-optimizer'

# SEO Auditor shortcuts
alias seo='claude code @seo-auditor'
alias search='claude code @seo-auditor'
alias claude-seo='claude code @seo-auditor'

# Architecture Advisor shortcuts
alias arch='claude code @architecture-advisor'
alias design='claude code @architecture-advisor'
alias claude-arch='claude code @architecture-advisor'

# DevOps Pipeline shortcuts
alias devops='claude code @devops-pipeline'
alias deploy='claude code @devops-pipeline'
alias claude-devops='claude code @devops-pipeline'

# API Integration shortcuts
alias api='claude code @api-integration'
alias integrate='claude code @api-integration'
alias claude-api='claude code @api-integration'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🛠️ UTILITY FUNCTIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Quick agent help function
agent-help() {
    local agent=$1
    case $agent in
        debug|bug*)
            echo -e "${CLAUDE_CYAN}🐛 Bug Debugger${CLAUDE_RESET}"
            echo "Fix errors, debug issues, and resolve crashes"
            echo "Usage: debug \"TypeError in authentication module\""
            ;;
        review|code*)
            echo -e "${CLAUDE_CYAN}📝 Code Reviewer${CLAUDE_RESET}"
            echo "Review code quality, suggest improvements"
            echo "Usage: review \"payment.js\""
            ;;
        test*)
            echo -e "${CLAUDE_CYAN}🧪 Test Generator${CLAUDE_RESET}"
            echo "Generate comprehensive test suites"
            echo "Usage: test \"UserService class\""
            ;;
        refactor|clean*)
            echo -e "${CLAUDE_CYAN}♻️ Refactoring Specialist${CLAUDE_RESET}"
            echo "Clean up and optimize existing code"
            echo "Usage: refactor \"legacy authentication system\""
            ;;
        doc*)
            echo -e "${CLAUDE_CYAN}📚 Documentation Writer${CLAUDE_RESET}"
            echo "Generate API docs, READMEs, and guides"
            echo "Usage: docs \"REST API endpoints\""
            ;;
        perf|opt*)
            echo -e "${CLAUDE_CYAN}⚡ Performance Optimizer${CLAUDE_RESET}"
            echo "Identify and fix performance bottlenecks"
            echo "Usage: perf \"slow search algorithm\""
            ;;
        security|audit*)
            echo -e "${CLAUDE_CYAN}🔒 Security Auditor${CLAUDE_RESET}"
            echo "Find vulnerabilities and security issues"
            echo "Usage: security \"user authentication flow\""
            ;;
        db|database*)
            echo -e "${CLAUDE_CYAN}🗄️ Database Optimizer${CLAUDE_RESET}"
            echo "Optimize queries and database performance"
            echo "Usage: db \"product search queries\""
            ;;
        seo*)
            echo -e "${CLAUDE_CYAN}🔍 SEO Auditor${CLAUDE_RESET}"
            echo "Analyze and improve SEO performance"
            echo "Usage: seo \"landing page\""
            ;;
        arch*)
            echo -e "${CLAUDE_CYAN}🏗️ Architecture Advisor${CLAUDE_RESET}"
            echo "System design and architecture guidance"
            echo "Usage: arch \"microservices migration\""
            ;;
        devops|deploy*)
            echo -e "${CLAUDE_CYAN}🚢 DevOps Pipeline${CLAUDE_RESET}"
            echo "CI/CD setup and deployment automation"
            echo "Usage: devops \"GitHub Actions workflow\""
            ;;
        api|int*)
            echo -e "${CLAUDE_CYAN}🔌 API Integration${CLAUDE_RESET}"
            echo "Integrate third-party APIs and services"
            echo "Usage: api \"Stripe payment integration\""
            ;;
        *)
            echo -e "${CLAUDE_YELLOW}Usage: agent-help <agent-name>${CLAUDE_RESET}"
            echo "Available agents: debug, review, test, refactor, docs, perf, security, db, seo, arch, devops, api"
            ;;
    esac
}

# List all agent aliases
agent-aliases() {
    echo -e "${CLAUDE_MAGENTA}═══════════════════════════════════════════════════════════════${CLAUDE_RESET}"
    echo -e "${CLAUDE_CYAN}        Claude Code Agent Shortcuts / Aliases${CLAUDE_RESET}"
    echo -e "${CLAUDE_MAGENTA}═══════════════════════════════════════════════════════════════${CLAUDE_RESET}"
    echo ""
    echo -e "${CLAUDE_YELLOW}Agent${CLAUDE_RESET}                    ${CLAUDE_GREEN}Shortcuts${CLAUDE_RESET}"
    echo -e "${CLAUDE_WHITE}────────────────────────────────────────────────────────────${CLAUDE_RESET}"
    echo "Bug Debugger            debug, fix"
    echo "Code Reviewer           review, cr"
    echo "Test Generator          test, tg"
    echo "Refactoring Specialist  refactor, clean"
    echo "Documentation Writer    docs, document"
    echo "Performance Optimizer   perf, optimize"
    echo "Security Auditor        security, audit"
    echo "Database Optimizer      db, database"
    echo "SEO Auditor            seo, search"
    echo "Architecture Advisor    arch, design"
    echo "DevOps Pipeline        devops, deploy"
    echo "API Integration        api, integrate"
    echo ""
    echo -e "${CLAUDE_GREEN}Example:${CLAUDE_RESET} debug \"Fix login error\""
    echo -e "${CLAUDE_GREEN}Example:${CLAUDE_RESET} review \"payment module\""
}

# Initialize agents in current directory
init-agents() {
    if [ -f "init-agents.sh" ]; then
        bash init-agents.sh init
    else
        echo -e "${CLAUDE_YELLOW}⚠️  init-agents.sh not found in current directory${CLAUDE_RESET}"
        echo "Please navigate to your project directory first"
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 💬 WELCOME MESSAGE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Show a subtle reminder that agents are available (only once per session)
if [ -z "$CLAUDE_AGENTS_LOADED" ]; then
    export CLAUDE_AGENTS_LOADED=1
    echo -e "${CLAUDE_CYAN}💡 Claude Code Agents loaded! Type 'agents' for help${CLAUDE_RESET}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# End of Claude Code Agents Shell Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━