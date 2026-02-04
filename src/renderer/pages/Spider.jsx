import React, { useState, useRef, useEffect } from 'react';
import './Spider.css';
import { useToolState } from '../context/ToolStateContext';

const Spider = () => {
    const { spiderState } = useToolState();
    const { output, setOutput, url, setUrl, depth, setDepth } = spiderState;
    const [isRunning, setIsRunning] = useState(false);
    const [resultPath, setResultPath] = useState(null);
    const outputRef = useRef(null);

    // Filter duplicates or use a reducer? Simple string append is fine for logs.
    // Effect to handle logs
    useEffect(() => {
        if (!window.electron) return;

        const handleLog = (msg) => {
            setOutput(prev => prev + msg + '\n');
            // Auto scroll?
            if (outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight;
            }
        };

        window.electron.onSpiderLog(handleLog);

        return () => {
            if (window.electron.removeSpiderListeners) window.electron.removeSpiderListeners();
        };
    }, []);

    const handleStart = async () => {
        if (!url) return;
        let target = url.startsWith('http') ? url : `http://${url}`;

        setIsRunning(true);
        setOutput(`Initializing Spider on ${target}...\n`);
        setResultPath(null);

        try {
            const result = await window.electron.startSpider(target, depth);
            if (result.success) {
                setOutput(prev => prev + `\nDONE! Output saved to: ${result.path}\n`);
                setResultPath(result.path);
            } else {
                setOutput(prev => prev + `\nFATAL ERROR: ${result.error}\n`);
            }
        } catch (e) {
            setOutput(prev => prev + `\nSystem Error: ${e}\n`);
        } finally {
            setIsRunning(false);
        }
    };

    const openFolder = () => {
        if (resultPath && window.electron.openSpiderFolder) {
            window.electron.openSpiderFolder(resultPath);
        }
    };

    return (
        <div className="spider-container">
            <div className="spider-header">
                <h2>WEBSITE COPIER</h2>
            </div>

            <div className="spider-controls">
                <div className="control-group">
                    <label>URL</label>
                    <input className="cyber-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="example.com" />
                </div>
                <div className="control-group small">
                    <label>Depth</label>
                    <input type="number" className="cyber-input" value={depth} onChange={e => setDepth(Number(e.target.value))} min="1" max="5" />
                </div>
                <button className="cyber-btn" onClick={handleStart} disabled={isRunning}>
                    {isRunning ? 'RUNNING...' : 'START'}
                </button>
                {resultPath && (
                    <button className="cyber-btn" onClick={openFolder} style={{ marginLeft: '10px', borderColor: '#00ff00', color: '#00ff00' }}>
                        OPEN FOLDER
                    </button>
                )}
            </div>

            <div className="spider-output" ref={outputRef} style={{ overflowY: 'auto', maxHeight: '400px', textAlign: 'left' }}>
                <pre>{output}</pre>
            </div>
        </div>
    );
};

export default Spider;
