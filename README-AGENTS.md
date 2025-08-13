# 🚀 Claude Code AI Agents Documentation

> **Advanced AI-Powered Development Assistance Suite**  
> Version 1.0.0 | Last Updated: January 13, 2025

## 📋 Quick Reference Table

| Agent | Purpose | Model | Command | Shortcut |
|-------|---------|-------|---------|----------|
| 🐛 **Bug Debugger** | Fix errors and debug issues | Sonnet 3.5 | `@bug-debugger` | `debug`, `fix` |
| 📝 **Code Reviewer** | Code quality assessment | Sonnet 3.5 | `@code-reviewer` | `review`, `cr` |
| 🧪 **Test Generator** | Create comprehensive tests | Haiku 3.5 | `@test-generator` | `test`, `tg` |
| ♻️ **Refactoring Specialist** | Clean and optimize code | Sonnet 3.5 | `@refactoring-specialist` | `refactor`, `clean` |
| 📚 **Documentation Writer** | Generate documentation | Haiku 3.5 | `@docs-writer` | `docs`, `document` |
| ⚡ **Performance Optimizer** | Fix performance issues | Sonnet 3.5 | `@performance-optimizer` | `perf`, `optimize` |
| 🔒 **Security Auditor** | Security vulnerability scan | Opus 3 | `@security-auditor` | `security`, `audit` |
| 🗄️ **Database Optimizer** | Optimize DB queries | Sonnet 3.5 | `@database-optimizer` | `db`, `database` |
| 🔍 **SEO Auditor** | SEO analysis & optimization | Haiku 3.5 | `@seo-auditor` | `seo`, `search` |
| 🏗️ **Architecture Advisor** | System design guidance | Opus 3 | `@architecture-advisor` | `arch`, `design` |
| 🚢 **DevOps Pipeline** | CI/CD automation | Sonnet 3.5 | `@devops-pipeline` | `devops`, `deploy` |
| 🔌 **API Integration** | Third-party integrations | Haiku 3.5 | `@api-integration` | `api`, `integrate` |

---

## 🎯 Agent Detailed Descriptions

### 🐛 Bug Debugger
**Model:** Claude 3.5 Sonnet  
**Purpose:** Advanced debugging and error resolution specialist

**When to use:**
- Application crashes or errors
- TypeErrors, ReferenceErrors, or runtime exceptions
- Logic bugs producing incorrect results
- Performance bottlenecks
- Mysterious intermittent failures

**Example commands:**
```bash
claude code @bug-debugger "Fix TypeError: Cannot read property 'map' of undefined"
claude code @bug-debugger "Debug authentication flow - users can't login"
claude code @bug-debugger "Investigate memory leak in dashboard component"
```

---

### 📝 Code Reviewer
**Model:** Claude 3.5 Sonnet  
**Purpose:** Comprehensive code quality assessment and improvement suggestions

**When to use:**
- Before committing code to version control
- After writing new functions or modules
- When reviewing pull requests
- For identifying technical debt
- Security-sensitive implementations

**Example commands:**
```bash
claude code @code-reviewer "Review the payment processing module"
claude code @code-reviewer "Check authentication.js for security issues"
claude code @code-reviewer "Analyze the new API endpoints for best practices"
```

---

### 🧪 Test Generator
**Model:** Claude 3.5 Haiku  
**Purpose:** Create comprehensive test suites with edge cases

**When to use:**
- After writing new functions or classes
- Before refactoring to ensure behavior preservation
- Adding tests to legacy code
- Creating test fixtures and mock data
- Generating parameterized tests

**Example commands:**
```bash
claude code @test-generator "Create tests for UserService class"
claude code @test-generator "Generate unit tests for email validation function"
claude code @test-generator "Write integration tests for checkout process"
```

---

### ♻️ Refactoring Specialist
**Model:** Claude 3.5 Sonnet  
**Purpose:** Transform messy code into clean, maintainable solutions

**When to use:**
- After rapid prototyping sessions
- Eliminating code duplication
- Applying design patterns
- Splitting monolithic code into modules
- Preparing code for team collaboration

**Example commands:**
```bash
claude code @refactoring-specialist "Clean up the payment processing code"
claude code @refactoring-specialist "Extract duplicate validation logic"
claude code @refactoring-specialist "Break down 2000-line module into components"
```

---

### 📚 Documentation Writer
**Model:** Claude 3.5 Haiku  
**Purpose:** Generate comprehensive technical documentation

**When to use:**
- After completing features
- Before code handoffs
- Preparing for open source release
- Creating API documentation
- Writing user guides

**Example commands:**
```bash
claude code @docs-writer "Document the REST API endpoints"
claude code @docs-writer "Create README for the project"
claude code @docs-writer "Generate JSDoc comments for all functions"
```

---

### ⚡ Performance Optimizer
**Model:** Claude 3.5 Sonnet  
**Purpose:** Identify and fix performance bottlenecks

**When to use:**
- Slow response times
- High memory usage
- Database query optimization needed
- Preparing for increased traffic
- Algorithm optimization

**Example commands:**
```bash
claude code @performance-optimizer "Optimize the search algorithm"
claude code @performance-optimizer "Fix slow API endpoints"
claude code @performance-optimizer "Reduce memory usage in data processing"
```

---

### 🔒 Security Auditor
**Model:** Claude 3 Opus  
**Purpose:** Comprehensive security vulnerability assessment

**When to use:**
- Before production deployments
- After adding authentication/payment features
- Handling sensitive data
- Compliance checks
- After security incidents

