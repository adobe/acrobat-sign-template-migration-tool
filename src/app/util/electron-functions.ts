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

/* The definitions of the functions called within the functions of this file are given in preload.ts.
Said defintions involve ipcRenderer.invoke(). Since the result of any ipcRenderer.invoke() call
is a Promise, we mark all these functions as async for readability purposes. */

export async function httpRequest(requestConfig: any): Promise<any> {
	return (<any> window).api.httpRequest2(requestConfig);
}

export async function loadUrl(url: string) {
  (<any> window).api.loadUrl2(url);
}

export async function getCurrentUrl(): Promise<string> {
  const result = (<any> window).api.getCurrentUrl2();
  return result;
}
