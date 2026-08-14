import { useEffect, useRef, useState } from "react"
import { setConfig } from "../config"
import type { Config, GithubExportMode } from "../config/config"

type EmailTag = { name: string; visual: string }

const EMAIL_TAGS: EmailTag[] = [
    { name: "INBOX", visual: "Inbox" },
    { name: "SPAM", visual: "Spam" },
    { name: "TRASH", visual: "Trash" },
    { name: "UNREAD", visual: "Unread" },
    { name: "STARRED", visual: "Starred" },
    { name: "IMPORTANT", visual: "Important" },
    { name: "CATEGORY_PRIMARY", visual: "Primary category" },
    { name: "CATEGORY_SOCIAL", visual: "Social Category" },
    { name: "CATEGORY_PROMOTIONS", visual: "Promotional Category" },
    { name: "CATEGORY_UPDATES", visual: "Update Category" },
    { name: "CATEGORY_FORUMS", visual: "Forum Category" },
]

type ImportOption = "Import option" | "Pull Requests" | "Issues" | "Gmail" | "Google Calendar"
type SpikeOption = "Spike" | "Composio" | "Native"
type RunStatus = "idle" | "running" | "success" | "error"

type MenuItem = { label: string; value: string; hint?: string }
type MenuSection = { heading: string; items: MenuItem[] }

const supportsDirectoryPicker = typeof window !== "undefined" && "showDirectoryPicker" in window

function useCloseOnOutsideClick(open: boolean, onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        function handleOutsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        document.addEventListener("mousedown", handleOutsideClick)
        return () => document.removeEventListener("mousedown", handleOutsideClick)
    }, [open, onClose])

    return ref
}

