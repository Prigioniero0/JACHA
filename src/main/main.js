const { app, BrowserWindow } = require('electron');
const path = require('path');
const registerHandlers = require('./handlers');

registerHandlers();

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0a0a0a', // Dark background for cyber theme
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        resizable: true,
        frame: false, // Custom window controls
        titleBarStyle: 'hidden', // Custom title bar for that cyber look
        backgroundColor: '#0a0a0a',
    });

    // Determine if we are in dev mode
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
        // DevTools closed in production
    }

    // Start maximized
    mainWindow.maximize();
    mainWindow.show();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
