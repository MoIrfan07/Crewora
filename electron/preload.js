// const { contextBridge } = require("electron");

// contextBridge.exposeInMainWorld("electronAPI", {
//     appVersion: () => "1.0.0"
// });


// Minimal preload for security
// const { contextBridge } = require('electron');

// // Expose safe APIs to renderer
// contextBridge.exposeInMainWorld('electron', {
//     isPackaged: process.versions.electron ? true : false
// });


// Empty preload for now
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    isPackaged: process.versions.electron ? true : false
});