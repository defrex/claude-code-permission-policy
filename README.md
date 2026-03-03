<div align="center">

### Claude Code Permission Policy

*Live Less Dangerously*

&nbsp;

</div>

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) hook that uses Claude Haiku as an AI security gatekeeper. It intercepts tool invocations, evaluates them against a per-repository permission policy, and either auto-approves safe operations, outright denies dangerous ones, or defers to you for a decision. On any error, it fails open to the normal interactive permission prompt — it never silently blocks.

## Install

```
npx skills add defrex/claude-code-permission-policy --agent claude-code --copy
```

Then run `/permission-policy` inside Claude Code to set up the hook and create your policy file.

```
claude /permission-policy
```

## How It Works

When Claude Code invokes a tool (Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch), the hook:

1. Reads the permission request from stdin
2. Loads your repo's `.claude/PERMISSION_POLICY.md`
3. Sends both to Claude Haiku for evaluation
4. Returns `allow` (auto-approve), `deny` (block with reason), or `ask` (defer to human)

The hook calls `claude -p --model haiku` as a subprocess, piggybacking on your existing Claude Code OAuth login — no API key needed.

## Permission Policy

Each repository gets its own `.claude/PERMISSION_POLICY.md` that defines what's safe, what's blocked, and what requires your approval. The default template includes:

**ALLOW** (auto-approved) — safe dev commands, git workflow, package managers, in-project file access, documentation lookups.

**DENY** (blocked outright) — catastrophic deletions, downloading and executing remote scripts, exfiltrating secrets, disabling security tools.

**ASK** (requires approval) — destructive git operations, network exfiltration, system config changes, sudo, access outside the project directory, sensitive files.

Edit your policy file to match how you actually work. It's just markdown — add, remove, or adjust rules as needed.

## Logs

The hook logs every decision to `.claude/logs/permission-policy.log`. Tail it to see what's happening in real time:

```
tail -f .claude/logs/permission-policy.log
```

## Remix

Once this skill is installed, it can easily be customized.

- **Use the Agent SDK instead of `claude -p`.** The claude CLI adds ~10s per permission check. The [Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk) is significantly faster, but requires an API key rather than piggyback on OAuth.

- **Swap in Gemini Flash.** Gemini Flash works great for this kind of policy evaluation. Pair it with a lightweight [AI SDK](https://ai-sdk.dev/) harness and you've got a fast, cheap gatekeeper.

- **Port to your preferred language.** The hook is just "read JSON from stdin, call an LLM, write JSON to stdout." If you'd rather use Python or anything else, porting is easy. Just ask the bot!
