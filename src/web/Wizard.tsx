import { useState } from "react"
import { setConfig } from "../config"
import type { Config, GithubExportMode } from "../config/config"

type Step =
    | "dataImport"
    | "googleMode"
    | "githubMode"
    | "calendarStart"
    | "calendarEnd"
    | "dataQuantity"
    | "selectData"
    | "spikeType"
    | "composioKey"
    | "composioUser"
    | "targetDir"
    | "summary"

const initialStep: Step = "dataImport"

export default function Wizard(): JSX.Element {
    const [step, setStep] = useState<Step>(initialStep)

    const [dataImport, setDataImport] = useState<"github" | "google" | undefined>()
    const [googleMode, setGoogleMode] = useState<"gmail" | "calendar" | undefined>()
    const [githubMode, setGithubMode] = useState<GithubExportMode | undefined>()
    const [calStart, setCalStart] = useState("")
    const [calEnd, setCalEnd] = useState("")
    const [dataQuantity, setDataQuantity] = useState<"all" | "select" | undefined>()
    const [selectData, setSelectData] = useState("")
    const [spikeType, setSpikeType] = useState<"composio" | "native" | undefined>()
    const [composioKey, setComposioKey] = useState("")
    const [composioUser, setComposioUser] = useState("")
    const [targetDir, setTargetDir] = useState("")

    function reset() {
        setDataImport(undefined)
        setGoogleMode(undefined)
        setGithubMode(undefined)
        setCalStart("")
        setCalEnd("")
        setDataQuantity(undefined)
        setSelectData("")
        setSpikeType(undefined)
        setComposioKey("")
        setComposioUser("")
        setTargetDir("")
        setStep(initialStep)
    }

    function buildConfig(): Config {
        const spike = spikeType === "composio"
            ? { type: "composio" as const, composioApiKey: composioKey, username: composioUser }
            : { type: "native" as const }

        if (dataImport === "github" && githubMode !== undefined) {
            return setConfig(
                targetDir, spike, undefined,
                { mode: githubMode }, selectData, googleMode,
                calStart ? new Date(calStart) : undefined,
                calEnd ? new Date(calEnd) : undefined,
            )
        }

        return setConfig(
            targetDir, spike, undefined,
            undefined, undefined, googleMode,
            calStart ? new Date(calStart) : undefined,
            calEnd ? new Date(calEnd) : undefined,
        )
    }

    return (
        <div className="wizard">
            <span className="wizard-prompt">grove-ingest ~ sync</span>

            {step === "dataImport" && (
                <Question message="What do you want to sync?">
                    <Option label="GitHub" onClick={() => { setDataImport("github"); setStep("githubMode") }} />
                    <Option label="Google Suite" onClick={() => { setDataImport("google"); setStep("googleMode") }} />
                </Question>
            )}

            {step === "googleMode" && (
                <Question message="Please select your Google Suite type">
                    <Option label="Gmail" onClick={() => { setGoogleMode("gmail"); setStep("dataQuantity") }} />
                    <Option label="Google Calendar" onClick={() => { setGoogleMode("calendar"); setStep("calendarStart") }} />
                </Question>
            )}

            {step === "githubMode" && (
                <Question message="What from GitHub?">
                    <Option label="Pull Requests" onClick={() => { setGithubMode("prs"); setStep("dataQuantity") }} />
                    <Option label="Issues" onClick={() => { setGithubMode("issues"); setStep("dataQuantity") }} />
                </Question>
            )}

            {step === "calendarStart" && (
                <Question message="Start date of calendar ingest">
                    <input
                        className="wizard-input"
                        type="date"
                        value={calStart}
                        onChange={(e) => setCalStart(e.target.value)}
                    />
                    <NextButton disabled={!calStart} onClick={() => setStep("calendarEnd")} />
                </Question>
            )}

            {step === "calendarEnd" && (
                <Question message="End date of calendar ingest">
                    <input
                        className="wizard-input"
                        type="date"
                        value={calEnd}
                        onChange={(e) => setCalEnd(e.target.value)}
                    />
                    <NextButton disabled={!calEnd} onClick={() => setStep("dataQuantity")} />
                </Question>
            )}

            {step === "dataQuantity" && (
                <Question message="Do you want to import one bit or all the data?">
                    <Option label="All Data" onClick={() => { setDataQuantity("all"); setStep("spikeType") }} />
                    <Option label="Select data" onClick={() => { setDataQuantity("select"); setStep("selectData") }} />
                </Question>
            )}

            {step === "selectData" && (
                <Question message="Please send what data you want to import">
                    <input
                        className="wizard-input"
                        type="text"
                        value={selectData}
                        onChange={(e) => setSelectData(e.target.value)}
                    />
                    <NextButton disabled={!selectData} onClick={() => setStep("spikeType")} />
                </Question>
            )}

            {step === "spikeType" && (
                <Question message="Which do you want to use as your spike?">
                    <Option label="Composio" hint="Recommended!" onClick={() => { setSpikeType("composio"); setStep("composioKey") }} />
                    <Option label="Native" onClick={() => { setSpikeType("native"); setStep("targetDir") }} />
                </Question>
            )}

            {step === "composioKey" && (
                <Question message="Please put your Composio key below.">
                    <input
                        className="wizard-input"
                        type="password"
                        value={composioKey}
                        onChange={(e) => setComposioKey(e.target.value)}
                    />
                    <NextButton disabled={!composioKey} onClick={() => setStep("composioUser")} />
                </Question>
            )}

            {step === "composioUser" && (
                <Question message="Please put your Composio username. It must match your GitHub username.">
                    <input
                        className="wizard-input"
                        type="text"
                        value={composioUser}
                        onChange={(e) => setComposioUser(e.target.value)}
                    />
                    <NextButton disabled={!composioUser} onClick={() => setStep("targetDir")} />
                </Question>
            )}

            {step === "targetDir" && (
                <Question message="Select the output directory.">
                    <input
                        className="wizard-input"
                        type="text"
                        placeholder="./output"
                        value={targetDir}
                        onChange={(e) => setTargetDir(e.target.value)}
                    />
                    <NextButton disabled={!targetDir} onClick={() => setStep("summary")} />
                </Question>
            )}

            {step === "summary" && (
                <div className="wizard-summary">
                    <span className="wizard-line">✔ config ready</span>
                    <pre>{JSON.stringify(buildConfig(), null, 2)}</pre>
                    <button className="button" onClick={reset}>Start Over</button>
                </div>
            )}
        </div>
    )
}

function Question({ message, children }: { message: string; children: React.ReactNode }): JSX.Element {
    return (
        <div className="wizard-question">
            <span className="wizard-line">? {message}</span>
            <div className="wizard-options">{children}</div>
        </div>
    )
}

function Option({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }): JSX.Element {
    return (
        <button className="wizard-option" onClick={onClick}>
            {label}{hint ? <span className="wizard-hint"> {hint}</span> : null}
        </button>
    )
}

function NextButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }): JSX.Element {
    return (
        <button className="wizard-option" disabled={disabled} onClick={onClick}>
            Next →
        </button>
    )
}
