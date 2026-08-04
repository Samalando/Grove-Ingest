import {Octokit} from '@octokit/rest';
import {Config} from '../../config/config'


export async function nativeGithub(config: Config) {
    const ClientID = "Ov23lieh21QwRwTSPrGO"

    const params = new URLSearchParams({
        client_id: ClientID,
        scope: "repo read:user",
    });


    const response = await fetch("https://github.com/login/device/code", {
        method: "POST",
        headers: {
            "Accept": "application/json",
        },
        body: params,
    });

    const data = await response.json();
    console.log("Please go to " + data.verification_uri + " and type " + data.user_code + " to continue.");
    let interval = data.interval

    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function pollForToken(deviceCode: string, initialInterval: number, expiresIn: number): Promise<string> {
        let interval = initialInterval;
        const deadline = Date.now() + expiresIn * 1000;

        while (true) {
            if (Date.now() > deadline) {
                throw new Error("Device code expired before authorization completed.");
            }

            const response = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: { "Accept": "application/json" },
                body: new URLSearchParams({
                    client_id: ClientID,
                    device_code: deviceCode,
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                }),
            });

            const data = await response.json();

            if (data.error === "authorization_pending") {
                // waiting patiently...
            } else if (data.error === "slow_down") {
                interval += 5;
            } else if (data.error) {
                throw new Error(`GitHub device authorization failed: ${data.error}`);
            } else {
                return data.access_token;
            }

            await sleep(interval * 1000);
        }
    }

    const accessToken = await pollForToken(data.device_code, interval, data.expires_in);

    const octokit = new Octokit({
        auth: accessToken
    });
    let stuffs
    if(config.github?.mode === "prs") {
        stuffs = await octokit.rest.pulls.list({
            owner: "Samalando",
            repo: "grove-ingest",
        })
    } else if (config.github?.mode === "issues") {
        stuffs = await octokit.rest.issues.list({
            owner: "Samalando",
            repo: "grove-ingest",
        })
    }

    console.log(JSON.stringify(stuffs, null, 2));
    return stuffs?.data ?? [];
}
