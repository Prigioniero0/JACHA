import React, { useState } from 'react';
import './Encryption.css';

const Encryption = () => {
    const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
    const [filePath, setFilePath] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSelectFile = async () => {
        const path = await window.electron.openFileDialog();
        if (path) {
            setFilePath(path);
            setStatus('');
        }
    };

    const handleProcess = async () => {
        if (!filePath || !password) {
            setStatus('Please select a file and enter a password.');
            return;
        }

        setLoading(true);
        setStatus('Processing...');

        try {
            let result;
            if (mode === 'encrypt') {
                result = await window.electron.encryptFile(filePath, password);
            } else {
                result = await window.electron.decryptFile(filePath, password);
            }

            if (result.success) {
                setStatus(`SUCCESS: File saved to ${result.path}`);
            } else {
                setStatus(`ERROR: ${result.error}`);
            }
        } catch (e) {
            setStatus(`ERROR: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="encryption-container">
            <div className="encryption-header">
                <h2>SECURE FILE LOCKER</h2>
                <div className="mode-toggle">
                    <button
                        className={`cyber-btn ${mode === 'encrypt' ? 'active' : ''}`}
                        onClick={() => { setMode('encrypt'); setStatus(''); }}
                    >
                        ENCRYPT
                    </button>
                    <button
                        className={`cyber-btn ${mode === 'decrypt' ? 'active' : ''}`}
                        onClick={() => { setMode('decrypt'); setStatus(''); }}
                    >
                        DECRYPT
                    </button>
                </div>
            </div>

            <div className="crypto-box">
                <div className="control-group">
                    <label>Selected File</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input className="cyber-input" value={filePath} readOnly placeholder="No file selected" />
                        <button className="cyber-btn" onClick={handleSelectFile}>BROWSE</button>
                    </div>
                </div>

                <div className="control-group">
                    <label>Master Password</label>
                    <input
                        type="password"
                        className="cyber-input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter strong password"
                    />
                </div>

                <div className="status-display">
                    {status}
                </div>

                <button
                    className={`cyber-btn large ${mode === 'decrypt' ? 'danger' : ''}`}
                    onClick={handleProcess}
                    disabled={loading}
                >
                    {loading ? 'PROCESSING...' : (mode === 'encrypt' ? 'LOCK FILE' : 'UNLOCK FILE')}
                </button>
            </div>

            <div className="info-box">
                <p>
                    <strong>AES-256-GCM Encryption:</strong> Files are secured using military-grade encryption.
                    The security depends entirely on your password. <span style={{ color: '#ff4444' }}>Do not forget it; recovery is impossible.</span>
                </p>
            </div>
        </div>
    );
};

export default Encryption;
