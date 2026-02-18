import React from 'react';
import './Sidebar.css';

const tools = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '⚡' },
    { id: 'scanner', label: 'NMAP SCANNER', icon: '📡' },
    { id: 'webscan', label: 'WEBSITE SCANNER', icon: '🕷️' },
    { id: 'ssh', label: 'SSH TOOLS', icon: '🔐' },
    { id: 'winrm', label: 'HTTPS CONNECTOR', icon: '🛡️' },
    { id: 'steg', label: 'STEGANOGRAPHY', icon: '🖼️' },
    { id: 'recon', label: 'RECONNAISSANCE', icon: '🔍' },
    { id: 'discovery', label: 'NET DISCOVERY', icon: '🌐' },
    { id: 'subdomain', label: 'SUBDOMAINS', icon: '🌐' },
    { id: 'encryption', label: 'FILE CRYPTO', icon: '🔒' },
    { id: 'packet', label: 'PACKET CRAFTER', icon: '📦' },
    { id: 'server', label: 'LOCAL SERVER', icon: '📂' },
];

const Sidebar = ({ activeTool, setActiveTool }) => {
    const [version, setVersion] = React.useState('Loading...');

    React.useEffect(() => {
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then(v => setVersion(`v${v}`));
        }
    }, []);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={new URL('../assets/logo.png', import.meta.url).href} alt="CyberStrike" style={{ width: '80px', marginBottom: '10px' }} />
            </div>
            <nav>
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        className={`nav-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => setActiveTool(tool.id)}
                    >
                        <span className="icon">{tool.icon}</span>
                        <span className="label">{tool.label}</span>
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button className="nav-btn upgrade-btn" onClick={() => window.electron.checkUpdates()} style={{ color: '#00ccff', borderTop: '1px solid #333' }}>
                    <span className="icon">⬇</span>
                    <span className="label">UPGRADE APP</span>
                </button>
                <button className="nav-btn exit-btn" onClick={() => window.electron.quitApp()} style={{ color: '#ff4444' }}>
                    <span className="icon">✖</span>
                    <span className="label">TERMINATE</span>
                </button>
            </div>
            <div className="version">{version}</div>
        </div>
    );
};

export default Sidebar;
