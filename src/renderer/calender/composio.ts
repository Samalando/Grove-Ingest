import { calendarRun } from "../../connectors/calender/composio";
import { MarkdownConfig } from "../markdown";
import { Config } from "../../config/config";
import { AuthNotice } from "../../connectors/authNotice";

export async function calendarEventsRun(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void): Promise<MarkdownConfig[]> {
    const now: Date = new Date();
    const isoString: string = now.toISOString();

    const result: any = await calendarRun(config, onAuthNotice);
    const summaryView = result?.summary_view ?? [];
    const events = result?.events ?? [];

    return summaryView.map((summary: any, i: number): MarkdownConfig => {
        const raw = events[i]?.event ?? {};

        return {
            provider: "google-calendar",
            externalId: summary.event_id,
            sourceUrl: summary.display_url,
            title: summary.title,
            body: raw.description ?? null,
            createdAt: raw.created ?? summary.start,
            updatedAt: raw.updated ?? summary.start,
            syncedAt: isoString,
            kind: "calendar-event",
            CalendarExtra: {
                startDate: summary.start,
                endDate: summary.end,
            },
        };
    });
}
