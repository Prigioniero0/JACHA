
import React, { useState, useRef, useEffect } from 'react';
import { useToolState } from '../context/ToolStateContext';
import './Scanner.css'; // Reuse Scanner styles for consistency

const WebsiteScanner = () => {
    const { webState } = useToolState();
    const { output, setOutput, url, setUrl } = webState;
    const [isScanning, setIsScanning] = useState(false);
    const outputRef = useRef(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const handleScan = async () => {
        if (!url) return;

        // Basic URL validation
        let target = url;
        if (!target.startsWith('http')) {
            target = 'http://' + target;
        }

        setIsScanning(true);
        setOutput(`[*] Starting Website Scan: ${target}...\n`);

        window.electron.removeWebListeners();

        window.electron.onWebData((data) => {
            setOutput(prev => prev + data);
        });

        window.electron.onWebExit((code) => {
            setIsScanning(false);
            setOutput(prev => prev + `\n[+] Scan finished (Exit Code: ${code})`);
        });

        await window.electron.scanWebsite(target);
    };

    const handleExport = async () => {
        if (!output) return;
        const success = await window.electron.saveFile(output, 'website_scan_results.txt');
        if (success) alert('Output Saved Successfully');
    };

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>WEBSITE SCANNER</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="cyber-btn small" onClick={handleExport} style={{ fontSize: '0.8em', padding: '5px 10px', border: '1px solid var(--neon-cyan)' }}>
                        EXTRACT SCAN
                    </button>
                    <div className="status-indicator">
                        <span className={`status-dot ${isScanning ? 'busy' : 'idle'}`}></span>
                        {isScanning ? 'SCANNING' : 'IDLE'}
                    </div>
                </div>
            </div>

            <div className="scanner-controls">
                <div className="control-group">
                    <label>Target URL</label>
                    <input
                        className="cyber-input"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="example.com"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isScanning) handleScan();
                        }}
                    />
                </div>
                <div className="actions">
                    <button
                        className={`cyber-btn ${isScanning ? 'stop' : 'start'}`}
                        onClick={handleScan}
                        disabled={isScanning}
                    >
                        {isScanning ? 'SCANNING...' : 'SCAN'}
                    </button>
                </div>
            </div>

            <div className="scanner-output" ref={outputRef}>
                <pre>{output}</pre>
                {isScanning && <div className="scan-overlay"></div>}
            </div>

            <div style={{ color: '#666', fontSize: '10px', marginTop: '5px', textAlign: 'right' }}>
                Powered by Python Web Scanner Module
            </div>
        </div>
    );
};

export default WebsiteScanner;
