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

export interface I_Settings {
	/* Determines which Adobe Sign API URLs are used for the API calls that this
	application relies on. Use "stage" to use URLs that contain "adobesignstage"
	and "prod" to use URLs that contain "adobesign" but not "adobesignstage". */
	apiEnv: "stage" | "prod",

	/* Whether or not to use util/credentials.ts to log in. Useful
	for development. */
	forceUseTestCredentials: boolean,

	/* The URL that OAuth is instructed to redirect the user to upon successful login. */
	redirectUri: "https://migrationtool.com",

	/* Is appended to name of every document uploaded to the destination account.
	Use the empty string to essentially disable this setting. */
	docNamePrefixForDebug: string,

	/* Opens each PDF in a new window after downloading it from the source account.
	Useful for verifying that PDFs have been correctly downloaded. */
	debugViewDownloadedPdf: boolean,

	/* Use 1 for a reasonable dev-purposes page limit. 
	Use a value < 0 to disable this limit and thus load
	all the documents. */
	devPageLimit: number
};

const devStageSettings: I_Settings = {
	apiEnv: "stage",
	forceUseTestCredentials: true,
	redirectUri: "https://migrationtool.com",
	docNamePrefixForDebug: '(-!- FROM ELECTRON APP -!-)',
	debugViewDownloadedPdf: false,
	devPageLimit: -1
};

let devProdSettings = devStageSettings;
devProdSettings.apiEnv = "prod";

const prodSettings: I_Settings = {
	apiEnv: "prod",
	forceUseTestCredentials: false,
	redirectUri: "https://migrationtool.com",
	docNamePrefixForDebug: '',
	debugViewDownloadedPdf: false,
	devPageLimit: -1
};

const stageSettings = {...prodSettings}; // in general, {...x} is a deep copy of x
stageSettings.apiEnv = "stage";

export const Settings = prodSettings;