import Octokit from '@octokit/rest';


async function fetchUsers() {
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

            const response = await fetch("https://github.com/login/access_token", {
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
                console.log("not yet authorized, keep polling")
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

    return pollForToken(data.device_code, interval, data.expires_in);
}



fetchUsers()
    .then((token) => console.log("Access token:", token))
    .catch((err) => console.error(err));