const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Recon
    reconWhois: (domain) => ipcRenderer.invoke('recon:whois', domain),
    reconDns: (domain) => ipcRenderer.invoke('recon:dns', domain),
    reconReverse: (ip) => ipcRenderer.invoke('recon:reverse', ip),

    // Nmap - streaming
    // Nmap - streaming
    startNmap: (target, flags) => ipcRenderer.send('nmap:start', { target, flags }),
    runNmapCli: (command) => ipcRenderer.send('nmap:run_cli', command),
    stopNmap: () => ipcRenderer.send('nmap:stop'),
    onNmapData: (callback) => ipcRenderer.on('nmap:data', (e, d) => callback(d)),
    onNmapExit: (callback) => ipcRenderer.on('nmap:exit', (e, c) => callback(c)),
    removeAllNmapListeners: () => {
        ipcRenderer.removeAllListeners('nmap:data');
        ipcRenderer.removeAllListeners('nmap:exit');
    },

    // SQLMap / Spider Removals (Placeholders if needed to avoid crash, but safe to remove if unused)
    // ...

    // Discovery
    scanDiscovery: (ips) => ipcRenderer.invoke('discovery:scan', ips),

    // App Control
    quitApp: () => ipcRenderer.send('app:quit'),
    getAppVersion: () => ipcRenderer.invoke('app:version'),
    checkUpdates: () => ipcRenderer.send('app:check-updates'),
    openCli: (tool) => ipcRenderer.send('cli:open', { tool }),

    // Subdomains
    scanCrt: (domain) => ipcRenderer.invoke('subdomain:crt', domain),
    scanSublist3r: (domain) => ipcRenderer.invoke('subdomain:sublist3r', domain),
    scanKnock: (domain, args) => ipcRenderer.invoke('subdomain:knock', { domain, args }),
    scanBrute: (domain) => ipcRenderer.invoke('subdomain:brute', domain),

    // Tools - Hashcat/Msf Removed


    // Server
    startServer: (port, directory) => ipcRenderer.invoke('server:start', { port, directory }),
    stopServer: () => ipcRenderer.invoke('server:stop'),
    getSystemIp: () => ipcRenderer.invoke('system:ip'),

    // Window Controls
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    maximizeWindow: () => ipcRenderer.send('window:maximize'),
    closeWindow: () => ipcRenderer.send('window:close'),

    // Crypto
    encryptFile: (filePath, password) => ipcRenderer.invoke('crypto:encrypt', { filePath, password }),
    decryptFile: (filePath, password) => ipcRenderer.invoke('crypto:decrypt', { filePath, password }),
    openFileDialog: () => ipcRenderer.invoke('dialog:open-file'),

    // App
    saveFile: (content, filename) => ipcRenderer.invoke('app:save-file', { content, filename })
});
