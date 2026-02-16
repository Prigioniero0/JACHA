import React, { useState } from 'react';
import './Discovery.css';

// Reuse range generator locally or move to shared util
const generateRange = (start, end) => {
    const s = start.split('.').map(Number);
    const e = end.split('.').map(Number);
    const ips = [];
    if (s[0] === e[0] && s[1] === e[1] && s[2] === e[2]) {
        for (let i = s[3]; i <= e[3]; i++) ips.push(`${s[0]}.${s[1]}.${s[2]}.${i}`);
    } else { ips.push(start); }
    return ips;
};

const Discovery = () => {
    const [startIp, setStartIp] = useState('192.168.1.1');
    const [endIp, setEndIp] = useState('192.168.1.50');
    const [results, setResults] = useState({});
    const [scanning, setScanning] = useState(false);

    const handleScan = async () => {
        setScanning(true);
        setResults({});

        const ips = generateRange(startIp, endIp);

        // Send all to main process
        try {
            const scanResults = await window.electron.scanDiscovery(ips);
            const map = {};
            scanResults.forEach(r => map[r.ip] = r.isAlive);
            setResults(map);
        } catch (e) {
            console.error(e);
        } finally {
            setScanning(false);
        }
    };

    const handleExport = async () => {
        if (Object.keys(results).length === 0) return;
        const content = JSON.stringify(results, null, 2);
        await window.electron.saveFile(content, 'network_discovery.json');
    };

    return (
        <div className="discovery-container">
            <div className="discovery-header">
                <h2>NETWORK DISCOVERY</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="cyber-btn small" onClick={handleExport} style={{ fontSize: '0.8em', padding: '5px 10px', marginRight: '15px' }}>
                        EXTRACT SCAN
                    </button>
                    <div className="discovery-stats">
                        <span>ALIVE: {Object.values(results).filter(x => x).length}</span>
                    </div>
                </div>
            </div>

            <div className="discovery-controls">
                <input className="cyber-input" value={startIp} onChange={e => setStartIp(e.target.value)} />
                <span>TO</span>
                <input className="cyber-input" value={endIp} onChange={e => setEndIp(e.target.value)} />
                <button className="cyber-btn" onClick={handleScan} disabled={scanning}>{scanning ? 'SCANNING' : 'SWEEP'}</button>
            </div>

            <div className="grid-view">
                {generateRange(startIp, endIp).map(ip => (
                    <div key={ip} className={`ip-node ${results[ip] ? 'alive' : 'dead'}`}>
                        <div className="node-ip">{ip.split('.').pop()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Discovery;
