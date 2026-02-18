import React, { useState, useEffect } from 'react';
import './Recon.css';

const LocalServer = () => {
    const [port, setPort] = useState(8000);
    const [dir, setDir] = useState('C:\\'); // Default, user should ideally type. Electron file picker impossible in renderer without IPC logic, simplest is typing for now or simple IPC. 
    // Wait, I can't easily open native dialog from renderer without IPC. 
    // I will just let user type path.
    const [isRunning, setIsRunning] = useState(false);
    const [ips, setIps] = useState({});
    const [msg, setMsg] = useState('');

    useEffect(() => {
        window.electron.getSystemIp().then(setIps);
        // Cleanup on unmount?
        return () => {
            // Maybe don't kill server on tab switch, only on explicit stop or app quit?
        }
    }, []);

    const handleStart = async () => {
        setMsg('Starting...');
        const res = await window.electron.startServer(port, dir);
        if (res.success) {
            setIsRunning(true);
            setMsg(`Server Running on Port ${port}`);
        } else {
            setMsg(`Error: ${res.message}`);
        }
    };

    const handleStop = async () => {
        await window.electron.stopServer();
        setIsRunning(false);
        setMsg('Server Stopped');
    };

    return (
        <div className="recon-container">
            <div className="recon-header">
                <h2>LOCAL SERVER MANAGER</h2>
                <div className="status-indicator">
                    <span className={`status-dot ${isRunning ? 'busy' : 'idle'}`}></span>
                    {isRunning ? 'ONLINE' : 'OFFLINE'}
                </div>
            </div>

            <div className="recon-controls">
                <label>PORT</label>
                <input className="cyber-input" type="number" style={{ width: '100px' }} value={port} onChange={e => setPort(e.target.value)} />

                <label>DIRECTORY</label>
                <input className="cyber-input" value={dir} onChange={e => setDir(e.target.value)} placeholder="C:\Users\name\folder" />

                {!isRunning ? (
                    <button className="cyber-btn" onClick={handleStart}>HOST</button>
                ) : (
                    <button className="cyber-btn danger" onClick={handleStop}>STOP</button>
                )}
            </div>

            <div className="recon-output">
                <h3>AVAILABLE ADDRESSES</h3>
                <div className="grid-view">
                    {Object.entries(ips).map(([iface, addrs]) => (
                        <div key={iface} style={{ padding: '10px', border: '1px solid #333', margin: '5px', borderRadius: '4px' }}>
                            <strong style={{ color: 'var(--neon-green)' }}>{iface}</strong>
                            {addrs.map(ip => (
                                <div key={ip} style={{ marginTop: '5px', fontSize: '1.2em' }}>
                                    http://{ip}:{port}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: '20px', color: isRunning ? 'var(--neon-green)' : '#666' }}>{msg}</p>
            </div>
        </div>
    );
};
export default LocalServer;
