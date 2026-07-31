import {Config} from "../config/config";
import {prsRun} from "./github/prs";
import {issuesRun} from "./github/issues";

export async function renderFunc(config: Config) {
    if (config === undefined) {
        throw new Error("config is undefined");
    }
    let thing;
    if (config.github?.mode === "prs") {
        thing = await prsRun(config);
    } else if (config.github?.mode === "issues") {
        thing = await issuesRun(config);
    } else if (config.google?.type === "calendar" || config.google?.type === "gmail") {
        throw new Error("Google doesnt exist!");
    } else {
        throw new Error("Config doesnt exist!");
    }
    return thing;
}