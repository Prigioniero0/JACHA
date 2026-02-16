
import React, { useState } from 'react';
import './Scanner.css';

const StegTool = () => {
    const [tab, setTab] = useState('hide');
    const [status, setStatus] = useState('');

    // Hide State
    const [coverPath, setCoverPath] = useState('');
    const [secretPath, setSecretPath] = useState('');
    const [hidePassword, setHidePassword] = useState('');

    // Unhide State
    const [stegPath, setStegPath] = useState('');
    const [unhidePassword, setUnhidePassword] = useState('');

    const browseFile = async (setter) => {
        const path = await window.electron.openFileDialog();
        if (path) setter(path);
    };

    const handleHide = async () => {
        if (!coverPath || !secretPath || !hidePassword) {
            setStatus('Error: All fields are required.');
            return;
        }
        setStatus('Encrypting and Embedding...');
        const result = await window.electron.stegHide({ coverPath, secretPath, password: hidePassword });
        if (result.success) {
            setStatus(`Success! Hidden file saved to: ${result.path}`);
        } else {
            setStatus(`Error: ${result.error}`);
        }
    };

    const handleUnhide = async () => {
        if (!stegPath || !unhidePassword) {
            setStatus('Error: All fields are required.');
            return;
        }
        setStatus('Decrypting and Extracting...');
        const result = await window.electron.stegUnhide({ stegPath, password: unhidePassword });
        if (result.success) {
            setStatus(`Success! Extracted file saved to: ${result.path}`);
        } else {
            setStatus(`Error: ${result.error}`);
        }
    };

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>STEGANOGRAPHY TOOL (AES-256)</h2>
                <div className="status-indicator">
                    {status && <span style={{ color: 'var(--neon-green)', fontSize: '0.8em' }}>{status}</span>}
                </div>
            </div>

            <div className="recon-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className={`tab-btn ${tab === 'hide' ? 'active' : ''}`} onClick={() => setTab('hide')}>HIDE (EMBED)</button>
                <button className={`tab-btn ${tab === 'unhide' ? 'active' : ''}`} onClick={() => setTab('unhide')}>UNHIDE (EXTRACT)</button>
            </div>

            {tab === 'hide' && (
                <div className="scanner-controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                        <label>COVER FILE (Image, Audio, etc.)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input className="cyber-input" value={coverPath} readOnly placeholder="Select Cover File..." />
                            <button className="cyber-btn" onClick={() => browseFile(setCoverPath)}>BROWSE</button>
                        </div>
                    </div>
                    <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                        <label>SECRET FILE (Any Type)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input className="cyber-input" value={secretPath} readOnly placeholder="Select Secret File..." />
                            <button className="cyber-btn" onClick={() => browseFile(setSecretPath)}>BROWSE</button>
                        </div>
                    </div>
                    <div className="control-group">
                        <label>ENCRYPTION PASSWORD</label>
                        <input className="cyber-input" type="password" value={hidePassword} onChange={e => setHidePassword(e.target.value)} placeholder="Strong Password" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn start" onClick={handleHide}>CONCEAL DATA</button>
                    </div>
                </div>
            )}

            {tab === 'unhide' && (
                <div className="scanner-controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                        <label>STEG FILE (Contains Hidden Data)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input className="cyber-input" value={stegPath} readOnly placeholder="Select Steg File..." />
                            <button className="cyber-btn" onClick={() => browseFile(setStegPath)}>BROWSE</button>
                        </div>
                    </div>
                    <div className="control-group">
                        <label>DECRYPTION PASSWORD</label>
                        <input className="cyber-input" type="password" value={unhidePassword} onChange={e => setUnhidePassword(e.target.value)} placeholder="Enter Password" />
                    </div>
                    <div className="actions">
                        <button className="cyber-btn" onClick={handleUnhide}>REVEAL DATA</button>
                    </div>
                </div>
            )}

            <div className="scanner-output" style={{ backgroundColor: '#050505', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#444' }}>
                    <pre>
                        {`
  _____ _______ ______ _____ 
 / ____|__   __|  ____/ ____|
| (___    | |  | |__ | |  __ 
 \\___ \\   | |  |  __|| | |_ |
 ____) |  | |  | |____| |__| |
|_____/   |_|  |______|\\_____|
 
     SECURE DATA HIDING
`}
                    </pre>
                </div>
            </div>

        </div>
    );
};

export default StegTool;