**Example commands:**
```bash
claude code @security-auditor "Audit authentication system"
claude code @security-auditor "Check for SQL injection vulnerabilities"
claude code @security-auditor "Review encryption implementation"
```

---

### 🗄️ Database Optimizer
**Model:** Claude 3.5 Sonnet  
**Purpose:** Database performance analysis and optimization

**When to use:**
- Slow queries
- N+1 query problems
- High database CPU/memory usage
- Index optimization
- Schema design improvements

**Example commands:**
```bash
claude code @database-optimizer "Optimize product search queries"
claude code @database-optimizer "Fix N+1 queries in user dashboard"
claude code @database-optimizer "Analyze and add missing indexes"
```

---

### 🔍 SEO Auditor
**Model:** Claude 3.5 Haiku  
**Purpose:** SEO analysis and optimization recommendations

**When to use:**
- Traffic drops
- Website redesigns
- Competitor analysis
- Technical SEO issues
- Content optimization

**Example commands:**
```bash
claude code @seo-auditor "Analyze homepage SEO performance"
claude code @seo-auditor "Why did organic traffic drop 30%?"
claude code @seo-auditor "Optimize product pages for search"
```

---

### 🏗️ Architecture Advisor
**Model:** Claude 3 Opus  
**Purpose:** System design and architectural guidance

**When to use:**
- Starting new projects
- Technology stack decisions
- Microservices design
- Scalability planning
- API design

**Example commands:**
```bash
claude code @architecture-advisor "Design microservices architecture"
claude code @architecture-advisor "Should we use monolith or microservices?"
claude code @architecture-advisor "Best tech stack for real-time app"
```

---

### 🚢 DevOps Pipeline
**Model:** Claude 3.5 Sonnet  
**Purpose:** CI/CD and deployment automation

**When to use:**
- Setting up CI/CD workflows
- Dockerizing applications
- Kubernetes deployments
- Infrastructure as code
- Deployment troubleshooting

**Example commands:**
```bash
claude code @devops-pipeline "Setup GitHub Actions workflow"
claude code @devops-pipeline "Dockerize the Node.js application"
claude code @devops-pipeline "Create Kubernetes deployment config"
```

---

### 🔌 API Integration
**Model:** Claude 3.5 Haiku  
**Purpose:** Third-party API integration assistance

**When to use:**
- Integrating payment processors
- Social media APIs
- Cloud service integrations
- Webhook implementations
- OAuth flows

**Example commands:**
```bash
claude code @api-integration "Integrate Stripe payment processing"
claude code @api-integration "Setup OAuth with Google"
claude code @api-integration "Implement Slack webhook notifications"
```

---

## 🚀 Getting Started

### Installation

1. **Initialize agents in your project:**
```bash
bash init-agents.sh init
```

2. **Add to your shell configuration:**
```bash
# For Bash
cat shell-config-snippet.sh >> ~/.bashrc
source ~/.bashrc

# For Zsh
cat shell-config-snippet.sh >> ~/.zshrc
source ~/.zshrc
```

3. **Verify installation:**
```bash
agents  # Shows all available agents
```

### Basic Usage

**Full command syntax:**
```bash
claude code @<agent-name> "<task description>"
```

**Using shortcuts:**
```bash
debug "Fix login error"
review "payment.js"
test "UserService"
```

### Pro Tips

1. **Batch Operations:** Use multiple agents in sequence
```bash
refactor "clean up auth module" && test "auth module" && review "auth module"
```

2. **Detailed Tasks:** Be specific for better results
```bash
# Good
claude code @bug-debugger "Fix TypeError in line 42 of auth.js when user email is null"

# Less effective
claude code @bug-debugger "Fix error"
```

3. **Context Matters:** Provide file paths when relevant
```bash
claude code @code-reviewer "Review src/services/payment.js focusing on error handling"
```

---

## 📁 Project Structure

```
.claude-agents/
├── config.json          # Agent configurations
├── logs/               # Agent execution logs
│   └── [date]/        # Daily log files
├── cache/             # Cached responses
└── templates/         # Custom prompt templates
```

---

## 🛠️ Advanced Configuration

### Custom Agent Settings

Edit `.claude-agents/config.json` to customize:
- Model preferences
- Temperature settings
- Custom shortcuts
- Agent-specific prompts

### Environment Variables

```bash
export CLAUDE_AGENTS_MODEL="claude-3-5-sonnet"  # Default model
export CLAUDE_AGENTS_VERBOSE=1                   # Enable verbose output
export CLAUDE_AGENTS_CACHE=1                     # Enable response caching
```

---

## 🔧 Troubleshooting

### Common Issues

**Agents not loading:**
```bash
# Manually source the configuration
source ~/.bashrc  # or ~/.zshrc

# Check if in project directory
ls -la .claude-agents/
```

**Command not found:**
```bash
# Verify Claude Code is installed
which claude

# Check PATH
echo $PATH
```

**Permission errors:**
```bash
# Make scripts executable
chmod +x init-agents.sh
chmod +x shell-config-snippet.sh
```

---

## 📚 Best Practices

1. **Use the right agent for the job** - Each agent is optimized for specific tasks
2. **Provide clear, detailed descriptions** - Better input = better output
3. **Review agent output** - Always verify suggestions before implementing
4. **Chain agents for complex tasks** - Refactor → Test → Review
5. **Keep agents updated** - Regular updates improve performance

---

## 🤝 Contributing

Found a bug or have a suggestion? Please open an issue or submit a pull request!

---

## 📄 License

This project is part of Claude Code and follows its licensing terms.

---

*Built with ❤️ by the Claude Code team*