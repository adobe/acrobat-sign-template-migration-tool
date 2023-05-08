/************************************************************************
* 
 * ADOBE CONFIDENTIAL 
 * ___________________ 
 * 
 * Copyright [first year code created] Adobe 
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

const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", { 
  httpRequest2: (requestConfig) => ipcRenderer.invoke("httpRequest1", requestConfig),
  loadUrl2: (url) => ipcRenderer.invoke("loadUrl1", url),
    
  notifyIsRendererInitDone: () => ipcRenderer.send("renderer-init-done"),
  onNavigate: (callback) => ipcRenderer.on("navigate", callback),

  notifyIsConsoleInitStarted: () => ipcRenderer.send("console-init-started"),
  onConsoleInitFinish: (callback) => ipcRenderer.on("console-init-finish", callback)
});