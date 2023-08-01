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

const monitorPortal = async () => {
    const error = await callHealthcheck('https://app.dev.lilyai.net/public-env/public-env.js');
    if (!error) {
        console.log("Healthcheck ok");
        // TODO: If the healcheck succeeds, we might want to cancel any existing alert.
        return;
    }

    // Healcheck failed, create alert
    sendAlert();
};

const sendAlert = async () => {
    const url = 'https://api.opsgenie.com/v2/alerts';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'GenieKey xxx'
        },
        body: JSON.stringify({
            "message": "Monitoring: Healthcheck failed",
            "description": "Healthcheck failed to query",
            "tags": ["my-app", "app-down"],
            "details": { "key1": "value1" },
            "entity": "my-app",
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

monitorPortal();
