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

export interface I_Settings {
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

const devSettings: I_Settings = {
	forceUseTestCredentials: true,
	redirectUri: "https://migrationtool.com",
	docNamePrefixForDebug: '(-!- FROM ELECTRON APP -!-)',
	debugViewDownloadedPdf: false,
	devPageLimit: -1
};

const prodSettings: I_Settings = {
	forceUseTestCredentials: false,
	redirectUri: "https://migrationtool.com",
	docNamePrefixForDebug: '',
	debugViewDownloadedPdf: false,
	devPageLimit: -1
};

export const Settings = prodSettings;