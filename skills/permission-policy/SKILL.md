---
name: permission-policy
description: Install or update the AI permission policy for auto-approving safe tool invocations.
allowed-tools: Bash(ls *), Bash(mkdir *), Read, Write, Edit, Glob
---

Set up the Claude Code permission hook that uses Haiku to auto-approve safe tool invocations based on a per-repo permission policy.

**Authentication**: The hook automatically reuses your Claude Code login (OAuth).

## Steps

### Step 1 — Install hook script into project

The hook script is distributed with this skill. Copy it into the target project so it works without any global dependencies.

1. Read the hook source from `~/.claude/skills/permission-policy/permission-policy.ts`.
2. Create `.claude/hooks/` in the current project root if it doesn't exist.
3. Write the contents to `.claude/hooks/permission-policy.ts` — always overwrite to ensure the latest version.
4. Tell the user: "Hook script installed/updated at `.claude/hooks/permission-policy.ts`."

### Step 2 — Create repo permission policy

1. Check if `.claude/PERMISSION_POLICY.md` exists in the current project root.
2. If it already exists, tell the user: "Permission policy already exists at `.claude/PERMISSION_POLICY.md` — skipping. Edit it to customize."
3. If it doesn't exist, copy the contents of `~/.claude/skills/permission-policy/PERMISSION_POLICY_TEMPLATE.md` to `.claude/PERMISSION_POLICY.md` in the current project root.
4. Tell the user to customize the policy for their project.

### Step 3 — Gitignore log file

1. Check if `.claude/logs/` is already covered by a `.gitignore` entry in the current project root (e.g. `.claude/logs/` or `.claude/logs`).
2. If not, append `.claude/logs/` on a new line to the project root `.gitignore` (create the file if it doesn't exist).
3. Tell the user: "Added `.claude/logs/` to `.gitignore`."

### Step 4 — Configure hook in settings

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
            "command": "bun .claude/hooks/permission-policy.ts",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

3. If there's already a `PermissionRequest` hook entry whose matcher includes `"Bash"`, replace it. Otherwise, add a new entry.
4. Write the updated settings back.

### Step 5 — Summary

Print a summary:
- Hook script: `.claude/skills/permission-policy.ts` (installed/updated)
- Permission policy: `.claude/PERMISSION_POLICY.md` (newly created or already existed)
- Settings: `.claude/settings.json` updated with hook config
- Remind user: "The hook uses your Claude Code login automatically."
- Remind user: "Re-run `/permission-policy` anytime to update the hook script to the latest version."
