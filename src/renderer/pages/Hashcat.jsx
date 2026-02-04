import React from 'react';
import './Recon.css';

const Hashcat = () => {
    return (
        <div className="recon-container">
            <div className="recon-header">
                <h2>HASHCAT CRACKING</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="cyber-btn" onClick={() => window.electron.openHashcat()}>
                        LAUNCH CLI
                    </button>
                </div>
            </div>

            <div className="recon-output">
                <div style={{ color: 'var(--neon-green)', padding: '20px', border: '1px dashed #333' }}>
                    <h3>QUICK REFERENCE</h3>
                    <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2em' }}>
                        <li>[MD5] hashcat -m 0 -a 0 hash.txt wordlist.txt</li>
                        <li>[SHA256] hashcat -m 1400 -a 0 hash.txt wordlist.txt</li>
                        <li>[WPA2] hashcat -m 2500 -a 0 capture.hccapx wordlist.txt</li>
                        <li>[Benchmark] hashcat -b</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
export default Hashcat;
