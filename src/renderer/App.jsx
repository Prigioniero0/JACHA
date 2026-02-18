import React, { useState } from 'react';
import Layout from './components/Layout';
import Recon from './pages/Recon';
import Scanner from './pages/Scanner';
import Spider from './pages/Spider';
import SqlMap from './pages/SqlMap';
import Discovery from './pages/Discovery';
import Subdomain from './pages/Subdomain';
import Hashcat from './pages/Hashcat';
import John from './pages/John';
import Metasploit from './pages/Metasploit';
import Encryption from './pages/Encryption';
import WebsiteScanner from './pages/WebsiteScanner';
import SshTools from './pages/SshTools';
import WinRmTools from './pages/WinRmTools';
import StegTool from './pages/StegTool';
import PacketCrafter from './pages/PacketCrafter';
import Server from './pages/LocalServer'; // Corrected Import
import ErrorBoundary from './components/ErrorBoundary';
import Intro from './components/Intro';
import { ToolStateProvider } from './context/ToolStateContext';

function App() {
    const [activeTool, setActiveTool] = useState('dashboard');
    const [showIntro, setShowIntro] = useState(true);

    const renderTool = () => {
        switch (activeTool) {
            case 'dashboard':
                return (
                    <div style={{ textAlign: 'center', marginTop: '20%' }}>
                        <h1 style={{ fontSize: '3em', color: 'var(--neon-green)', textShadow: '0 0 20px var(--neon-green)' }}>WELCOME OPERATOR</h1>
                        <p>Select a tool from the sidebar to begin.</p>
                    </div>
                );
            case 'scanner':
                return <Scanner />;
            case 'webscan':
                return <WebsiteScanner />;
            case 'ssh':
                return <SshTools />;
            case 'winrm':
                return <WinRmTools />;
            case 'steg':
                return <StegTool />;
            case 'recon':
                return <Recon />;
            case 'spider':
                return <Spider />;
            case 'discovery':
                return <Discovery />;
            case 'subdomain':
                return <Subdomain />;
            case 'encryption':
                return <Encryption />;
            case 'packet':
                return <PacketCrafter />;
            case 'server':
                return <Server />;
            default:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                        <img src={new URL('./assets/logo.png', import.meta.url).href} alt="CyberStrike Logo" style={{ width: '120px', marginBottom: '20px', opacity: 0.8 }} />
                        <h2 style={{ color: 'var(--neon-cyan)', fontSize: '2em' }}>SYSTEM READY</h2>
                        <p style={{ color: '#666' }}>SELECT A MODULE TO BEGIN</p>
                    </div>
                );
        }
    };

    return (
        <ToolStateProvider>
            <ErrorBoundary>
                {showIntro && <Intro onEnter={() => setShowIntro(false)} />}
                <Layout activeTool={activeTool} setActiveTool={setActiveTool}>
                    {renderTool()}
                </Layout>
            </ErrorBoundary>
        </ToolStateProvider>
    );
}

export default App;
