

export type MarkdownConfig = {
    provider: string,
    externalId: string,
    sourceUrl?: string,
    title: string,
    body: string,
    createdAt: string,
    updatedAt: string,
    syncedAt: string,
    kind: "github-pr" | "calendar-event" | "email" | "github-issue",
    CalendarExtra?: {
        startDate: string,
        endDate: string
    },
    EmailExtras?: {
        cc: [string],
        bcc: [string],
    }
}