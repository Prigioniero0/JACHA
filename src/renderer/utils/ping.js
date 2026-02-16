const { exec } = window.require('child_process');
const util = window.require('util');

// Helper to generate IP range
export const generateRange = (startIp, endIp) => {
    // Simple logic for last octet range for MVP
    // startIp: 192.168.1.1, endIp: 192.168.1.254
    const startParts = startIp.split('.').map(Number);
    const endParts = endIp.split('.').map(Number);
    const ips = [];

    // Only support last octet range for simplicity
    if (startParts[0] === endParts[0] && startParts[1] === endParts[1] && startParts[2] === endParts[2]) {
        for (let i = startParts[3]; i <= endParts[3]; i++) {
            ips.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
        }
    } else {
        // Fallback: just return start IP
        ips.push(startIp);
    }
    return ips;
};

const pingHost = (ip) => {
    return new Promise((resolve) => {
        // Windows ping: -n 1 (count), -w 500 (timeout ms)
        exec(`ping -n 1 -w 500 ${ip}`, (error, stdout, stderr) => {
            const isAlive = !error && stdout.includes('TTL='); // Crude check
            resolve({ ip, isAlive, output: stdout });
        });
    });
};

export const scanNetwork = async (ips, onResult, concurrency = 20) => {
    const results = [];

    // Process in chunks
    for (let i = 0; i < ips.length; i += concurrency) {
        const chunk = ips.slice(i, i + concurrency);
        const promises = chunk.map(ip => pingHost(ip).then(res => {
            onResult(res);
            return res;
        }));

        await Promise.all(promises);
    }

    return results;
};
