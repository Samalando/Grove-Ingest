

export type config = {
    providers: {
        github: {
            enabled: boolean
            connector: string
        }
        googleCalendar: {
            enabled: boolean
            connector: string
        }
        gmail: {
            enabled: boolean
            connector: string
        }
    },
    output: {
        directory: string

    },
    sinks: {
        grove: {
            enabled: boolean
        }
    }
    githubToken?: string;
    composioApiKey?: string;
}

export default function setDefaultConfig(): config {
    return {
        output: {directory: "./output/",},
        sinks: {grove: {enabled: false}},
        providers: {
            github: {connector: "composio", enabled: true},
            gmail: {connector: "", enabled: false},
            googleCalendar: {connector: "composio", enabled: false}
        }

    }
}