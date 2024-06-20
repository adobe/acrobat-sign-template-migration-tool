# sign-doc-reuploader

This is a "migration tool" that copies selected documents between Adobe Sign accounts. Both the "source" and "destination" accounts may either be a commercial Adobe Sign account or a Adobe Sign for Gov account. Both accounts may either be hosted on any shard. The most common use case is the copying of *all* documents over from a commercial account to a government account.

This tool is currently in beta. Please open an issue for any bugs you find.

## Instructions for use

### Setup: source account

1. Log-in to Sign with an account that is an Account admin. (This is necessary in order for the account to have read access to all of the templates that are to be migrated.) Creation of a temporary account with Account admin status may be necessary for this purpose.
2. Click on the "Account" tab. Search for "API Applications" in the left search bar and then click on "API Applications".
3. Click the plus sign to create an API Application. Give it a name and display name.
4. Click on the row that corresponds to the API Application and then click "Configure OAuth for Application".
5. Check the box next to `library_read` and then "Save".
6. Again click on the row that corresponds to the API Application, click "View/Edit", and then make note of the client ID and client secret.

### Setup: destination account

First, log in to your government account to ensure that you can indeed log in. After the migration process executes, it's necessary to log into the government account to check that documents were correctly migrated.

Receive the "Gov client ID" and "Gov client secret" for said API Application from Professional Services. The API token will have the `library_write` scope enabled.

### Optional: building the app manually

If you would like to build the app yourself instead of downloading precompiled executables, follow these steps.

1. Download this repository by clicking "Code", then "Download ZIP".
2. Unzip the downloaded .zip file. Let's refer to the folder that contains files such as package.json as "fldr".
3. In a command prompt, `cd` into fldr and execute `npm install`.
4. Make sure the the last line of fldr/src/app/settings/settings.ts is `Settings = prodSettings`, and not `Settings = devSettings` or `Settings = almostProdSettings`. Edit this last line and then "Save" if necessary.
5. In a command prompt, `cd` into fldr and execute `npm run make`.
6. In your file explorer, navigate into the "out" directory, and then into the folder that corresponds to whatever operating system you're using (e.g. "migration-tool-win32-x64"). The app executable will be inside this folder. On Windows, it will be an .exe file, on Mac, it will be a .dmg file; on Linux, it will be a .deb file.
7. Double click the executable to run the app. Have the commercial integration key, gov client ID, and gov client secret on hand when you do so.

# Disclaimer

Any organization who uses this app implicitly acknowledges that it moves templates from FedRAMP LI-SAAS to FedRAMP moderate. FedRAMP LI-SAAS is less strict than FedRAMP moderate.

# Known bugs

About once every hundred times the app is run, you may see the following pop-up error message:

```
Uncaught Exception:
TypeError: Cannot read properties of null (reading 'webContents')
	at configLoadRenderAfterDOMContentLoaded (...\electron\main.ts45:7)
	at Function.<anonymous> (...\electron\main.ts95:7)
```

If you get this error, just close the application and restart it.

# Technical implementation

The below describes the most complicated part of the application, which is the communication between the Electron main process and the Electron renderer process implemented in the application. There are two main tasks that require this communication:

1. Responding to the event of a user logging into the source account or destination account.
2. Obtaining the OAuth access token after the migration console UI loads.

## 1. Responding to log-in

### `ngOnInit()` method of src/app/app.component.ts 

 `(<any> window).api.send("renderer-init-done")` 

### electron/main.js

`ipcMain.on("renderer-init-done", function(event) { ipcMain.send("navigate", "/migration-console"); } )`

### `ngOnInit()` method of src/app/app.component.ts 

```typescript
(<any> window).api.on("navigate", (event: any, url: string) => { 
	/* If the user has logged into both their source and dest accounts, then navigate them to the
	url" argument that's passed to the callback. Otherwise, return them back to the login UI so that
	they can log into the remaining account.
      
   	Currently, the "url" argument of the callback is always "/migration-console". */
    const shared = this.sharerService.getShared();
    if (shared.loggedIn.includes('source') && shared.loggedIn.includes('dest'))
    	this.router.navigateByUrl(url);
    else
    	this.router.navigateByUrl('/login'); 
})
```

## 2. Obtain OAuth access token

### `ngOnInit()` method of src/app/.../migration-console.component.ts

`(<any> window).api.send("console-init-started")`

### electron/main.js

`ipcMain.on("console-init-started", function(event) { ipcMain.send("console-init-finish", redirectUrls); })`

### `ngOnInit()` method of src/app/.../migration-console.component.ts

```typescript
(<any> window).api.on("console-init-finish", async (event: any, redirectUrls: string[]) => {
	// use info embedded in redirect url to obtain access token, and set private field of component to this access token
})
```

## Actual implementation of calls made in `ngOnInit()` methods

In all of the above descriptions of `ngOnInit()` methods, we have code such as `(<any> window).api.send("<some channel>")` and `(<any> window).api.on("<some other channel>")`. In order for this code to be valid, we would need to expose the `ipcRenderer.send` and `ipcRenderer.on` methods to the renderer process (i.e. the Angular code) in preload.js, and add the following to the second argument of `contextBridge.exposeInMainWorld()` in preload.js:

```javascript
send: (channel, message) => ipcRenderer.send(channel, message),
on: (channel, callback) => ipcRenderer.on(channel, callback)
```

We want to expose as little of the Electron API to the frontend as possible, though, so we don't do the above. Instead, we add code such as the following to preload.js:

```javascript
notifyIsRendererInitDone: () => ipcRenderer.send("renderer-init-done"),
onNavigate: (callback) => ipcRenderer.on("navigate", callback)
```

In the renderer process (the Angular code), we can then call `(<any> window).notifyIsRendererInitDone()` to effectively call `ipcRenderer.send("renderer-init-done")` , and can call `(<any> window).onNavigate(callback)` to effectively call `ipcRenderer.on("navigate", callback)`.
