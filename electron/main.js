const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let backendProcess = null;

function resolveBackend(file) {
    return app.isPackaged
        ? path.join(process.resourcesPath, "backend", file)
        : path.join(__dirname, "../backend", file);
}

function startBackend() {
    const serverPath = resolveBackend("server.js");

    const env = {
        ...process.env,
        ELECTRON_PACKAGED: app.isPackaged ? "1" : "0",
        RESOURCES_PATH: app.isPackaged ? process.resourcesPath : ""
    };

    const cwd = app.isPackaged
        ? path.join(process.resourcesPath, "backend")
        : path.join(__dirname, "../backend");

    backendProcess = spawn(process.execPath, [serverPath], {
        cwd,
        env,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
    });

    backendProcess.stdout.on("data", (d) => console.log("[Backend]", d.toString()));
    backendProcess.stderr.on("data", (d) => console.error("[Backend ERROR]", d.toString()));

    backendProcess.on("exit", (code) => {
        console.warn("[Backend exited]", code);
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            // webSecurity: false
        }
    });

    win.loadFile(
        app.isPackaged
            ? path.join(process.resourcesPath, "frontend", "dist", "index.html")
            : path.join(__dirname, "../frontend/dist/index.html")
    );
}

app.whenReady().then(() => {
    startBackend();
    createWindow();
});


