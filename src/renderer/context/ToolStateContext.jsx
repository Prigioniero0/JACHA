import React, { createContext, useContext, useState } from 'react';

const ToolStateContext = createContext();

export const ToolStateProvider = ({ children }) => {
    // Recon State
    const [reconOutput, setReconOutput] = useState('');
    const [reconTab, setReconTab] = useState('whois');
    const [reconTarget, setReconTarget] = useState('');

    // Nmap State
    const [nmapOutput, setNmapOutput] = useState('');
    const [nmapTarget, setNmapTarget] = useState('');
    const [nmapProfile, setNmapProfile] = useState('Quick Scan');
    const [nmapFlags, setNmapFlags] = useState('');
    const [nmapCliMode, setNmapCliMode] = useState(false);
    const [nmapCliCommand, setNmapCliCommand] = useState('');

    // SQLMap State (Legacy - kept if needed for strict compatibility, but feature removed)
    const [sqlOutput, setSqlOutput] = useState('');
    const [sqlUrl, setSqlUrl] = useState('');
    const [sqlOptions, setSqlOptions] = useState('--dbs');

    // Spider State
    const [spiderOutput, setSpiderOutput] = useState('');
    const [spiderUrl, setSpiderUrl] = useState('');
    const [spiderDepth, setSpiderDepth] = useState(1);

    // Website Scanner State
    const [webOutput, setWebOutput] = useState('');
    const [webUrl, setWebUrl] = useState('');

    const value = {
        reconState: { output: reconOutput, setOutput: setReconOutput, tab: reconTab, setTab: setReconTab, target: reconTarget, setTarget: setReconTarget },
        nmapState: {
            output: nmapOutput, setOutput: setNmapOutput,
            target: nmapTarget, setTarget: setNmapTarget,
            profile: nmapProfile, setProfile: setNmapProfile,
            flags: nmapFlags, setFlags: setNmapFlags,
            cliMode: nmapCliMode, setCliMode: setNmapCliMode,
            cliCommand: nmapCliCommand, setCliCommand: setNmapCliCommand
        },
        sqlState: { output: sqlOutput, setOutput: setSqlOutput, url: sqlUrl, setUrl: setSqlUrl, options: sqlOptions, setOptions: setSqlOptions },
        spiderState: { output: spiderOutput, setOutput: setSpiderOutput, url: spiderUrl, setUrl: setSpiderUrl, depth: spiderDepth, setDepth: setSpiderDepth },
        webState: { output: webOutput, setOutput: setWebOutput, url: webUrl, setUrl: setWebUrl },
    };

    return (
        <ToolStateContext.Provider value={value}>
            {children}
        </ToolStateContext.Provider>
    );
};

export const useToolState = () => useContext(ToolStateContext);
