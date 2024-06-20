/************************************************************************
* 
 * ADOBE CONFIDENTIAL 
 * ___________________ 
 * 
 * Copyright 2023 Adobe 
 * All Rights Reserved. 
 * 
 * NOTICE: All information contained herein is, and remains 
 * the property of Adobe and its suppliers, if any. The intellectual 
 * and technical concepts contained herein are proprietary to Adobe 
 * and its suppliers and are protected by all applicable intellectual 
 * property laws, including trade secret and copyright laws. 
 * Dissemination of this information or reproduction of this material 
 * is strictly forbidden unless prior written permission is obtained 
 * from Adobe. 
 
*************************************************************************
*/

const {app, BrowserWindow, ipcMain, session} = require('electron');
const url = require("url");
const path = require("path");
const axios = require("axios").default;
const https = require('https');
axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });

/* Functions to be exposed to renderer via preload.js. */

async function httpRequest(event, requestConfig) {
  /* We don't just "return (await axios(requestConfig))" because the result is not clonable
  and thus can't be passed to the renderer process without some extra work. */
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
let redirectUrls = []; // string[]

/* Loads the index.html file into the window win. */
function loadIndexHtml(win) {
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, `../../dist/migration-tool/index.html`),
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
      preload: path.join(__dirname, "preload.js"),
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
    currentWindow.webContents.send("console-init-finish", redirectUrls);
  });

  /* Configure handling of redirect from OAuth to https://migrationtool.com by canceling
  the redirect and manually loading index.html. */
  const filter = { urls: ['https://migrationtool.com/*'] };
  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    console.log('redirected!');
    redirectUrls.push(details.url); // the URL that OAuth redirects us to
    console.log('redirectUrls', redirectUrls);
    redirected = true;
    
    /* Clear cookies before redirecting. If we don't do this, then when we log into the second account,
    the login cookie from the first account will be used, and the second login will thus be erroneously ignored. */
    mainWindow.webContents.session.clearStorageData({storages: ['cookies']}); // using no arguments seems like it should work, but it causes an error

    /* Cancel the redirect and manually load index.html. */
    const currentWindow = BrowserWindow.getFocusedWindow();
    configLoadRendererAfterDOMContentLoaded(currentWindow);
    callback({ cancel: true });
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