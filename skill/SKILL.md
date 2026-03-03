---
name: permission-hook
description: Install or update the AI permission hook for auto-approving safe tool invocations.
allowed-tools: Bash(ls *), Bash(mkdir *), Read, Write, Edit, Glob
---

Set up the Claude Code permission hook that uses Haiku to auto-approve safe tool invocations based on a per-repo permission policy.

**Authentication**: The hook automatically reuses your Claude Code login (OAuth).

## Steps

### Step 1 — Install hook script into project

The hook script is distributed with this skill. Copy it into the target project so it works without any global dependencies.

1. Read the hook source from `~/.claude/skills/permission-hook/permission-hook.ts`.
2. Create `.claude/hooks/` in the current project root if it doesn't exist.
3. Write the contents to `.claude/hooks/permission-hook.ts` — always overwrite to ensure the latest version.
4. Tell the user: "Hook script installed/updated at `.claude/hooks/permission-hook.ts`."

### Step 2 — Create repo permission policy

1. Check if `.claude/PERMISSION_POLICY.md` exists in the current project root.
2. If it already exists, tell the user: "Permission policy already exists at `.claude/PERMISSION_POLICY.md` — skipping. Edit it to customize."
3. If it doesn't exist, copy the contents of `~/.claude/skills/permission-hook/PERMISSION_POLICY_TEMPLATE.md` to `.claude/PERMISSION_POLICY.md` in the current project root.
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
            "command": "bun .claude/hooks/permission-hook.ts",
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

### Step 4 — Summary

Print a summary:
- Hook script: `.claude/hooks/permission-hook.ts` (installed/updated)
- Permission policy: `.claude/PERMISSION_POLICY.md` (newly created or already existed)
- Settings: `.claude/settings.json` updated with hook config
- Remind user: "The hook uses your Claude Code login automatically."
- Remind user: "Re-run `/permission-hook` anytime to update the hook script to the latest version."
