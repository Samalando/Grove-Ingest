type IngestedItem = {
    provider: "github" | "google-calendar" | "gmail";
    externalId: string;
    sourceUrl?: string;
    title: string;
    body?: string;
    createdAt?: string;
    updatedAt?: string;
    syncedAt: string;
    kind: "email" | "calendar-event" | "github-issue" | "github-pr" | "github-repo";
    raw: unknown;
    extraData?: string[];
};