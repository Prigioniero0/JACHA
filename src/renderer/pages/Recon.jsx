import React, { useState } from 'react';
import './Recon.css';
import { useToolState } from '../context/ToolStateContext';

const Recon = () => {
    const { reconState } = useToolState();
    const { output, setOutput, tab: activeTab, setTab: setActiveTab, target, setTarget } = reconState;
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        if (!target) return;
        setLoading(true);
        setOutput('Initiating scan...');

        try {
            let result = '';
            if (activeTab === 'whois') {
                result = await window.electron.reconWhois(target);
            } else if (activeTab === 'dns') {
                result = await window.electron.reconDns(target);
            } else if (activeTab === 'reverse') {
                result = await window.electron.reconReverse(target);
            }
            setOutput(result);
        } catch (err) {
            setOutput(`ERROR: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!output) return;
        await window.electron.saveFile(output, `recon_${activeTab}.txt`);
    };

    return (
        <div className="recon-container">
            <div className="recon-header">
                <h2>NETWORK RECONNAISSANCE</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="recon-tabs">
                        {['whois', 'dns', 'reverse'].map(tab => (
                            <button
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => { setActiveTab(tab); setOutput(''); }}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button className="cyber-btn small" onClick={handleExport} style={{ fontSize: '0.8em', padding: '5px 10px' }}>
                        EXTRACT SCAN
                    </button>
                </div>
            </div>

            <div className="recon-controls">
                <input
                    type="text"
                    className="cyber-input"
                    placeholder={activeTab === 'reverse' ? "Enter IP Address" : "Enter Domain"}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                />
                <button className="cyber-btn" onClick={handleRun} disabled={loading}>
                    {loading ? 'SCANNING...' : 'EXECUTE'}
                </button>
            </div>

            <div className="recon-output">
                <pre>{output}</pre>
                {loading && <div className="scanline"></div>}
            </div>
        </div>
    );
};

export default Recon;
