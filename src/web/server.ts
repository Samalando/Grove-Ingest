import * as os from "node:os"
import * as path from "node:path"
import { readdir } from "node:fs/promises"
import homepage from "./index.html"
import { toLocalMarkdown, renderMarkdownFiles } from "../sinks/local"
import { toGroveMarkdown } from "../sinks/grove"
import { listRepositories } from "../connectors/github/composio"
import { deleteCachedGithubToken } from "../connectors/github/native"
import { readCachedComposioKey, writeCachedComposioKey, deleteCachedComposioKey } from "../config/composioKeyring"
import { readCachedGroveCookie, loginToGrove, deleteCachedGroveCookie } from "../config/groveAuth"
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
                    const onAuthNotice = (notice: AuthNotice | null) => { pendingAuthNotice = notice }
                    const written = config.sinks.grove.enabled
                        ? await toGroveMarkdown(config, onAuthNotice)
                        : await toLocalMarkdown(config, onAuthNotice)
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

        "/api/composio-key": {
            GET: async () => Response.json({ key: await readCachedComposioKey() }),
            POST: async (req) => {
                try {
                    const { key } = await req.json() as { key: string }
                    if (typeof key === "string" && key) await writeCachedComposioKey(key)
                    return Response.json({ ok: true })
                } catch (err) {
                    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
                }
            },
            DELETE: async () => {
                await deleteCachedComposioKey()
                return Response.json({ ok: true })
            },
        },

        "/api/github/native-token": {
            DELETE: async () => {
                await deleteCachedGithubToken()
                return Response.json({ ok: true })
            },
        },

        "/api/grove/cookie": {
            GET: async () => Response.json({ cookie: await readCachedGroveCookie() }),
            DELETE: async () => {
                await deleteCachedGroveCookie()
                return Response.json({ ok: true })
            },
        },

        "/api/grove/login": {
            POST: async (req) => {
                try {
                    const { password } = await req.json() as { password: string }
                    const cookie = await loginToGrove(password)
                    return Response.json({ ok: true, cookie })
                } catch (err) {
                    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
                }
            },
        },
    },
})

console.log(`Grove Ingest web UI listening on ${server.url}`)
