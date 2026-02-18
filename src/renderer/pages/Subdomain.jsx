import React, { useState } from 'react';
import './Recon.css'; // Reusing Recon styles for consistency

const Subdomain = () => {
    const [tool, setTool] = useState('crt');
    const [domain, setDomain] = useState('dmatorino.it');
    const [extraArgs, setExtraArgs] = useState('');
    const [results, setResults] = useState([]);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        if (!domain) return;
        setLoading(true);
        setResults([]);
        setLogs(`Starting ${tool.toUpperCase()} enumeration on ${domain}...\n`);

        try {
            if (tool === 'crt') {
                const data = await window.electron.scanCrt(domain);
                if (Array.isArray(data)) {
                    setResults(data);
                    setLogs(prev => prev + `Found ${data.length} subdomains via certificate transparency logs.\n`);
                } else {
                    setLogs(prev => prev + data + '\n');
                }
            } else if (tool === 'sublist3r') {
                const output = await window.electron.scanSublist3r(domain);
                setLogs(prev => prev + output);
            } else if (tool === 'knock') {
                // Parse args string to array
                const argsArray = extraArgs.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(a => a.replace(/^"|"$/g, '')) || [];
                const output = await window.electron.scanKnock(domain, argsArray);
                setLogs(prev => prev + output);
            } else if (tool === 'brute') {
                const output = await window.electron.scanBrute(domain);
                setLogs(prev => prev + output);
            }
        } catch (e) {
            setLogs(prev => prev + `Error: ${e}\n`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recon-container">
            <div className="recon-header">
                <h2>SUBDOMAIN ENUMERATION</h2>
                <div className="recon-tabs">
                    <button className={`tab-btn ${tool === 'crt' ? 'active' : ''}`} onClick={() => setTool('crt')}>CRT.SH</button>
                    <button className={`tab-btn ${tool === 'sublist3r' ? 'active' : ''}`} onClick={() => setTool('sublist3r')}>SUBLIST3R</button>
                    <button className={`tab-btn ${tool === 'knock' ? 'active' : ''}`} onClick={() => setTool('knock')}>KNOCKPY</button>
                    <button className={`tab-btn ${tool === 'brute' ? 'active' : ''}`} onClick={() => setTool('brute')}>BRUTEFORCE</button>
                </div>
            </div>

            <div className="recon-controls">
                <input
                    className="cyber-input"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter Domain (e.g. google.com)"
                />

                {tool === 'knock' && (
                    <input
                        className="cyber-input"
                        value={extraArgs}
                        onChange={(e) => setExtraArgs(e.target.value)}
                        placeholder="Optional Args (e.g. --dns 8.8.8.8)"
                        style={{ marginLeft: '10px', width: '200px' }}
                    />
                )}

                <button className="cyber-btn" onClick={handleRun} disabled={loading}>
                    {loading ? 'SCANNING...' : 'START SCAN'}
                </button>
            </div>

            <div className="recon-output" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tool === 'crt' && results.length > 0 && (
                    <div className="grid-view" style={{ maxHeight: '200px', overflowY: 'auto', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                        {results.map(r => <div key={r} style={{ color: 'var(--neon-green)' }}>{r}</div>)}
                    </div>
                )}
                <pre style={{ flex: 1 }}>{logs}</pre>
                {loading && <div className="scanline"></div>}
            </div>
        </div>
    );
};

export default Subdomain;
