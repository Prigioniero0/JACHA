// netTools.js - Refactored to use Secure IPC Bridge
// direct window.require is not allowed in contextIsolation: true

export const performWhois = async (domain) => {
    if (window.electron && window.electron.reconWhois) {
        return await window.electron.reconWhois(domain);
    }
    throw new Error("Electron IPC not available");
};

export const performDnsLookup = async (domain) => {
    if (window.electron && window.electron.reconDns) {
        return await window.electron.reconDns(domain);
    }
    return "Error: IPC not available";
};

export const performReverseDns = async (ip) => {
    if (window.electron && window.electron.reconReverse) {
        return await window.electron.reconReverse(ip);
    }
    return "Error: IPC not available";
};
