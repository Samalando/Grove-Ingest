import {Config} from "../config/config";
import {prsRun} from "./github/prs";
import {issuesRun} from "./github/issues";
import {calendarEventsRun} from "./calender/composio"
import {nativeRun} from "./github/native"
import {gmailMessagesRun} from "./gmail/composio";

export async function renderFunc(config: Config) {
    if (config === undefined) {
        throw new Error("config is undefined");
    }
    let thing;
    if(config.spike.type === "native"){
        thing = await nativeRun(config);
    } else if (config.github?.mode === "prs") {
        thing = await prsRun(config);
    } else if (config.github?.mode === "issues") {
        thing = await issuesRun(config);
    } else if (config.google?.type === "calendar") {
        thing = await calendarEventsRun(config);
    } else if (config.google?.type === "gmail") {
        thing = await gmailMessagesRun(config);
    }
    else {
        throw new Error("Config doesnt exist!");
    }


    return thing;
}