
import React, { useState } from 'react';
import './Scanner.css';

const WinRmTools = () => {
    const [tab, setTab] = useState('client');
    const [status, setStatus] = useState('');

    // Client State
    const [host, setHost] = useState('');
    const [user, setUser] = useState(''); // Optional, will prompt if empty? No, usually required.
    const [port, setPort] = useState('5986');

    // Server State
    const [serverPort, setServerPort] = useState('5986');
    const [filename, setFilename] = useState('enable_winrm_windows.ps1');
    const [osType, setOsType] = useState('windows');

    const handleConnect = async () => {
        if (!host) {
            setStatus('Error: Host is required.');
            return;
        }
        setStatus('Launching PowerShell Session (New Window)...');
        const result = await window.electron.winrmConnect({ host, port, user });
        if (result.error) {
            setStatus(`Error: ${result.error}`);
        } else {
            setStatus('PowerShell Session Launched.');
        }
    };

    const handleGenerate = async () => {
        if (!filename) return;
        setStatus('Generating Script...');
        const result = await window.electron.winrmGetScript({ port: serverPort, osType });
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
                <h2>HTTPS CONNECTOR (WinRM)</h2>
                <div className="status-indicator">
                    {status && <span style={{ color: 'var(--neon-green)', fontSize: '0.8em' }}>{status}</span>}
                </div>
            </div>

            <div className="recon-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className={`tab-btn ${tab === 'client' ? 'active' : ''}`} onClick={() => setTab('client')}>CLIENT (CONNECT TO)</button>
                <button className={`tab-btn ${tab === 'server' ? 'active' : ''}`} onClick={() => setTab('server')}>SERVER (GENERATE CONFIG)</button>
            </div>

            {tab === 'client' && (
                <div className="scanner-controls" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                    <div className="control-group">
                        <label>HOST (IP/Domain)</label>
                        <input className="cyber-input" value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.10" />
                    </div>
                    <div className="control-group">
                        <label>USER (Optional)</label>
                        <input className="cyber-input" value={user} onChange={e => setUser(e.target.value)} placeholder="Administrator" />
                    </div>
                    <div className="control-group">
                        <label>PORT</label>
                        <input className="cyber-input" value={port} onChange={e => setPort(e.target.value)} placeholder="5986" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn start" onClick={handleConnect}>CONNECT SHELL</button>
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
                                    onChange={() => { setOsType('windows'); setFilename('enable_winrm_windows.ps1'); }}
                                    style={{ marginRight: '8px' }}
                                />
                                WINDOWS (PowerShell)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: osType === 'linux' ? 'var(--neon-blue)' : '#888' }}>
                                <input
                                    type="radio"
                                    name="osType"
                                    checked={osType === 'linux'}
                                    onChange={() => { setOsType('linux'); setFilename('enable_winrm_linux.sh'); }}
                                    style={{ marginRight: '8px' }}
                                />
                                LINUX (OMI)
                            </label>
                        </div>
                    </div>
                    <div className="control-group">
                        <label>OUTPUT FILENAME</label>
                        <input className="cyber-input" value={filename} onChange={e => setFilename(e.target.value)} placeholder={osType === 'windows' ? 'enable_winrm.ps1' : 'enable_winrm.sh'} />
                    </div>
                    <div className="control-group">
                        <label>LISTEN PORT</label>
                        <input className="cyber-input" value={serverPort} onChange={e => setServerPort(e.target.value)} placeholder="5986" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn" onClick={handleGenerate}>GENERATE SCRIPT</button>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', color: '#888', fontFamily: 'monospace' }}>
                        {osType === 'windows' ? (
                            <>
                                <p>[INFO] Generates a script to enable <b>WinRM over HTTPS</b> on Windows.</p>
                                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                                    <li>Creates Self-Signed Cert & HTTPS Listener.</li>
                                    <li>Configures Firewall.</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <p>[INFO] Generates a script to install <b>OMI (Open Management Infrastructure)</b> on Linux.</p>
                                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                                    <li>Installs OMI package (Debian/Ubuntu).</li>
                                    <li>Starts OMI Service.</li>
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="scanner-output" style={{ backgroundColor: '#050505', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#444' }}>
                    <pre>
                        {`
 _    _ _       _____  __  __ 
| |  | (_)     |  __ \\|  \\/  |
| |  | |_ _ __ | |__) | \\  / |
| |/\\| | | '_ \\|  _  /| |\\/| |
\\  /\\  / | | | | | \\ \\| |  | |
 \\/  \\/|_|_| |_|_|  \\_\\_|  |_|
 
 WINDOWS REMOTE MANAGEMENT (HTTPS)
`}
                    </pre>
                </div>
            </div>

        </div>
    );
};

export default WinRmTools;
