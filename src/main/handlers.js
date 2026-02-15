const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');
const dns = require('dns');
const crypto = require('crypto'); // Built-in Node.js Crypto

// Track detached processes to kill on exit
const detachedPids = [];

module.exports = function registerHandlers() {

    // --- WEBSITE SCANNER ---
    ipcMain.handle('website:scan', (event, url) => {
        const scriptPath = path.join(process.resourcesPath, 'recon', 'web_scanner.py');
        const pythonPath = 'python'; // Assumes python is in PATH. If bundled, use bundled path.

        // Check if python is available
        // In a real app, we might bundle a standalone executable or check for python.
        // For this "terminal integrated python application", we assume python environment.

        const proc = spawn(pythonPath, [scriptPath, url]);

        proc.stdout.on('data', (data) => {
            event.sender.send('website:data', data.toString());
        });

        proc.stderr.on('data', (data) => {
            event.sender.send('website:data', data.toString());
        });

        proc.on('close', (code) => {
            event.sender.send('website:exit', code);
        });

        return { pid: proc.pid };
    });

    // --- SSH TOOLS ---
    ipcMain.handle('ssh:connect', (event, { user, host, port }) => {
        // Validation
        if (!user || !host) return { error: 'Missing user or host' };

        let cmd = `ssh -p ${port || 22} ${user}@${host}`;

        // Spawn a new window with the SSH command
        // On Windows: start cmd /c "ssh ..."
        try {
            spawn('start', ['cmd', '/c', cmd], { shell: true });
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    });

    ipcMain.handle('ssh:generate', (event, filename) => {
        try {
            const scriptContent = `# Windows OpenSSH Server Setup Script
# Run as Administrator

Write-Host "Installing OpenSSH.Server..." -ForegroundColor Cyan
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

Write-Host "Starting sshd service..." -ForegroundColor Cyan
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

Write-Host "Configuring Firewall..." -ForegroundColor Cyan
if (!(Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue | Select-Object Name, Enabled)) {
    Write-Host "Firewall Rule 'OpenSSH-Server-In-TCP' does not exist, creating it..."
    New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
} else {
    Write-Host "Firewall rule already exists."
}

Write-Host "Setup Complete! You can now connect to this machine." -ForegroundColor Green
Read-Host "Press Enter to exit"
`;
            // Save to Downloads or Desktop? Or let user pick?
            // User requested "ask user to name the file". 
            // We usually save to a known location or use dialog.
            // For simplicity/consistency with other tools, let's save to 'recon' folder or Desktop?
            // Let's use dialog.showSaveDialog if possible, but handlers are main process.
            // Or just save to app directory/exports.
            // Just return the content and let frontend save it?
            // "create a file and store it...". The prompt said "create the file...".

            // Let's rely on the renderer to use 'saveFile' generic handler which creates dialog.
            // Actually, the previous 'saveFile' handler creates a file at a specific path?
            // Let's assume the frontend passes the content to 'saveFile'.
            // So this handler is just to GET the template?
            // Or this handler writes it.

            // Re-reading prompt: "generate ssh connector, it will ask the user to name the file... generate proper program".
            // Since I am generating a PS1 script, I can just return the string to the frontend
            // and the frontend can use window.electron.saveFile(content, filename).

            return { content: scriptContent };
        } catch (e) {
            return { error: e.message };
        }
    });

    // --- APP CONTROL ---


    ipcMain.on('app:quit', () => {
        app.quit();
    });

    ipcMain.on('window:minimize', () => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getFocusedWindow()?.minimize();
    });

    ipcMain.on('window:maximize', () => {
        const { BrowserWindow } = require('electron');
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            if (win.isMaximized()) win.unmaximize();
            else win.maximize();
        }
    });

    // --- DASHBOARD ---
    ipcMain.handle('dashboard:stats', () => {
        return {
            cpu: os.cpus()[0].model,
            ram: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
            platform: os.platform(),
            uptime: `${(os.uptime() / 3600).toFixed(1)} hrs`
        };
    });

    // --- NMAP SCANNER ---
    let nmapProcess = null;
    ipcMain.on('nmap:start', (event, { target, flags }) => {
        if (nmapProcess) return;

        // Path to Nmap (Bundled or System)
        const nmapPath = 'nmap';

        const args = [...flags, target];
        nmapProcess = spawn(nmapPath, args);

        nmapProcess.stdout.on('data', (data) => {
            event.reply('nmap:data', data.toString());
        });

        nmapProcess.stderr.on('data', (data) => {
            event.reply('nmap:data', data.toString());
        });

        nmapProcess.on('close', (code) => {
            event.reply('nmap:exit', code);
            nmapProcess = null;
        });
    });

    ipcMain.on('nmap:run_cli', (event, commandString) => {
        if (nmapProcess) return;

        // Basic parsing: split by spaces, respecting quotes
        // Regex: [^\s"]+|"([^"]*)"
        const args = [];
        const regex = /[^\s"]+|"([^"]*)"/g;
        let match;
        while ((match = regex.exec(commandString)) !== null) {
            // If group 1 exists, it's a quoted string (without quotes)
            // Otherwise match[0] is the word
            args.push(match[1] ? match[1] : match[0]);
        }

        // If user typed 'nmap -v', remove 'nmap'
        if (args.length > 0 && args[0].toLowerCase() === 'nmap') {
            args.shift();
        }

        const nmapPath = 'nmap'; // System nmap
        nmapProcess = spawn(nmapPath, args);

        nmapProcess.stdout.on('data', (data) => event.reply('nmap:data', data.toString()));
        nmapProcess.stderr.on('data', (data) => event.reply('nmap:data', data.toString()));
        nmapProcess.on('error', (err) => event.reply('nmap:data', `\n[!] Execution Error: ${err.message}`));
        nmapProcess.on('close', (code) => {
            event.reply('nmap:exit', code);
            nmapProcess = null;
        });
    });

    ipcMain.on('nmap:stop', () => {
        if (nmapProcess) {
            nmapProcess.kill();
            nmapProcess = null;
        }
    });

    // --- RECON (Whois, Ping, Trace, NSLookup) ---
    ipcMain.handle('recon:whois', async (event, domain) => {
        return new Promise(resolve => {
            // Priority 1: System PATH
            const checkSystem = spawn('where', ['whois']);

            checkSystem.on('close', (code) => {
                let executable = 'whois';
                let args = [domain];

                if (code !== 0) {
                    // Bundled
                    const portableWhois = path.join(process.resourcesPath, 'bin', 'whois.exe');
                    if (fs.existsSync(portableWhois)) {
                        executable = portableWhois;
                        args = ['-accepteula', domain];
                    } else {
                        return resolve("Error: 'whois' tool missing.");
                    }
                }

                const whois = spawn(executable, args);
                let output = '';
                whois.stdout.on('data', d => output += d);
                whois.stderr.on('data', d => output += d);

                whois.on('error', (err) => resolve("Execution Error: " + err.message));
                whois.on('close', () => resolve(output || 'No output.'));
            });
        });
    });

    ipcMain.handle('recon:ping', async (event, target) => {
        return new Promise(resolve => {
            const ping = spawn('ping', ['-n', '4', target]);
            let output = '';
            ping.stdout.on('data', d => output += d);
            ping.stderr.on('data', d => output += d);
            ping.on('close', () => resolve(output));
        });
    });

    ipcMain.handle('recon:trace', async (event, target) => {
        return new Promise(resolve => {
            const trace = spawn('tracert', ['-d', target]);
            let output = '';
            trace.stdout.on('data', d => output += d);
            trace.on('close', () => resolve(output));
        });
    });

    ipcMain.handle('recon:nslookup', async (event, target) => {
        return new Promise(resolve => {
            const ns = spawn('nslookup', [target]);
            let output = '';
            ns.stdout.on('data', d => output += d);
            ns.stderr.on('data', d => output += d);
            ns.on('close', () => resolve(output));
        });
    });

    ipcMain.handle('recon:reverse', async (event, ip) => {
        try {
            const hostnames = await dns.promises.reverse(ip);
            return hostnames.join('\n');
        } catch (e) {
            return `Error: ${e.message}`;
        }
    });

    // --- RECON EXTENDED ---
    ipcMain.handle('recon:dns', async (event, domain) => {
        // Google DNS 8.8.8.8
        return new Promise(resolve => {
            const ns = spawn('nslookup', [domain, '8.8.8.8']);
            let output = '';
            ns.stdout.on('data', d => output += d);
            ns.stderr.on('data', d => output += d);
            ns.on('close', () => resolve(output));
        });
    });

    // --- SUBDOMAINS ---
    ipcMain.handle('subdomain:crt', async (event, domain) => {
        try {
            const response = await fetch(`https://crt.sh/?q=%.${domain}&output=json`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const json = await response.json();
            const names = [...new Set(json.map(entry => entry.name_value).flatMap(name => name.split('\n')))];
            return names;
        } catch (e) {
            return `Error fetching crt.sh: ${e.message}`;
        }
    });

    ipcMain.handle('subdomain:sublist3r', async (event, domain) => {
        const scriptPath = path.join(process.resourcesPath, 'sublist3r', 'sublist3r.py');
        if (!fs.existsSync(scriptPath)) return 'Error: Sublist3r script not found in resources/sublist3r.';

        return new Promise(resolve => {
            const py = spawn('python', [scriptPath, '-d', domain]);
            let output = '';
            py.stdout.on('data', d => output += d);
            py.stderr.on('data', d => output += d);
            py.on('close', () => resolve(output));
        });
    });

    ipcMain.handle('subdomain:knock', async (event, { domain, args = [] }) => {
        const scriptPath = path.join(process.resourcesPath, 'knock', 'knockpy.py');
        if (!fs.existsSync(scriptPath)) return 'Error: Knockpy script not found.';
        return new Promise(resolve => {
            const cmdArgs = [scriptPath];
            if (domain) cmdArgs.push('-d', domain);
            if (args && args.length > 0) cmdArgs.push(...args);
            const py = spawn('python', cmdArgs);
            let output = '';
            py.stdout.on('data', d => output += d);
            py.stderr.on('data', d => output += d);
            py.on('error', (err) => resolve("Execution Error: " + err.message));
            py.on('close', () => resolve(output || 'No output.'));
        });
    });

    // --- PYTHON BRUTE FORCE (Replaces DNSDumpster) ---
    ipcMain.handle('subdomain:brute', async (event, domain) => {
        const scriptPath = path.join(process.resourcesPath, 'recon', 'advanced_recon.py');
        if (!fs.existsSync(scriptPath)) return 'Error: Advanced Recon script not found in resources/recon/advanced_recon.py';

        return new Promise(resolve => {
            // Spawn Python script
            const py = spawn('python', [scriptPath, domain]);
            let output = '';
            py.stdout.on('data', d => output += d);
            py.stderr.on('data', d => output += d); // advanced_recon uses prints, but catch stderr too

            py.on('error', (err) => resolve("Execution Error: " + err.message));
            py.on('close', () => resolve(output || 'No output.'));
        });
    });

    // --- DISCOVERY ---
    ipcMain.handle('discovery:scan', async (event, ips) => {
        const results = [];
        const batchSize = 50; // Process 50 IPs at a time

        // Helper to chunk array
        const chunks = [];
        for (let i = 0; i < ips.length; i += batchSize) {
            chunks.push(ips.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const promises = chunk.map(ip => {
                return new Promise(resolve => {
                    // Increased timeout to 800ms
                    const p = spawn('ping', ['-n', '1', '-w', '800', ip]);
                    p.on('close', (code) => {
                        resolve({ ip, isAlive: code === 0 });
                    });
                });
            });
            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults);
        }

        return results;
    });

    // --- TOOLS REMOVED: SPIDER, SQLMAP, HASHCAT, METASPLOIT ---

    // --- CLI TERMINAL LAUNCHERS ---
    ipcMain.on('cli:open', (event, tool) => {
        const spawnTerminal = (command, argsArray) => {
            const child = spawn(command, argsArray, {
                detached: true,
                stdio: 'ignore',
                windowsHide: false
            });
            child.unref();
            detachedPids.push(child.pid);
        };
        switch (tool) {
            case 'nmap':
                spawnTerminal('cmd.exe', ['/k', 'nmap', '--help']);
                break;
            case 'ping':
                spawnTerminal('cmd.exe', ['/k', 'ping', '127.0.0.1']);
                break;
        }
    });



    // --- LOCAL SERVER ---
    let serverProcess = null;
    ipcMain.handle('server:start', (event, { port, directory }) => {
        if (serverProcess) return { success: false, message: 'Server already running' };
        const args = ['-m', 'http.server', port, '--directory', directory];
        serverProcess = spawn('python', args);

        return new Promise((resolve) => {
            setTimeout(() => {
                if (serverProcess && serverProcess.exitCode === null) {
                    resolve({ success: true, pid: serverProcess.pid });
                } else {
                    serverProcess = null;
                    resolve({ success: false, message: 'Failed to start. Port busy?' });
                }
            }, 1000);
        });
    });

    ipcMain.handle('server:stop', () => {
        if (serverProcess) {
            serverProcess.kill();
            serverProcess = null;
            return true;
        }
        return false;
    });

    ipcMain.handle('system:ip', () => {
        const nets = os.networkInterfaces();
        const results = {};
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    if (!results[name]) results[name] = [];
                    results[name].push(net.address);
                }
            }
        }
        return results;
    });

    // --- UTILS: EXPORT ---
    ipcMain.handle('app:save-file', async (event, { content, filename }) => {
        const { dialog } = require('electron');
        const { filePath } = await dialog.showSaveDialog({
            defaultPath: filename,
            filters: [{ name: 'Text Files', extensions: ['txt', 'log'] }]
        });
        if (filePath) {
            fs.writeFileSync(filePath, content);
            return true;
        }
        return false;
    });

    // --- UTILS: CRYPTO ---
    ipcMain.handle('crypto:encrypt', async (event, { filePath, password }) => {
        // ... (Crypto Logic)
        try {
            if (!fs.existsSync(filePath)) throw new Error('File not found');
            const plainBuffer = fs.readFileSync(filePath);
            const salt = crypto.randomBytes(16);
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
            const authTag = cipher.getAuthTag();
            const outputBuffer = Buffer.concat([salt, iv, authTag, encrypted]);
            const outPath = filePath + '.enc';
            fs.writeFileSync(outPath, outputBuffer);
            return { success: true, path: outPath };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('crypto:decrypt', async (event, { filePath, password }) => {
        // ... (Crypto Logic)
        try {
            if (!fs.existsSync(filePath)) throw new Error('File not found');
            const inputBuffer = fs.readFileSync(filePath);
            const salt = inputBuffer.subarray(0, 16);
            const iv = inputBuffer.subarray(16, 28);
            const authTag = inputBuffer.subarray(28, 44);
            const ciphertext = inputBuffer.subarray(44);
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            let cleanPath = filePath.endsWith('.enc') ? filePath.slice(0, -4) : filePath + '.dec';
            if (fs.existsSync(cleanPath)) cleanPath = path.join(path.dirname(cleanPath), 'DECRYPTED_' + path.basename(cleanPath));
            fs.writeFileSync(cleanPath, decrypted);
            return { success: true, path: cleanPath };
        } catch (e) {
            return { success: false, error: 'Decryption Failed' };
        }
    });

    ipcMain.handle('dialog:open-file', async () => {
        const { dialog } = require('electron');
        const { filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
        return filePaths[0] || null;
    });

    // --- APP MAINTENANCE ---
    ipcMain.on('app:check-updates', () => {
        const { shell } = require('electron');
        const urls = [
            'https://nmap.org/download.html',
            'https://www.python.org/downloads/'
        ];
        urls.forEach(url => shell.openExternal(url));
    });

    // --- CLEANUP ON EXIT ---
    app.on('before-quit', () => {
        // Kill Nmap
        if (nmapProcess) {
            try { nmapProcess.kill(); } catch (e) { }
        }
        // Kill Server
        if (serverProcess) {
            try { serverProcess.kill(); } catch (e) { }
        }
        // Kill Detached Terminals
        detachedPids.forEach(pid => {
            try {
                // '-' prefix kills process group on non-Windows, but for Windows terminals:
                process.kill(pid);
            } catch (e) {
                // Process might already be dead
            }
        });
    });

};
