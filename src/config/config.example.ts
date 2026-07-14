export type configExample = {
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
        sinks: {
                grove: {
                    enabled: boolean
                }
            }
        githubToken?: string;
        composioApiKey?: string;
    }
}