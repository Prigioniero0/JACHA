const { app, ipcMain, dialog } = require('electron');
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

    ipcMain.handle('ssh:generate', (event, { port }) => {
        const portNum = port || 22;
        try {
            const scriptContent = `# Windows OpenSSH Server Setup Script
# Run as Administrator

Write-Host "Installing OpenSSH.Server..." -ForegroundColor Cyan
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

Write-Host "Configuring SSH Port to ${portNum}..." -ForegroundColor Cyan
$configPath = "$env:ProgramData\\ssh\\sshd_config"

# Check if config exists (it should after install)
if (Test-Path $configPath) {
    (Get-Content $configPath).Replace("#Port 22", "Port ${portNum}").Replace("Port 22", "Port ${portNum}") | Set-Content $configPath
} else {
    Write-Warning "sshd_config not found. Service might default to 22."
}

Write-Host "Starting sshd service..." -ForegroundColor Cyan
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

Write-Host "Configuring Firewall..." -ForegroundColor Cyan
Remove-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue
New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort ${portNum}

Write-Host "Setup Complete! Listening on Port ${portNum}" -ForegroundColor Green
Read-Host "Press Enter to exit"
`;
            return { content: scriptContent };
        } catch (e) {
            return { error: e.message };
        }
    });

    // --- HTTPS (WinRM) TOOLS ---
    ipcMain.handle('winrm:connect', (event, { host, port, user }) => {
        if (!host) return { error: 'Missing host' };
        const p = port || 5986;
        // Command to launch PowerShell and enter session
        // Requires user to enter password in the new window (secure)
        const cmd = `powershell -NoExit -Command "$cred = Get-Credential ${user || ''}; Enter-PSSession -ComputerName ${host} -Port ${p} -UseSSL -Credential $cred -SessionOption (New-PSSessionOption -SkipCACheck -SkipCNCheck)"`;

        try {
            spawn('start', ['cmd', '/c', cmd], { shell: true });
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    });

    ipcMain.handle('winrm:generate', (event, { port }) => {
        const portNum = port || 5986;
        try {
            const scriptContent = `# WinRM over HTTPS Setup Script
# Run as Administrator

Write-Host "Enabling WinRM..." -ForegroundColor Cyan
Enable-PSRemoting -Force -SkipNetworkProfileCheck

Write-Host "Creating Self-Signed Certificate..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate -DnsName $env:COMPUTERNAME -CertStoreLocation Cert:\\LocalMachine\\My

Write-Host "Configuring HTTPS Listener on Port ${portNum}..." -ForegroundColor Cyan
# Remove existing if any
Remove-Item -Path WSMan:\\Localhost\\Listener\\* -Recurse -Force -ErrorAction SilentlyContinue

# Create new listener
New-Item -Path WSMan:\\Localhost\\Listener -Address * -Transport HTTPS -HostName $env:COMPUTERNAME -CertificateThumbprint $cert.Thumbprint -Port ${portNum} -Force

Write-Host "Configuring Firewall..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "WinRM HTTPS" -Direction Inbound -LocalPort ${portNum} -Protocol TCP -Action Allow -Profile Any

Write-Host "Setup Complete! URL: https://$($env:COMPUTERNAME):${portNum}/wsman" -ForegroundColor Green
Write-Host "Certificate Thumbprint: $($cert.Thumbprint)"
Read-Host "Press Enter to exit"
`;
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

    // --- NIKTO SCANNER ---
    let niktoProcess = null;

    ipcMain.handle('nikto:check-perl', async () => {
        return new Promise(resolve => {
            const check = spawn('perl', ['-v']);
            check.on('error', () => resolve(false));
            check.on('close', (code) => resolve(code === 0));
        });
    });

    ipcMain.handle('nikto:install-perl', async (event) => {
        // Run winget in a visible terminal so user sees progress/prompts
        const cmd = `winget install StrawberryPerl.StrawberryPerl -e --accept-source-agreements --accept-package-agreements`;
        return new Promise(resolve => {
            const proc = spawn('start', ['cmd', '/k', cmd], { shell: true });
            proc.on('close', () => resolve(true)); // Resolved when launcher exits, not installer.
            // Better: launch detached and let user handle it.
            resolve({ started: true });
        });
    });

    ipcMain.on('nikto:start', (event, { url }) => {
        if (niktoProcess) return;

        const niktoPath = path.join(process.resourcesPath, 'nikto', 'program', 'nikto.pl');
        if (!fs.existsSync(niktoPath)) {
            event.reply('nikto:data', `Error: Nikto script not found at ${niktoPath}\n`);
            event.reply('nikto:exit', 1);
            return;
        }

        // Explicit config path + CWD set to program dir
        const configPath = path.join(process.resourcesPath, 'nikto', 'program', 'nikto.conf');
        const niktoDir = path.dirname(niktoPath);

        // Arguments: -h URL -C all -config CONFIG_PATH
        const args = [niktoPath, '-h', url, '-C', 'all', '-config', configPath];

        // spawn with cwd to help Nikto find plugins
        niktoProcess = spawn('perl', args, { cwd: niktoDir });

        niktoProcess.stdout.on('data', (data) => {
            event.reply('nikto:data', data.toString());
        });

        niktoProcess.stderr.on('data', (data) => {
            event.reply('nikto:data', data.toString());
        });

        niktoProcess.on('error', (err) => {
            event.reply('nikto:data', `Execution Error: ${err.message}\nIs Perl installed?`);
        });

        niktoProcess.on('close', (code) => {
            event.reply('nikto:exit', code);
            niktoProcess = null;
        });
    });

    ipcMain.on('nikto:stop', () => {
        if (niktoProcess) {
            niktoProcess.kill();
            niktoProcess = null;
        }
    });

    // --- STEGANOGRAPHY ---
    const STEG_MARKER = Buffer.from('JACHASTEG'); // 9 bytes

    ipcMain.handle('steg:hide', async (event, { coverPath, secretPath, password }) => {
        try {
            if (!fs.existsSync(coverPath) || !fs.existsSync(secretPath)) return { error: 'Files not found' };

            const coverBuffer = fs.readFileSync(coverPath);
            const secretBuffer = fs.readFileSync(secretPath);

            // 1. Encrypt Secret
            const salt = crypto.randomBytes(16);
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            const encryptedParams = Buffer.concat([cipher.update(secretBuffer), cipher.final()]);
            const authTag = cipher.getAuthTag();

            // 2. Construct Payload
            // Format: [Salt(16)][IV(12)][AuthTag(16)][EncryptedData][OriginalExt(10 bytes padded)][MARKER(9)][TotalPayloadSize(4 bytes)]
            // Original Extension needed for extraction
            const ext = path.extname(secretPath).replace('.', '');
            const extBuffer = Buffer.alloc(10); // max 10 chars ext
            extBuffer.write(ext);

            const payloadData = Buffer.concat([salt, iv, authTag, encryptedParams, extBuffer, STEG_MARKER]);

            // Append Size at the VERY END so we can find it
            const sizeBuffer = Buffer.alloc(4);
            sizeBuffer.writeUInt32BE(payloadData.length + 4); // Include size field itself

            const finalPayload = Buffer.concat([payloadData, sizeBuffer]);

            // 3. Append to Cover
            const outputBuffer = Buffer.concat([coverBuffer, finalPayload]);
            const outputDir = path.dirname(coverPath);
            const outputName = path.basename(coverPath, path.extname(coverPath)) + '_hidden' + path.extname(coverPath);
            const outputPath = path.join(outputDir, outputName);

            fs.writeFileSync(outputPath, outputBuffer);
            return { success: true, path: outputPath };
        } catch (e) {
            return { error: e.message };
        }
    });

    ipcMain.handle('steg:unhide', async (event, { stegPath, password }) => {
        try {
            if (!fs.existsSync(stegPath)) return { error: 'File not found' };

            const fileBuffer = fs.readFileSync(stegPath);
            const fileSize = fileBuffer.length;

            if (fileSize < 55) return { error: 'File too small (No hidden data)' }; // Min payload size

            // 1. Read Size (Last 4 bytes)
            const sizeBuffer = fileBuffer.subarray(fileSize - 4, fileSize);
            const payloadSize = sizeBuffer.readUInt32BE(0);

            if (payloadSize > fileSize || payloadSize < 50) return { error: 'Invalid payload size. File may not contain hidden data.' };

            // 2. Validate Marker
            // Payload ends with: ... [Ext][Marker][Size]
            // Marker is at: fileSize - 4 - 9
            const markerBuffer = fileBuffer.subarray(fileSize - 13, fileSize - 4);
            if (!markerBuffer.equals(STEG_MARKER)) return { error: 'No hidden data found (Marker mismatch).' };

            // 3. Extract Components
            // Start of payload: fileSize - payloadSize
            const payloadStart = fileSize - payloadSize;

            // Structure: Salt(16) | IV(12) | Tag(16) | Encrypted(...) | Ext(10) | Marker(9) | Size(4)
            let offset = payloadStart;

            const salt = fileBuffer.subarray(offset, offset + 16); offset += 16;
            const iv = fileBuffer.subarray(offset, offset + 12); offset += 12;
            const authTag = fileBuffer.subarray(offset, offset + 16); offset += 16;

            // Encrypted Data length = payloadSize - (16+12+16 + 10+9+4) = payloadSize - 67
            const encryptedLen = payloadSize - 67;
            const encryptedData = fileBuffer.subarray(offset, offset + encryptedLen); offset += encryptedLen;

            const extBuffer = fileBuffer.subarray(offset, offset + 10);
            const ext = extBuffer.toString().replace(/\0/g, ''); // Remove padding

            // 4. Decrypt
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

            // 5. Save
            const outputDir = path.dirname(stegPath);
            const outputName = path.basename(stegPath, path.extname(stegPath)) + '_extracted.' + ext;
            const outputPath = path.join(outputDir, outputName);

            fs.writeFileSync(outputPath, decrypted);
            return { success: true, path: outputPath };
        } catch (e) {
            return { error: 'Decryption Failed (Wrong Password?) or Corrupt Data.' };
        }
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
