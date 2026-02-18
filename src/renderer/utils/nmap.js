const { spawn } = window.require('child_process');

export const runNmapScan = (target, options, onData, onExit) => {
    // options can be an array of flags like ['-sV', '-T4', '-F']
    // If no nmap in PATH, this will fail. We assume nmap is installed.

    const args = [...options, target];
    console.log('Running nmap with:', args);

    const nmap = spawn('nmap', args);

    nmap.stdout.on('data', (data) => {
        onData(data.toString());
    });

    nmap.stderr.on('data', (data) => {
        onData(`STDERR: ${data.toString()}`);
    });

    nmap.on('error', (error) => {
        onData(`EXECUTION ERROR: ${error.message}\nMake sure Nmap is installed and added to your PATH.`);
    });

    nmap.on('close', (code) => {
        onExit(code);
    });

    return nmap; // Return process object to allow killing it
};
