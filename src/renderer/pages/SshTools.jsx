
import React, { useState } from 'react';
import './Scanner.css'; // Reuse Scanner styles

const SshTools = () => {
    const [tab, setTab] = useState('client');

    // Client State
    const [host, setHost] = useState('');
    const [user, setUser] = useState('');
    const [port, setPort] = useState('22');
    const [status, setStatus] = useState('');

    // Server State
    const [filename, setFilename] = useState('setup_ssh.ps1');
    const [serverPort, setServerPort] = useState('22');

    const handleConnect = async () => {
        if (!host || !user) {
            setStatus('Error: Host and User are required.');
            return;
        }
        setStatus('Launching SSH Terminal...');
        const result = await window.electron.sshConnect({ user, host, port });
        if (result.error) {
            setStatus(`Error: ${result.error}`);
        } else {
            setStatus('SSH Session Launched in external window.');
        }
    };

    const handleGenerate = async () => {
        if (!filename) return;
        setStatus('Generating Script...');
        // Pass port
        const result = await window.electron.sshGetScript({ port: port }); // Reuse port state or add new one?
        // Wait, "port" state is used for Client.
        // I should add a separate state for Server Port? 
        // Or reuse "port" state (default 22).
        // Let's use separate state "serverPort" to avoid confusion if user changes client port.

        if (result.content) {
            const saved = await window.electron.saveFile(result.content, filename);
            if (saved) setStatus(`Script saved to ${filename}. Run as Admin to enable SSH Server.`);
            else setStatus('Save cancelled.');
        } else {
            setStatus(`Error: ${result.error}`);
        }
    };

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>SSH CONNECTOR & TOOLS</h2>
                <div className="status-indicator">
                    {status && <span style={{ color: 'var(--neon-green)', fontSize: '0.8em' }}>{status}</span>}
                </div>
            </div>

            <div className="recon-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className={`tab-btn ${tab === 'client' ? 'active' : ''}`} onClick={() => setTab('client')}>SSH CLIENT</button>
                <button className={`tab-btn ${tab === 'server' ? 'active' : ''}`} onClick={() => setTab('server')}>GENERATE SERVER CONFIG</button>
            </div>

            {tab === 'client' && (
                <div className="scanner-controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                    <div className="control-group">
                        <label>USER</label>
                        <input className="cyber-input" value={user} onChange={e => setUser(e.target.value)} placeholder="root" />
                    </div>
                    <div className="control-group">
                        <label>HOST (IP/Domain)</label>
                        <input className="cyber-input" value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.100" />
                    </div>
                    <div className="control-group">
                        <label>PORT</label>
                        <input className="cyber-input" value={port} onChange={e => setPort(e.target.value)} placeholder="22" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn start" onClick={handleConnect}>CONNECT</button>
                    </div>
                </div>
            )}

            {tab === 'server' && (
                <div className="scanner-controls" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                    <div className="control-group">
                        <label>OUTPUT FILENAME</label>
                        <input className="cyber-input" value={filename} onChange={e => setFilename(e.target.value)} placeholder="setup_ssh.ps1" />
                    </div>
                    <div className="control-group">
                        <label>LISTEN PORT</label>
                        <input className="cyber-input" value={serverPort} onChange={e => setServerPort(e.target.value)} placeholder="22" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn" onClick={() => handleGenerate().catch(console.error)}>GENERATE SCRIPT</button>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', color: '#888', fontFamily: 'monospace' }}>
                        <p>[INFO] This will generate a PowerShell script to:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                            <li>Install Windows OpenSSH Server Feature.</li>
                            <li>Start the SSHD service.</li>
                            <li>Configure Windows Firewall to allow port 22.</li>
                        </ul>
                        <p style={{ color: 'var(--neon-red)' }}>[WARN] usage: You must run the generated script as Administrator.</p>
                    </div>
                </div>
            )}

            <div className="scanner-output" style={{ backgroundColor: '#050505', height: '200px' }}>
                <pre style={{ color: '#444' }}>
                    {`
   _____ _____ _    _ 
  / ____/ ____| |  | |
 | (___| (___ | |__| |
  \\___ \\\\___ \\|  __  |
  ____) |___) | |  | |
 |_____/_____/|_|  |_|
 
 SECURE SHELL INTERFACE
                    `}
                </pre>
            </div>

        </div>
    );
};

export default SshTools;
