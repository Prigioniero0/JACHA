import React from 'react';
import './Scanner.css'; // Reusing scanner styles for consistency

const John = () => {
    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>JOHN THE RIPPER</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="status-indicator">
                        <span className="status-dot idle"></span>
                        READY
                    </div>
                </div>
            </div>

            <div className="scanner-controls" style={{ height: 'auto', padding: '40px', textAlign: 'center' }}>
                <p style={{ marginBottom: '20px', fontSize: '1.2em' }}>
                    Launch the advanced password cracking tool <strong>John the Ripper</strong>.
                </p>
                <p style={{ marginBottom: '30px', opacity: 0.7 }}>
                    This will open a dedicated terminal window where you can run 'john' commands directly.
                    <br />
                    Compatible with hash files extracted from Hashcat or other tools.
                </p>

                <button
                    className="cyber-btn large"
                    onClick={(e) => { e.currentTarget.blur(); window.electron.openCli('john'); }}
                    style={{ padding: '20px 40px', fontSize: '1.5em' }}
                >
                    LAUNCH TERMINAL
                </button>
            </div>

            <div className="scanner-output">
                <pre style={{ opacity: 0.5, textAlign: 'center', marginTop: '50px' }}>
                    [SYSTEM_READY]: JtR Module Initialized.
                </pre>
            </div>
        </div>
    );
};

export default John;
