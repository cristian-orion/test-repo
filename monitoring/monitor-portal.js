const isSuccessStatusCode = (statusCode) => {
    return statusCode >= 200 && statusCode <= 299;
};

const callHealthcheck = async (healthcheckUrl) => {
    try {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        const data = await fetch(healthcheckUrl);
        if (!isSuccessStatusCode(data.status)) {
            // Getting the healt-check returned bad status code.
            console.log("Cannot get about data, endpoint in bad status:", data.status, data.statusText);
            return new Error(`Healthcheck endpoint returned status ${data.status}: ${data.statusText}`);
        }
        // Success
        return null;
    } catch (error) {
        // Calling healch-check endpoint failed. Maybe bad gateway error or server unavailable.
        console.log("Healcheck failed:", error);
        return error;
    }
};

const monitorPortal = async (healchCheckUrl, apiKey) => {
    const error = await callHealthcheck(healchCheckUrl);
    if (!error) {
        console.log("Healthcheck ok");
        // TODO: If the healcheck succeeds, we might want to cancel any existing alert.
        return;
    }

    // Healcheck failed, create alert
    sendAlert(apiKey);
};

const sendAlert = async (apiKey) => {
    const url = 'https://api.opsgenie.com/v2/alerts';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `GenieKey ${apiKey}`
        },
        body: JSON.stringify({
            "message": "lilyapp-portal: Healthcheck failed",
            "description": "The healthcheck failed to be querried by the monitoring cron job.",
            "tags": ["lilyapp-portal", "app-down"],
            "details": { "reporter": "ga-monitoring-cron" },
            "entity": "lilyapp-portal",
            "priority": "P3"
        })
    };

    try {
        const res = await fetch(url, options);
        console.log('created ok');
        const j = await res.json();
        console.log('payload', j);
    } catch (error) {
        console.log('Cannot create alert', error);
    }
};

// node monitor/monitor-portal.js ${{vars.HEALTHCHECK_URL}} ${{vars.GENIE_KEY}}
(() => {
    const [, , healchCheckUrl = "", alertApiKey = ""] = process.argv;
    monitorPortal(healchCheckUrl, alertApiKey);
})();
