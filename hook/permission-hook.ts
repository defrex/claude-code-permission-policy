/**
 * Claude Code PermissionRequest hook script.
 *
 * Reads a tool-use permission request from stdin, uses Haiku via the Anthropic
 * SDK to decide whether to auto-allow or defer to the human, and writes the
 * decision JSON to stdout.
 *
 * Security policy is read from `${cwd}/.claude/SECURITY_POLICY.md`. If the
 * file is missing, exits with code 1 to fall back to the interactive prompt.
 *
 * On any error, exits with code 1 so Claude Code falls back to the normal
 * interactive permission prompt.
 *
 * Usage:
 *   echo '{"tool_name":"Bash","tool_input":{"command":"ls"}, ...}' | bun ~/.claude/hooks/permission-hook.ts
 */

import { appendFileSync, mkdirSync, readFileSync } from "node:fs"
import { appendFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import Anthropic from "@anthropic-ai/sdk"

type HookInput = {
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode: string
  hook_event_name: string
  tool_name: string
  tool_input: Record<string, unknown>
  tool_use_id: string
}

async function stdinRead(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString("utf-8").trim()
}

const LOG_DIR = join(process.cwd(), "local", "logs")
const LOG_PATH = join(LOG_DIR, "permission-hook.log")

async function ensureLogDir() {
  await mkdir(LOG_DIR, { recursive: true })
}

async function log(message: string) {
  try {
    await ensureLogDir()
    await appendFile(LOG_PATH, `${message}\n`)
  } catch {
    // don't break the hook if logging doesn't work
  }
}

/** Synchronous log for error paths — guarantees the write completes before process.exit(). */
function logSync(message: string) {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(LOG_PATH, `${message}\n`)
  } catch {
    // don't break the hook if logging doesn't work
  }
}

function formatToolInput(toolInput: Record<string, unknown>): string {
  const entries = Object.entries(toolInput)
  if (entries.length === 1) {
    const [key, value] = entries[0]
    return `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`
  }
  return entries
    .map(
      ([key, value]) =>
        `  ${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join("\n")
}

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").replace("Z", "")
}

function readSecurityPolicy(cwd: string): string {
  const policyPath = join(cwd, ".claude", "SECURITY_POLICY.md")
  try {
    return readFileSync(policyPath, "utf-8")
  } catch (err) {
    const code =
      err instanceof Error && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined
    if (code === "ENOENT") {
      throw new Error(
        `Security policy not found at ${policyPath}. Run /permission-hook to create one.`,
      )
    }
    throw err
  }
}

export async function main() {
  logSync(`[${timestamp()}] HOOK INVOKED (pid: ${process.pid})`)

  const raw = await stdinRead()
  if (!raw) {
    throw new Error("No input received on stdin")
  }

  let input: HookInput
  try {
    input = JSON.parse(raw)
  } catch {
    throw new Error(`Failed to parse stdin as JSON: ${raw.slice(0, 200)}`)
  }

  const toolInputStr = formatToolInput(input.tool_input)

  await log(
    `[${timestamp()}] PERMISSION REQUEST: ${input.tool_name}\n` +
      `  ${toolInputStr}\n` +
      `  cwd: ${input.cwd}`,
  )

  const securityPolicy = readSecurityPolicy(input.cwd)

  const systemPrompt = `You are a security gate for a coding assistant's tool use. You evaluate each
tool invocation and decide whether to allow or defer to the human.

SECURITY POLICY:

${securityPolicy}`

  const userPrompt = `Tool: ${input.tool_name}
Input: ${JSON.stringify(input.tool_input, null, 2)}
Working directory: ${input.cwd}
Permission mode: ${input.permission_mode}`

  const client = new Anthropic()

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        name: "make_decision",
        description:
          "Record the permission decision for the tool invocation.",
        input_schema: {
          type: "object",
          properties: {
            behavior: {
              type: "string",
              enum: ["allow", "ask"],
              description:
                "allow: The tool use is safe and should proceed. ask: Uncertain or potentially dangerous — defer to the human.",
            },
            reasoning: {
              type: "string",
              description:
                "Brief explanation of why this decision was made.",
            },
          },
          required: ["behavior", "reasoning"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "make_decision" },
  })

  const toolBlock = response.content.find((b) => b.type === "tool_use")
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No tool_use block in response")
  }

  const decision = toolBlock.input as {
    behavior: "allow" | "ask"
    reasoning: string
  }

  await log(
    `[${timestamp()}] ${decision.behavior.toUpperCase()}: ${decision.reasoning}\n`,
  )

  const output = {
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision: {
        behavior: decision.behavior,
      },
    },
  }

  console.log(JSON.stringify(output))
}

if (import.meta.main) {
  main().then(
    () => process.exit(0),
    (err) => {
      const stack = err instanceof Error ? err.stack : String(err)
      logSync(`[${timestamp()}] ERROR: ${stack}\n`)
      process.exit(1)
    },
  )

  process.on("SIGTERM", () => {
    logSync(`[${timestamp()}] KILLED BY TIMEOUT (SIGTERM)`)
    process.exit(1)
  })
}
