---
name: permission-hook
description: Install or update the AI permission hook for auto-approving safe tool invocations.
allowed-tools: Bash(bun install*), Bash(ls *), Bash(mkdir *), Read, Write, Edit, Glob
---

Set up the Claude Code permission hook that uses Haiku to auto-approve safe tool invocations based on a per-repo security policy.

**Authentication**: The hook automatically reuses your Claude Code login (OAuth).

## Steps

### Step 1 — Ensure global hook script + deps

The hook script lives at `~/.claude/hooks/permission-hook.ts` and is managed by this skill (always kept up to date).

1. Verify `~/.claude/hooks/permission-hook.ts` exists. If missing, tell the user the skill installation may be incomplete.
2. Check if `~/.claude/hooks/node_modules` exists. If not, run `bun install` in `~/.claude/hooks/`.

### Step 2 — Create repo security policy

1. Check if `.claude/SECURITY_POLICY.md` exists in the current project root.
2. If it already exists, tell the user: "Security policy already exists at `.claude/SECURITY_POLICY.md` — skipping. Edit it to customize."
3. If it doesn't exist, copy the contents of `~/.claude/skills/permission-hook/SECURITY_POLICY_TEMPLATE.md` to `.claude/SECURITY_POLICY.md` in the current project root.
4. Tell the user to customize the policy for their project.

### Step 3 — Configure hook in settings

1. Read `.claude/settings.json` in the current project root (or treat as `{}` if it doesn't exist).
2. Merge the following hook configuration, preserving all existing settings:

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "Bash|Read|Write|Edit|Glob|Grep|WebFetch|WebSearch",
        "hooks": [
          {
            "type": "command",
            "command": "bun $HOME/.claude/hooks/permission-hook.ts",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Important**: Replace `$HOME` with the actual absolute home directory path (e.g., `/Users/username`). Do NOT use `~` in the path.

3. If there's already a `PermissionRequest` hook entry whose matcher includes `"Bash"`, replace it. Otherwise, add a new entry.
4. Write the updated settings back.

### Step 4 — Summary

Print a summary:
- Hook script location
- Security policy location (and whether it was newly created or already existed)
- Settings updated
- Remind user: "The hook uses your Claude Code login automatically."
