# .claude-agents Directory

This directory contains configurations and resources for Claude Code AI Agents.

## Structure

```
.claude-agents/
├── config.json              # Main configuration file for all agents
├── logs/                   # Agent execution logs (auto-generated)
│   └── YYYY-MM-DD/        # Daily log directories
├── cache/                  # Cached agent responses for faster repeated queries
└── templates/              # Custom prompt templates and examples
    └── example-prompts.md  # Example prompts for each agent
```

## Configuration

The `config.json` file contains:
- Agent definitions and capabilities
- Model assignments (Haiku, Sonnet, Opus)
- Temperature and token settings
- Custom shortcuts and aliases
- Prompt templates

## Usage

This directory is automatically used by:
- `init-agents.sh` - Main initialization script
- Shell aliases defined in `shell-config-snippet.sh`
- Claude Code when agents are invoked

## Customization

You can customize agent behavior by editing `config.json`:
- Adjust temperature for creativity vs consistency
- Modify maxTokens for response length
- Add custom shortcuts
- Update prompt templates

## Logs

Logs are automatically generated when agents are used and stored by date.
These can be useful for debugging or reviewing agent interactions.

## Cache

The cache directory stores recent agent responses to improve performance
for repeated similar queries. Cache is automatically managed and expires
after 24 hours.