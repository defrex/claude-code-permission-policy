<div align="center">

# Claude Code Permission Policy

### Live Less Dangerously

</div>

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) hook that uses Claude Haiku as an AI security gatekeeper. It intercepts tool invocations, evaluates them against a per-repository permission policy, and either auto-approves safe operations or defers to you for a decision. On any error, it fails open to the normal interactive permission prompt — it never silently blocks.

## Install

```
npx skills add defrex/claude-code-permission-policy --agent claude-code --copy
```

Then run `/permission-policy` inside Claude Code to set up the hook and create your policy file.

## How It Works

When Claude Code invokes a tool (Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch), the hook:

1. Reads the permission request from stdin
2. Loads your repo's `.claude/PERMISSION_POLICY.md`
3. Sends both to Claude Haiku for evaluation
4. Returns `allow` (auto-approve) or `ask` (defer to human)

The hook calls `claude -p --model haiku` as a subprocess, piggybacking on your existing Claude Code OAuth login — no API key needed.

## Permission Policy

Each repository gets its own `.claude/PERMISSION_POLICY.md` that defines what's safe and what requires your approval. The default template includes:

**ALLOW** (auto-approved) — safe dev commands, git workflow, package managers, in-project file access, documentation lookups.

**ASK** (requires approval) — destructive git operations, network exfiltration, system config changes, sudo, access outside the project directory, sensitive files.

Edit your policy file to match how you actually work. It's just markdown — add, remove, or adjust rules as needed.

## Logs

The hook logs every decision to `.claude/logs/permission-policy.log`. Tail it to see what's happening in real time:

```
tail -f .claude/logs/permission-policy.log
```
