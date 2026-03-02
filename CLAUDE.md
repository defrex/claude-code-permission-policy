# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Claude Code **PermissionRequest hook** that uses Claude Haiku as an AI security gatekeeper. It intercepts tool invocations (Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch), evaluates them against a per-repository security policy (`.claude/SECURITY_POLICY.md`), and either auto-approves safe operations or defers to the human. Authentication piggybacks on the user's existing Claude Code OAuth login — no API key needed.

## Architecture

- **`hook/permission-hook.ts`** — The hook entry point. Reads a JSON permission request from stdin, loads the security policy from `${cwd}/.claude/SECURITY_POLICY.md`, sends both to `claude -p --model haiku --output-format json`, parses the allow/ask decision, and writes the result JSON to stdout. On any error, exits with code 1 to fall back to the interactive permission prompt. Logs to `.claude/logs/permission-hook.log`.

- **`skill/permission-hook.ts`** — Symlink to `../hook/permission-hook.ts`. The skill reads this to copy the hook script into target projects at `.claude/hooks/permission-hook.ts`.

- **`skill/SKILL.md`** — Installation skill invoked via `/permission-hook`. Copies the hook script into the target project at `.claude/hooks/permission-hook.ts`, copies the security policy template, and configures `.claude/settings.json`.

- **`skill/SECURITY_POLICY_TEMPLATE.md`** — Default security policy template copied into new repos. Defines ALLOW (safe dev commands, git workflow, in-project reads/writes) and ASK (destructive ops, credential access, out-of-project access) sections.

- **`.claude/SECURITY_POLICY.md`** — This repo's own security policy (an instance of the template).

- **`.claude/settings.json`** — Configures the PermissionRequest hook to run `bun hook/permission-hook.ts` with a 60s timeout.

## Runtime

- **Bun** — TypeScript is executed directly via Bun (no build step, no package.json).
- **`claude -p`** — The hook spawns `claude -p --model haiku --output-format json` as a subprocess. The `CLAUDECODE` env var is set to empty string to avoid recursion.

## Running the Hook Locally

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"ls"},"cwd":"/tmp","permission_mode":"default","session_id":"test","transcript_path":"","hook_event_name":"PermissionRequest","tool_use_id":"test"}' | bun hook/permission-hook.ts
```

Logs are written to `.claude/logs/permission-hook.log`.

## Key Design Decisions

- **Fail-open to interactive prompt**: Any error (missing policy, Haiku failure, parse error) causes `process.exit(1)`, which makes Claude Code fall back to asking the user directly. The hook never silently blocks.
- **Per-repo policy**: Security policy lives in the target repo's `.claude/SECURITY_POLICY.md`, not globally. Each project can customize what's safe.
- **No SDK dependency**: Uses `claude -p` subprocess instead of the Anthropic SDK to reuse OAuth credentials without requiring an API key.
- **Project-local distribution**: The skill copies the hook script into each project at `.claude/hooks/permission-hook.ts` so it works without global file dependencies. Re-run `/permission-hook` to update to the latest version.
