import {Config} from "../config/config";
import {prsRun} from "./github/prs";
import {issuesRun} from "./github/issues";
import {calendarEventsRun} from "./calender/composio"
import {nativeRun} from "./github/native"
import {gmailMessagesRun} from "./gmail/composio";
import {AuthNotice} from "../connectors/authNotice";

export async function renderFunc(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    if (config === undefined) {
        throw new Error("config is undefined");
    }
    let thing;
    if(config.spike.type === "native"){
        thing = await nativeRun(config, onAuthNotice);
    } else if (config.github?.mode === "prs") {
        thing = await prsRun(config, onAuthNotice);
    } else if (config.github?.mode === "issues") {
        thing = await issuesRun(config, onAuthNotice);
    } else if (config.google?.type === "calendar") {
        thing = await calendarEventsRun(config, onAuthNotice);
    } else if (config.google?.type === "gmail") {
        thing = await gmailMessagesRun(config, onAuthNotice);
    }
    else {
        throw new Error("Config doesnt exist!");
    }


    return thing;
}