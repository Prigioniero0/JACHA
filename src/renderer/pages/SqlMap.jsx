import React, { useState, useRef, useEffect } from 'react';
import './SqlMap.css';
import { useToolState } from '../context/ToolStateContext';

const SqlMap = () => {
    const { sqlState } = useToolState();
    const { output, setOutput, url, setUrl, options, setOptions } = sqlState;
    const [isRunning, setIsRunning] = useState(false);

    const outputRef = useRef(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const handleStart = () => {
        if (!url) return;

        setIsRunning(true);
        setOutput(`Starting SQLMap...\n`);

        window.electron.removeAllSqlListeners();

        window.electron.onSqlData((data) => setOutput(prev => prev + data));
        window.electron.onSqlExit((code) => {
            setIsRunning(false);
            setOutput(prev => prev + `\n[+] Finished (Code: ${code})`);
        });

        const flags = options.split(' ').filter(x => x);
        window.electron.startSql(url, flags);
    };

    const handleStop = () => {
        window.electron.stopSql();
        setOutput(prev => prev + '\n[!] User aborted.');
        setIsRunning(false);
    };

    return (
        <div className="sqlmap-container">
            <div className="sqlmap-header">
                <h2>SQL INJECTION</h2>
                <button className="cyber-btn small" onClick={(e) => { e.currentTarget.blur(); window.electron.openCli('sqlmap'); }} style={{ fontSize: '0.8em', padding: '5px 10px', marginLeft: 'auto' }}>
                    TERMINAL
                </button>
            </div>

            <div className="sqlmap-controls">
                <label>Target URL</label>
                <input className="cyber-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="http://example.com?id=1" />

                <label>Options</label>
                <input className="cyber-input" value={options} onChange={e => setOptions(e.target.value)} />

                <div className="actions">
                    {!isRunning ? (
                        <button className="cyber-btn" onClick={handleStart}>LAUNCH</button>
                    ) : (
                        <button className="cyber-btn danger" onClick={handleStop}>ABORT</button>
                    )}
                </div>
            </div>

            <div className="sqlmap-output" ref={outputRef}>
                <pre>{output}</pre>
            </div>
        </div>
    );
};

export default SqlMap;
