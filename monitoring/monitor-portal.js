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
};

monitorPortal();
