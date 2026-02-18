import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, activeTool, setActiveTool }) => {
  return (
    <div className="cyber-layout">
      <div className="title-bar" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '30px',
        zIndex: 9999, display: 'flex', justifyContent: 'flex-end',
        background: 'transparent', WebkitAppRegion: 'drag' // Allow dragging
      }}>
        <div className="window-controls" style={{ WebkitAppRegion: 'no-drag', display: 'flex' }}>
          <button onClick={() => window.electron.minimizeWindow()} style={controlBtnStyle}>_</button>
          <button onClick={() => window.electron.maximizeWindow()} style={controlBtnStyle}>□</button>
          {/* Close logic is handled in Sidebar terminate, but we can add one here too or just min/max */}
        </div>
      </div>
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <main className="cyber-content" style={{ marginTop: '30px' }}> {/* Push content down */}
        <div className="content-frame">
          {children}
        </div>
        <footer className="cyber-status-bar">
          <span>STATUS: ONLINE</span>
          <span>SYSTEM: SECURE</span>
          <span>USER: ADMIN</span>
        </footer>
      </main>
    </div>
  );
};

const controlBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--neon-cyan)',
  fontSize: '16px',
  cursor: 'pointer',
  padding: '0 15px',
  outline: 'none'
};

export default Layout;
