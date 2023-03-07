const {app, BrowserWindow, ipcMain, session} = require('electron');
const url = require("url");
const path = require("path");
const axios = require("axios").default;

/* Functions to be exposed to renderer via preload.ts. */

async function httpRequest(event, requestConfig) {
  return (await axios(requestConfig)).data;
}

function loadUrl(event, url) {
  const currentWindow = BrowserWindow.getFocusedWindow();
  currentWindow.webContents.loadURL(url);
}

function getCurrentUrl(event) {
  const currentWindow = BrowserWindow.getFocusedWindow();
  return currentWindow.webContents.getURL();
}

/* Window setup. */

let mainWindow; // BrowserWindow
let redirected = false; // boolean
let redirectUrl; // string

/* Loads the index.html file into the window win. */
function loadIndexHtml(win) {
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, `../dist/migration-tool/index.html`),
      protocol: "file:",
      slashes: true
    })
  );
}

/* Configures the window win so that the renderer process (i.e. the Angular scripts) is loaded
 only after "DOMContentLoaded" occurs. This prevents us from getting "is not a function" errors
 when using functions exposed from Electron in Angular scripts. */
function configLoadRendererAfterDOMContentLoaded(win) {
  win.webContents.on("dom-ready", function() {
    const jsCode = `document.addEventListener('DOMContentLoaded', function() { 
      platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err)); });`
    win.webContents.executeJavaScript(jsCode);
  });
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
      nodeIntegration: true //necessary?
    }
  });

  mainWindow.on("closed", function () { mainWindow = null });
  configLoadRendererAfterDOMContentLoaded(mainWindow);
  loadIndexHtml(mainWindow);
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(function() {  
  ipcMain.handle("httpRequest1", httpRequest);
  ipcMain.handle("loadUrl1", loadUrl);
  ipcMain.handle("getCurrentUrl1", getCurrentUrl);

  /* Configure handling of "render-init-done" channel: when the renderer process says that it
  is done initializing and is therefore ready to recieve messages, send it a message
  that instructs it to change the activated route to "/migration-console". */
  ipcMain.on("renderer-init-done", function(event) {
    if (redirected) {
        const currentWindow = BrowserWindow.getFocusedWindow();
        currentWindow.webContents.send("navigate", "/migration-console");
    }
  });

  /* Configure similar handling for when ngOnInit() method of migration-console.component has fired. */
  ipcMain.on("console-init-started", function(event) {
    const currentWindow = BrowserWindow.getFocusedWindow();
    console.log('redirectUrl', redirectUrl);
    currentWindow.webContents.send("console-init-finish", redirectUrl);
  });

  /* Configure handling of redirect from OAuth to https://migrationtool.com by canceling
  the redirect and manually loading index.html. */
  const filter = { urls: ['https://migrationtool.com/*'] };
  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    redirectUrl = details.url; // this the URL that OAuth redirects us to
    redirected = true;
    callback({ cancel: true });
    const currentWindow = BrowserWindow.getFocusedWindow();
    configLoadRendererAfterDOMContentLoaded(currentWindow);
    loadIndexHtml(currentWindow);
  });

  createWindow();
})

app.on('window-all-closed', function () {
  if (process.platform !== "darwin") app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});