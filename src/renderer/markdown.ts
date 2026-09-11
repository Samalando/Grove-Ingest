

export type MarkdownConfig = {
    provider: string,
    externalId: string,
    sourceUrl?: string,
    title: string,
    body: string | null,
    createdAt: string,
    updatedAt: string,
    syncedAt: string,
    issueNumber?: number,
    repo?: string
    bodyFormat?: "text" | "html"
    kind: "github-pr" | "calendar-event" | "email" | "github-issue",
    CalendarExtra?: {
        startDate: string,
        endDate: string
    },
    EmailExtras?: {
        to: string,
        cc?: [string],
        bcc?: [string],
        threadId?: string,
    }
}