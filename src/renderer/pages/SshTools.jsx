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
    const [filename, setFilename] = useState('setup_ssh_windows.ps1');
    const [serverPort, setServerPort] = useState('22');
    const [osType, setOsType] = useState('windows');

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
        // Pass port and osType
        const result = await window.electron.sshGetScript({ port: serverPort, osType });

        if (result.content) {
            const saved = await window.electron.saveFile(result.content, filename);
            if (saved) setStatus(`Script saved to ${filename}. Run as Admin/Root.`);
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
                    <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                        <label>TARGET OS</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: osType === 'windows' ? 'var(--neon-blue)' : '#888' }}>
                                <input
                                    type="radio"
                                    name="osType"
                                    checked={osType === 'windows'}
                                    onChange={() => { setOsType('windows'); setFilename('setup_ssh_windows.ps1'); }}
                                    style={{ marginRight: '8px' }}
                                />
                                WINDOWS (PowerShell)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: osType === 'linux' ? 'var(--neon-blue)' : '#888' }}>
                                <input
                                    type="radio"
                                    name="osType"
                                    checked={osType === 'linux'}
                                    onChange={() => { setOsType('linux'); setFilename('setup_ssh_linux.sh'); }}
                                    style={{ marginRight: '8px' }}
                                />
                                LINUX (Bash)
                            </label>
                        </div>
                    </div>
                    <div className="control-group">
                        <label>OUTPUT FILENAME</label>
                        <input className="cyber-input" value={filename} onChange={e => setFilename(e.target.value)} placeholder={osType === 'windows' ? 'setup_ssh.ps1' : 'setup_ssh.sh'} />
                    </div>
                    <div className="control-group">
                        <label>LISTEN PORT</label>
                        <input className="cyber-input" value={serverPort} onChange={e => setServerPort(e.target.value)} placeholder="22" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn" onClick={() => handleGenerate().catch(console.error)}>GENERATE SCRIPT</button>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', color: '#888', fontFamily: 'monospace' }}>
                        <p>[INFO] Generates a script to install and configure SSH Server.</p>
                        {osType === 'windows' ? (
                            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                                <li>Installs OpenSSH Server Feature (Windows).</li>
                                <li>Configures Firewall & Service.</li>
                            </ul>
                        ) : (
                            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                                <li>Installs openssh-server (Linux/apt).</li>
                                <li>Configures sshd_config & UFW.</li>
                            </ul>
                        )}
                        <p style={{ color: 'var(--neon-red)' }}>[WARN] Run the generated script as Administrator / Root.</p>
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
