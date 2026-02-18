import React, { useState, useRef, useEffect } from 'react';
import './Scanner.css'; // Reuse existing styles

const PacketCrafter = () => {
    const [target, setTarget] = useState('');
    const [port, setPort] = useState('80');
    const [protocol, setProtocol] = useState('TCP');
    const [count, setCount] = useState('4');
    const [payload, setPayload] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // TCP Flags
    const [flags, setFlags] = useState({
        SYN: true, ACK: false, FIN: false, RST: false,
        PSH: false, URG: false, CWR: false, ECE: false
    });

    const outputRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const handleFlagChange = (flag) => {
        setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
    };

    const handleSend = async () => {
        if (!target) {
            setOutput(prev => prev + "\n[!] Target Required.\n");
            return;
        }

        setIsRunning(true);
        setOutput(prev => prev + `\n[*] Crafting Packet -> ${target} (${protocol})...\n`);

        window.electron.packetSend({
            target, port, protocol, count, payload, flags
        }, (data) => {
            setOutput(prev => prev + data);
        }, (code) => {
            setIsRunning(false);
            setOutput(prev => prev + `\n[+] Finished (Code: ${code})\n`);
        });
    };

    const handleExport = async () => {
        if (!output) return;
        const saved = await window.electron.saveFile(output, `packet_capture_${Date.now()}.txt`);
        if (saved) setOutput(prev => prev + `\n[+] Log Exported.\n`);
    };

    const toggleFlag = (f) => (
        <label key={f} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '10px', color: flags[f] ? 'var(--neon-green)' : '#666' }}>
            <input type="checkbox" checked={flags[f]} onChange={() => handleFlagChange(f)} style={{ marginRight: '5px' }} />
            {f}
        </label>
    );

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <h2>PACKET CRAFTER (NPING)</h2>
                <div className="status-indicator">
                    {isRunning ? <span className="blinking">TRANSMITTING...</span> : "READY"}
                </div>
            </div>

            <div className="scanner-controls" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {/* Row 1: Basic Config */}
                <div className="control-group">
                    <label>TARGET IP/HOST</label>
                    <input className="cyber-input" value={target} onChange={e => setTarget(e.target.value)} placeholder="192.168.1.1" />
                </div>
                <div className="control-group">
                    <label>PROTOCOL</label>
                    <select className="cyber-select" value={protocol} onChange={e => setProtocol(e.target.value)}>
                        <option value="TCP">TCP</option>
                        <option value="UDP">UDP</option>
                        <option value="ICMP">ICMP</option>
                        <option value="ARP">ARP</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>PORT(S)</label>
                    <input className="cyber-input" value={port} onChange={e => setPort(e.target.value)} placeholder="80, 443" disabled={protocol === 'ICMP' || protocol === 'ARP'} />
                </div>

                {/* Row 2: Advanced */}
                <div className="control-group">
                    <label>COUNT</label>
                    <input className="cyber-input" type="number" value={count} onChange={e => setCount(e.target.value)} min="1" />
                </div>
                <div className="control-group" style={{ gridColumn: '2 / 4' }}>
                    <label>PAYLOAD (Optional String)</label>
                    <input className="cyber-input" value={payload} onChange={e => setPayload(e.target.value)} placeholder="GET / HTTP/1.0" />
                </div>

                {/* Row 3: Flags (Only TCP) */}
                {protocol === 'TCP' && (
                    <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                        <label>TCP FLAGS</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '10px', border: '1px solid #333' }}>
                            {['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG', 'CWR', 'ECE'].map(f => toggleFlag(f))}
                        </div>
                    </div>
                )}

                <div className="actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                    <button className="cyber-btn start" onClick={handleSend} disabled={isRunning}>
                        {isRunning ? 'SENDING...' : 'SEND PACKETS'}
                    </button>
                    <button className="cyber-btn" onClick={handleExport} disabled={!output}>
                        EXPORT LOG
                    </button>
                    <button className="cyber-btn" onClick={() => setOutput('')} style={{ borderColor: '#666' }}>
                        CLEAR
                    </button>
                </div>
            </div>

            <div className="scanner-output" ref={outputRef}>
                <pre>{output || "Initializing Packet Crafter...\nReady to transmit."}</pre>
            </div>
        </div>
    );
};

export default PacketCrafter;
