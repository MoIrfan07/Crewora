// electron/ipc.js
const { ipcMain } = require("electron");

ipcMain.handle("ping", () => {
    return "pong";
});
