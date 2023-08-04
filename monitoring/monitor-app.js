// Checks an app's healthcheck and if it fails an alert in opsgenie is created.
//
// Usage (in github actions):
// node monitor/monitor-app.js lilyapp-portal development ${{vars.HEALTHCHECK_URL}} ${{vars.GENIE_KEY}}

const isSuccessStatusCode = (statusCode) => {
    return statusCode >= 200 && statusCode <= 299;
};

const callHealthcheck = async (healthcheckUrl) => {
    try {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        const data = await fetch(healthcheckUrl);
        if (!isSuccessStatusCode(data.status)) {
            // Getting the healt-check returned bad status code.
            console.log('Cannot get about data, endpoint in bad status:', data.status, data.statusText);
            return new Error(`Healthcheck endpoint returned status ${data.status}: ${data.statusText}`);
        }
        // Success
        return null;
    } catch (error) {
        // Calling health-check endpoint failed. Maybe bad gateway error or server unavailable.
        console.log('Health-check failed:', error);
        return error;
    }
};

const monitorPortal = async (healthCheckUrl) => {
    const error = await callHealthcheck(healthCheckUrl);
    if (!error) {
        console.log('Health check ok');
        // TODO: If the health check succeeds, we might want to cancel any existing alert.
        return;
    }

    // Health-check failed, create alert
    sendAlert();
};

const sendAlert = async () => {
    const [, , appName = '', appEnv = '', healthCheckUrl = '', apiKey = ''] = process.argv;

    const url = 'https://api.opsgenie.com/v2/alerts';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `GenieKey ${apiKey}`
        },
        body: JSON.stringify({
            'alias': `${appName}-${appEnv}-app-down`, // Key for deduplication
            'message': `(${appEnv}) ${appName}: Healthcheck failed`,
            'description': `The healthcheck failed for ${appName} in ${appEnv} to be querried by the monitoring cron job.`,
            'tags': [appName, 'app-down'],
            'details': { 'reporter': 'ga-monitoring-cron' },
            'entity': appName,
            'priority': 'P3'
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

(() => {
    const [, , healthCheckUrl = ''] = process.argv;
    monitorPortal(healthCheckUrl);
})();
