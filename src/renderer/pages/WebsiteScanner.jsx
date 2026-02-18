
import React, { useState, useEffect, useRef } from 'react';
import './Scanner.css'; // Reuse scanner styles

const WebsiteScanner = () => {
    const [tab, setTab] = useState('basic');
    const [url, setUrl] = useState('');

    // Basic Scan State
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Nikto State
    const [niktoLogs, setNiktoLogs] = useState([]);
    const [niktoLoading, setNiktoLoading] = useState(false);
    const [perlMissing, setPerlMissing] = useState(false);

    const outputRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [logs, niktoLogs, tab]);

    useEffect(() => {
        // --- BASIC SCAN LISTENERS ---
        const onWebData = (data) => {
            setLogs(prev => [...prev, data]);
            // Mock progress
            setProgress(prev => Math.min(prev + 2, 95));
        };

        const onWebExit = (code) => {
            setLoading(false);
            setProgress(100);
            setLogs(prev => [...prev, `\n[+] Scan Completed (Code: ${code})`]);
        };

        // --- NIKTO LISTENERS ---
        const onNiktoData = (data) => {
            setNiktoLogs(prev => [...prev, data]);
        };

        const onNiktoExit = (code) => {
            setNiktoLoading(false);
            setNiktoLogs(prev => [...prev, `\n[+] Nikto Scan Completed (Code: ${code})`]);
        };

        // Register
        const removeWebData = window.electron.onWebData(onWebData);
        const removeWebExit = window.electron.onWebExit(onWebExit);
        const removeNiktoData = window.electron.onNiktoData(onNiktoData);
        const removeNiktoExit = window.electron.onNiktoExit(onNiktoExit);

        return () => {
            // cleanup
        };
    }, []);

    const handleScan = () => {
        if (!url) return;
        setLogs([]);
        setLoading(true);
        setProgress(0);
        window.electron.scanWebsite(url);
    };

    const handleNiktoScan = async () => {
        if (!url) return;

        setNiktoLogs(['[*] Checking dependencies...']);

        // Basic URL validation/cleaning
        let target = url;
        if (!target.startsWith('http')) {
            // Nikto handles raw domains, but let's encourage http/https or pass as is
        }

        const hasPerl = await window.electron.niktoCheckPerl();

        if (!hasPerl) {
            setNiktoLogs(prev => [...prev, '[!] Error: PERL interpreter not found.', '[!] Nikto requires Perl to run.', '[!] Please install Perl (Strawberry Perl recommended).']);
            setPerlMissing(true);
            return;
        }

        setPerlMissing(false);
        setNiktoLoading(true);
        setNiktoLogs([]);
        window.electron.niktoStart({ url });
    };

    const installPerl = async () => {
        setNiktoLogs(prev => [...prev, '[*] Launching Perl Installer (Winget)...', '[*] Please follow prompts in the new window.']);
        await window.electron.niktoInstallPerl();
    };

    const handleExport = async (content) => {
        if (!content) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `scan_report_${timestamp}.txt`;
        const saved = await window.electron.saveFile(content, filename);
        if (saved) alert('Report Saved!');
    };

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>ADVANCED WEB & VULNERABILITY SCANNER</h2>
                <div className="status-indicator">
                    {(loading || niktoLoading) ? <span className="blink">SCANNING TARGET...</span> : 'READY'}
                </div>
            </div>

            <div className="recon-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className={`tab-btn ${tab === 'basic' ? 'active' : ''}`} onClick={() => setTab('basic')}>BASIC SCAN (OSINT)</button>
                <button className={`tab-btn ${tab === 'nikto' ? 'active' : ''}`} onClick={() => setTab('nikto')}>NIKTO SCAN (VULN)</button>
            </div>

            <div className="scanner-controls">
                <div className="control-group">
                    <label>TARGET URL</label>
                    <input
                        type="text"
                        className="cyber-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                    />
                </div>
                {tab === 'basic' ? (
                    <div className="actions">
                        <button className={`cyber-btn ${loading ? 'scanning' : 'start'}`} onClick={handleScan} disabled={loading}>
                            {loading ? 'ABORT SCAN' : 'INITIATE SCAN'}
                        </button>
                        <button className="cyber-btn" onClick={() => handleExport(logs.join(''))}>EXPORT REPORT</button>
                    </div>
                ) : (
                    <div className="actions">
                        {perlMissing ? (
                            <button className="cyber-btn" style={{ borderColor: 'red', color: 'red' }} onClick={installPerl}>
                                INSTALL PERL (REQ)
                            </button>
                        ) : (
                            <button className={`cyber-btn ${niktoLoading ? 'scanning' : 'start'}`} onClick={handleNiktoScan} disabled={niktoLoading}>
                                {niktoLoading ? 'ABORT SCAN' : 'START NIKTO'}
                            </button>
                        )}
                        <button className="cyber-btn" onClick={() => handleExport(niktoLogs.join(''))}>EXPORT REPORT</button>
                    </div>
                )}
            </div>

            {/* PROGRESS BAR (Basic Only) */}
            {tab === 'basic' && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* OUTPUT AREA */}
            <div className="scanner-output" style={{ position: 'relative' }} ref={outputRef}>
                {(loading || niktoLoading) && <div className="scan-overlay"></div>}
                <pre>
                    {tab === 'basic' ? logs.join('') : niktoLogs.join('')}
                </pre>
            </div>

            {tab === 'nikto' && (
                <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#666' }}>
                    [INFO] Nikto is an Open Source (GPL) web server scanner. Requires Perl.
                    bundled version: 2.1.6
                </div>
            )}
        </div>
    );
};

export default WebsiteScanner;