function MenuButton({ label, sections, onSelect }: { label: string; sections: MenuSection[]; onSelect: (value: string) => void }): JSX.Element {
    const [open, setOpen] = useState(false)
    const ref = useCloseOnOutsideClick(open, () => setOpen(false))

    return (
        <div className="menu" ref={ref}>
            <button type="button" className="menu-trigger" onClick={() => setOpen((o) => !o)}>
                {label}
                <span className="menu-chevron">⌄</span>
            </button>
            {open && (
                <div className="menu-panel">
                    {sections.map((section, i) => (
                        <div className="menu-section" key={section.heading}>
                            {i > 0 && <div className="menu-divider" />}
                            <div className="menu-heading">{section.heading}</div>
                            {section.items.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className="menu-item"
                                    title={item.hint}
                                    onClick={() => { onSelect(item.value); setOpen(false) }}
                                >
                                    {item.label}
                                    {item.hint ? <span className="menu-hint"> {item.hint}</span> : null}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function FolderPicker({ value, onChange }: { value: string; onChange: (path: string) => void }): JSX.Element {
    const [open, setOpen] = useState(false)
    const [browsePath, setBrowsePath] = useState("")
    const [parent, setParent] = useState<string | null>(null)
    const [entries, setEntries] = useState<string[]>([])
    const [error, setError] = useState<string | undefined>()
    const ref = useCloseOnOutsideClick(open, () => setOpen(false))

    async function load(path?: string) {
        setError(undefined)
        try {
            const res = await fetch(`/api/browse${path ? `?path=${encodeURIComponent(path)}` : ""}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? "Could not read that folder")
            setBrowsePath(data.path)
            setParent(data.parent)
            setEntries(data.entries)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        }
    }

    return (
        <div className="folder-picker" ref={ref}>
            <div className="folder-picker-row">
                <input
                    className="text-input"
                    type="text"
                    placeholder="./output"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <button type="button" className="option-button" onClick={() => { setOpen(true); load(value || undefined) }}>Browse…</button>
            </div>
            {open && (
                <div className="folder-browser">
                    <div className="folder-browser-path">{browsePath || "Loading…"}</div>
                    {error && <div className="folder-browser-error">{error}</div>}
                    <div className="folder-browser-list">
                        {parent && (
                            <button type="button" className="folder-browser-entry" onClick={() => load(parent)}>.. (up)</button>
                        )}
                        {entries.map((name) => (
                            <button
                                key={name}
                                type="button"
                                className="folder-browser-entry"
                                onClick={() => load(`${browsePath}/${name}`)}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                    <div className="folder-browser-actions">
                        <button type="button" className="primary-button" onClick={() => { onChange(browsePath); setOpen(false) }}>Use this folder</button>
                        <button type="button" className="option-button" onClick={() => setOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    )
}

function NativeFolderPicker({ handle, onChoose }: { handle: FileSystemDirectoryHandle | undefined; onChoose: (handle: FileSystemDirectoryHandle) => void }): JSX.Element {
    const [error, setError] = useState<string | undefined>()

    async function choose() {
        setError(undefined)
        try {
            const picked = await window.showDirectoryPicker({ mode: "readwrite" })
            onChoose(picked)
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return
            setError(err instanceof Error ? err.message : String(err))
        }
    }

    return (
        <div className="field-group">
            <button type="button" className="option-button" onClick={choose}>
                {handle ? `📁 ${handle.name}` : "Choose output folder…"}
            </button>
            {error && <div className="folder-browser-error">{error}</div>}
        </div>
    )
}

export default function ContentView(): JSX.Element {
    const [option, setOption] = useState<ImportOption>("Import option")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [next, setNext] = useState(false)
    const [spike, setSpike] = useState<SpikeOption>("Spike")
    const [password, setPassword] = useState("")
    const [composioUser, setComposioUser] = useState("")
    const [dataQuantity, setDataQuantity] = useState<"all" | "select" | undefined>()
    const [selectData, setSelectData] = useState("")
    const [targetDir, setTargetDir] = useState("")
    const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | undefined>()
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [config, setBuiltConfig] = useState<Config | undefined>()
    const [runStatus, setRunStatus] = useState<RunStatus>("idle")
    const [runError, setRunError] = useState<string | undefined>()
    const [writtenCount, setWrittenCount] = useState<number | undefined>()
    const [authNotice, setAuthNotice] = useState<{ url: string; code?: string } | null>(null)
    const [repoOptions, setRepoOptions] = useState<string[]>([])
    const [repoStatus, setRepoStatus] = useState<"idle" | "loading" | "error">("idle")
    const [repoError, setRepoError] = useState<string | undefined>()

    useEffect(() => {
        if (runStatus !== "running" && repoStatus !== "loading") {
            setAuthNotice(null)
            return
        }
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/api/auth-status")
                const data = await res.json()
                setAuthNotice(data.notice ?? null)
            } catch {
                // transient poll failure, try again next tick
            }
        }, 1200)
        return () => clearInterval(interval)
    }, [runStatus, repoStatus])

    async function loadRepos() {
        setRepoStatus("loading")
        setRepoError(undefined)
        try {
            const res = await fetch("/api/github/repos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ composioApiKey: password, username: composioUser }),
            })
            const data = await res.json()
            if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not load repositories")
            setRepoOptions(data.repos as string[])
            setRepoStatus("idle")
        } catch (err) {
            setRepoStatus("error")
            setRepoError(err instanceof Error ? err.message : String(err))
        }
    }

    const dataImport: "github" | "google" | undefined =
        option === "Pull Requests" || option === "Issues" ? "github"
        : option === "Gmail" || option === "Google Calendar" ? "google"
        : undefined

    const githubMode: GithubExportMode | undefined =
        option === "Pull Requests" ? "prs" : option === "Issues" ? "issues" : undefined

    const googleMode: "gmail" | "calendar" | undefined =
        option === "Gmail" ? "gmail" : option === "Google Calendar" ? "calendar" : undefined

    function chooseOption(value: ImportOption) {
        setOption(value)
        setNext(false)
        setSpike("Spike")
        setBuiltConfig(undefined)
        setRunStatus("idle")
        setRepoOptions([])
        setRepoStatus("idle")
        setSelectData("")
    }

    function chooseSpike(value: SpikeOption) {
        setSpike(value)
        setBuiltConfig(undefined)
        setRunStatus("idle")
    }

    function toggleTag(name: string) {
        setSelectedTags((prev) => {
            const updated = new Set(prev)
            if (updated.has(name)) updated.delete(name)
            else updated.add(name)
            return updated
        })
    }

    const readyForNext = option !== "Import option"
        && (googleMode !== "calendar" || (startDate !== "" && endDate !== ""))
        && (dataQuantity === "all" || (dataQuantity === "select" && (googleMode === "gmail" ? selectedTags.size > 0 : selectData !== "")))

    const hasOutputTarget = supportsDirectoryPicker ? dirHandle !== undefined : targetDir !== ""

    const readyToRun = spike !== "Spike"
        && hasOutputTarget
        && (spike !== "Composio" || (password !== "" && composioUser !== ""))

    async function runIngest() {
        const spikeConfig = spike === "Composio"
            ? { type: "composio" as const, composioApiKey: password, username: composioUser }
            : { type: "native" as const }

        const built = setConfig(
            targetDir,
            spikeConfig,
            undefined,
            githubMode ? { mode: githubMode } : undefined,
            selectData,
            googleMode,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        )
        setBuiltConfig(built)
        setRunStatus("running")
        setRunError(undefined)

        try {
            if (dirHandle) {
                const res = await fetch("/api/render", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(built),
                })
                const data = await res.json()
                if (!res.ok || !data.ok) throw new Error(data.error ?? "Render failed")

                const files = data.files as { filename: string; content: string }[]
                for (const file of files) {
                    const fileHandle = await dirHandle.getFileHandle(file.filename, { create: true })
                    const writable = await fileHandle.createWritable()
                    await writable.write(file.content)
                    await writable.close()
                }
                setWrittenCount(files.length)
                setRunStatus("success")
            } else {
                const res = await fetch("/api/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(built),
                })
                const data = await res.json()
                if (!res.ok || !data.ok) throw new Error(data.error ?? "Ingest failed")
                setWrittenCount(data.written)
                setRunStatus("success")
            }
        } catch (err) {
            setRunError(err instanceof Error ? err.message : String(err))
            setRunStatus("error")
        }
    }

    return (
        <div className="content-view">
            <MenuButton
                label={option}
                onSelect={(value) => chooseOption(value as ImportOption)}
                sections={[
                    { heading: "GitHub", items: [
                        { label: "Pull Requests", value: "Pull Requests" },
                        { label: "Issues", value: "Issues" },
                    ] },
                    { heading: "Google suite", items: [
                        { label: "Gmail", value: "Gmail" },
                        { label: "Google Calendar", value: "Google Calendar" },
                    ] },
                ]}
            />

            {googleMode === "calendar" && (
                <div className="field-group">
                    <label className="field">
                        <span className="field-label">Start date of ingest</span>
                        <input className="text-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </label>
                    <label className="field">
                        <span className="field-label">End date of ingest</span>
                        <input className="text-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </label>
                </div>
            )}

            {dataImport && (
                <div className="field-group">
                    <span className="field-label">Do you want to import one bit or all the data?</span>
                    <div className="option-row">
                        <button type="button" className={dataQuantity === "all" ? "option-button option-button-selected" : "option-button"} onClick={() => setDataQuantity("all")}>All Data</button>
                        <button type="button" className={dataQuantity === "select" ? "option-button option-button-selected" : "option-button"} onClick={() => setDataQuantity("select")}>Select data</button>
                    </div>
                    {dataQuantity === "select" && googleMode === "gmail" && (
                        <div className="tag-list">
                            {EMAIL_TAGS.map((tag) => (
                                <button
                                    key={tag.name}
                                    type="button"
                                    className={selectedTags.has(tag.name) ? "tag-button tag-button-selected" : "tag-button"}
                                    onClick={() => toggleTag(tag.name)}
                                >
                                    <span>{tag.visual}</span>
                                    {selectedTags.has(tag.name) && <span>✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                    {dataQuantity === "select" && dataImport === "github" && (
                        <div className="field-group">
                            <span className="field-label">Composio credentials (needed to list your repositories)</span>
                            <input
                                className="text-input"
                                type="password"
                                placeholder="ak_XXX..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <input
                                className="text-input"
                                type="text"
                                placeholder="Composio username"
                                value={composioUser}
                                onChange={(e) => setComposioUser(e.target.value)}
                            />
                            <button
                                type="button"
                                className="option-button"
                                disabled={!password || !composioUser || repoStatus === "loading"}
                                onClick={loadRepos}
                            >
                                {repoStatus === "loading" ? "Loading repositories…" : "Load my repositories"}
                            </button>
                            {repoStatus === "error" && <div className="folder-browser-error">{repoError}</div>}
                            {repoOptions.length > 0 && (
                                <select
                                    className="text-input"
                                    value={selectData}
                                    onChange={(e) => setSelectData(e.target.value)}
                                >
                                    <option value="" disabled>Choose a repository…</option>
                                    {repoOptions.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                    {dataQuantity === "select" && googleMode === "calendar" && (
                        <input
                            className="text-input"
                            type="text"
                            placeholder="Please send what data you want to import"
                            value={selectData}
                            onChange={(e) => setSelectData(e.target.value)}
                        />
                    )}
                </div>
            )}

            {option !== "Import option" && spike === "Spike" && (
                <button type="button" className="primary-button" disabled={!readyForNext} onClick={() => setNext(true)}>Next...</button>
            )}

            {next && (
                <div className="field-group">
                    <span className="field-label">Select your spike:</span>
                    <MenuButton
                        label={spike}
                        onSelect={(value) => chooseSpike(value as SpikeOption)}
                        sections={[
                            { heading: "Spike", items: [
                                { label: "Composio", value: "Composio", hint: "Recommended!" },
                                { label: "Native", value: "Native", hint: "May or may not exist!" },
                            ] },
                        ]}
                    />
                </div>
            )}

            {spike === "Composio" && (
                <div className="field-group">
                    <input
                        className="text-input"
                        type="password"
                        placeholder="ak_XXX..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        className="text-input"
                        type="text"
                        placeholder="Composio username (Must match your GitHub username)"
                        value={composioUser}
                        onChange={(e) => setComposioUser(e.target.value)}
                    />
                </div>
            )}

            {spike !== "Spike" && (
                supportsDirectoryPicker
                    ? <NativeFolderPicker handle={dirHandle} onChoose={(h) => { setDirHandle(h); setTargetDir(h.name) }} />
                    : <FolderPicker value={targetDir} onChange={setTargetDir} />
            )}

            {readyToRun && (
                <button type="button" className="primary-button" disabled={runStatus === "running"} onClick={runIngest}>
                    {runStatus === "running" ? "Running…" : "Run ingest"}
                </button>
            )}

            {authNotice && (
                <div className="auth-banner">
                    <span>Composio isn't connected yet — authorize it to continue:</span>
                    <a className="auth-banner-link" href={authNotice.url} target="_blank" rel="noreferrer">
                        {authNotice.url}
                    </a>
                    {authNotice.code && <span>Enter this code when prompted: <strong>{authNotice.code}</strong></span>}
                </div>
            )}

            {config && (
                <div className="summary">
                    {runStatus === "success" && (
                        <span className="summary-line summary-line-success">
                            ✔ Synced {writtenCount} file{writtenCount === 1 ? "" : "s"} to {config.outputDir}
                        </span>
                    )}
                    {runStatus === "error" && (
                        <span className="summary-line summary-line-error">✕ {runError}</span>
                    )}
                    <pre className="summary-pre">{JSON.stringify(config, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}
