import React from 'react';
import './Recon.css';

const Metasploit = () => {
    return (
        <div className="recon-container">
            <div className="recon-header">
                <h2>METASPLOIT FRAMEWORK</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="cyber-btn danger" onClick={() => window.electron.openMsf()}>
                        LAUNCH MSFCONSOLE
                    </button>
                </div>
            </div>

            <div className="recon-output">
                <div style={{ opacity: 0.7, textAlign: 'center', marginTop: '50px' }}>
                    <p>Access the full power of Metasploit via the CLI terminal.</p>
                    <p>Use `search [exploit]` to find modules.</p>
                    <p>Use `use [module_name]` to select them.</p>
                </div>
            </div>
        </div>
    );
};
export default Metasploit;
