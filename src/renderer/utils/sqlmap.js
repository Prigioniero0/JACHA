const { spawn } = window.require('child_process');
const path = window.require('path');
const fs = window.require('fs');

// Locate sqlmap.py
const getSqlMapPath = () => {
    // In production, resources are in resources/sqlmap/sqlmap.py
    // In dev, it's in resources/sqlmap/sqlmap.py relative to root
    const devPath = path.resolve('resources/sqlmap/sqlmap.py');
    const prodPath = path.join(process.resourcesPath, 'sqlmap', 'sqlmap.py');

    return fs.existsSync(prodPath) ? prodPath : devPath;
};

export const runSqlMap = (url, options, onData, onExit) => {
    const scriptPath = getSqlMapPath();
    const args = [scriptPath, '-u', url, ...options, '--batch'];
    // --batch to run non-interactive

    console.log('Running SQLMap:', args);

    const py = spawn('python', args);

    py.stdout.on('data', (data) => {
        onData(data.toString());
    });

    py.stderr.on('data', (data) => {
        onData(`STDERR: ${data.toString()}`);
    });

    py.on('error', (error) => {
        onData(`EXECUTION ERROR: ${error.message}\nEnsure Python is installed and in your PATH.`);
    });

    py.on('close', (code) => {
        onExit(code);
    });

    return py;
};
