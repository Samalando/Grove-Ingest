import {Composio} from "@composio/core";

import {Config} from "../../config/config";
import {AuthNotice} from "../authNotice";

export async function calendarRun(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    if (config === undefined || config.google?.type === undefined) {
        throw new Error("config is undefined");
    }
    let me
    if (config.google?.type === "calendar") {
        me = config.google.calendar;
    }

    if (config.spike.type === "composio") {
        const composio = new Composio({
            apiKey: config.spike.composioApiKey,
        });

        const session = await composio.create(config.spike.username);

        const toolkits = await session.toolkits();
        const googlecalendar = toolkits.items.find(t => t.slug === 'googlecalendar');

        if (!googlecalendar?.connection?.isActive) {
            const auth = await session.authorize('googlecalendar');
            console.log(auth.redirectUrl);
            if (auth.redirectUrl) onAuthNotice?.({ url: auth.redirectUrl });
            await auth.waitForConnection();
            onAuthNotice?.(null);
        }

        const result = await session.execute('GOOGLECALENDAR_EVENTS_LIST_ALL_CALENDARS', {
            time_min: me?.start,
            time_max: me?.end,
            response_detail: 'full'
        });

        console.log(result.data);

        return result.data;
    }
}