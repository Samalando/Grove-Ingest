import * as os from "node:os"
import * as path from "node:path"
import { readdir } from "node:fs/promises"
import homepage from "./index.html"
import { toMarkdown, renderMarkdownFiles } from "../sinks/local"
import { listRepositories } from "../connectors/github/composio"
import type { Config } from "../config/config"
import type { AuthNotice } from "../connectors/authNotice"

let pendingAuthNotice: AuthNotice | null = null

async function listDir(target: string) {
    const resolved = path.resolve(target)
    const entries = await readdir(resolved, { withFileTypes: true })
    const dirs = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b))

    const parent = path.dirname(resolved)
    return {
        path: resolved,
        parent: parent === resolved ? null : parent,
        entries: dirs,
    }
}

const server = Bun.serve({
    development: true,
    routes: {
        "/": homepage,

        "/api/browse": async (req) => {
            const url = new URL(req.url)
            const target = url.searchParams.get("path") ?? os.homedir()
            try {
                return Response.json(await listDir(target))
            } catch (err) {
                return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
            }
        },

        "/api/sync": {
            POST: async (req) => {
                pendingAuthNotice = null
                try {
                    const config = await req.json() as Config
                    const written = await toMarkdown(config, (notice) => { pendingAuthNotice = notice })
                    return Response.json({ ok: true, written })
                } catch (err) {
                    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
                } finally {
                    pendingAuthNotice = null
                }
            },
        },

        "/api/render": {
            POST: async (req) => {
                pendingAuthNotice = null
                try {
                    const config = await req.json() as Config
                    const files = await renderMarkdownFiles(config, (notice) => { pendingAuthNotice = notice })
                    return Response.json({ ok: true, files })
                } catch (err) {
                    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
                } finally {
                    pendingAuthNotice = null
                }
            },
        },

        "/api/github/repos": {
            POST: async (req) => {
                pendingAuthNotice = null
                try {
                    const { composioApiKey, username } = await req.json() as { composioApiKey: string; username: string }
                    const repos = await listRepositories(
                        { type: "composio", composioApiKey, username },
                        (notice) => { pendingAuthNotice = notice },
                    )
                    return Response.json({ ok: true, repos })
                } catch (err) {
                    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
                } finally {
                    pendingAuthNotice = null
                }
            },
        },

        "/api/auth-status": () => Response.json({ notice: pendingAuthNotice }),
    },
})

console.log(`Grove Ingest web UI listening on ${server.url}`)
