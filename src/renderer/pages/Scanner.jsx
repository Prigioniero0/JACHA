import React, { useState, useRef, useEffect } from 'react';
import './Scanner.css';
import { useToolState } from '../context/ToolStateContext';

const scanProfiles = {
    'Quick Scan': ['-F', '-T4'],
    'Intense Scan': ['-T4', '-A', '-v'],
    'Ping Scan': ['-sn'],
    'OS Detection': ['-O'],
    'Service Version': ['-sV'],
};

const Scanner = () => {
    const { nmapState } = useToolState();
    const { output, setOutput, target, setTarget, profile: selectedProfile, setProfile: setSelectedProfile, flags: customFlags, setFlags: setCustomFlags } = nmapState;
    const [isScanning, setIsScanning] = useState(false);

    const outputRef = useRef(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const handleScan = () => {
        if (!nmapState.cliMode) {
            // GUI Mode Validation
            if (!target) return;
            const ipDomainRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+$/;
            if (!ipDomainRegex.test(target)) {
                setOutput(prev => prev + '\n[!] Invalid Target Format. Please enter a valid IP or Domain.');
                return;
            }
        } else {
            // CLI Mode Validation
            if (!nmapState.cliCommand) return;
        }

        setIsScanning(true);
        if (!nmapState.cliMode) {
            setOutput(`Starting ${selectedProfile} against ${target}...\n`);
        } else {
            setOutput(`> ${nmapState.cliCommand}\n`);
        }

        window.electron.removeAllNmapListeners();

        window.electron.onNmapData((data) => {
            setOutput(prev => prev + data);
        });

        window.electron.onNmapExit((code) => {
            setIsScanning(false);
            setOutput(prev => prev + `\n[+] Scan finished (Exit Code: ${code})`);
        });

        if (!nmapState.cliMode) {
            const flags = [...scanProfiles[selectedProfile]];
            if (customFlags) flags.push(...customFlags.split(' '));
            window.electron.startNmap(target, flags);
        } else {
            window.electron.runNmapCli(nmapState.cliCommand);
        }
    };

    const handleStop = () => {
        window.electron.stopNmap();
        setOutput(prev => prev + '\n[!] User aborted.');
        setIsScanning(false);
    };

    const handleExport = async () => {
        if (!output) return;
        const success = await window.electron.saveFile(output, 'nmap_scan_results.txt');
        if (success) alert('Main Output Saved Successfully');
    };

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>NMAP PORT SCANNER</h2>
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

                {/* Mode Toggle */}
                <div style={{ marginBottom: '15px' }}>
                    <button className={`cyber-btn small ${!nmapState.cliMode ? 'active' : ''}`} onClick={() => nmapState.setCliMode && nmapState.setCliMode(false)} style={{ marginRight: '10px' }}>GUI MODE</button>
                    <button className={`cyber-btn small ${nmapState.cliMode ? 'active' : ''}`} onClick={() => nmapState.setCliMode && nmapState.setCliMode(true)}>CLI MODE</button>
                </div>

                {!nmapState.cliMode ? (
                    <>
                        <div className="control-group">
                            <label>Target</label>
                            <input className="cyber-input" value={target} onChange={e => setTarget(e.target.value)} placeholder="IP / Host" />
                        </div>
                        <div className="control-group">
                            <label>Profile</label>
                            <select className="cyber-select" value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}>
                                {Object.keys(scanProfiles).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </>
                ) : (
                    <div className="control-group">
                        <label>Custom Command</label>
                        <input
                            className="cyber-input"
                            value={nmapState.cliCommand || ''}
                            onChange={e => nmapState.setCliCommand && nmapState.setCliCommand(e.target.value)}
                            placeholder="e.g. nmap -sS -A 127.0.0.1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isScanning) handleScan();
                            }}
                        />
                        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                            Type nmap commands directly. integrated CLI.
                        </div>
                    </div>
                )}

                <div className="actions">
                    {!isScanning ? (
                        <button className="cyber-btn start" onClick={handleScan}>
                            {nmapState.cliMode ? 'EXECUTE' : 'START'}
                        </button>
                    ) : (
                        <button className="cyber-btn stop" onClick={handleStop}>STOP</button>
                    )}
                </div>
            </div>

            <div className="scanner-output" ref={outputRef}>
                <pre>{output}</pre>
            </div>
        </div>
    );
};

export default Scanner;
