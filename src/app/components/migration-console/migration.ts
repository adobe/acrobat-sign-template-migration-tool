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

import { Settings } from "src/app/settings/settings";
import { httpRequest } from "src/app/util/electron-functions";

export async function migrate(oldThis: any, documentId: string): Promise<any> {  
  oldThis.logToConsole('About to inspect this document in the source account and then download it from the source account.');
  oldThis.logToConsoleTabbed(`The ID of this document in the source account is ${documentId}.`);
  const result = await download(oldThis, documentId);

  oldThis.logToConsole('About to upload this document to the destination account.');
  await upload(oldThis, result.docName, result.formFields, result.pdfBlob, documentId);
}

async function download(oldThis: any, documentId: string): Promise<any> {
  const baseUri = await oldThis.urlService.getApiBaseUri(oldThis.sourceBearerToken, oldThis.sourceComplianceLevel);    
  const defaultHeaders = {'Authorization': `Bearer ${oldThis.sourceBearerToken}`};

  /* GET the name of the document. */
  let requestConfig: any = {
    'method': 'get',
    'url': `${baseUri}/libraryDocuments/${documentId}`,
    'headers': defaultHeaders
  };
  const docName: string = (await httpRequest(requestConfig)).name;
  oldThis.logToConsoleTabbed(`The name of this document in the source account is "${docName}"`);

  /* GET the values the user has entered into the document's fields. */
  requestConfig.url = `${baseUri}/libraryDocuments/${documentId}/formFields`;
  const formFields: {[key: string]: string}[] = (await httpRequest(requestConfig));
  oldThis.logToConsoleTabbed(`Obtained the values the user entered into this document's fields.`);

  /* GET the URL of the PDF on which the custom form fields that the user field out were placed. */
  requestConfig.url = `${baseUri}/libraryDocuments/${documentId}/combinedDocument/url`;
  const combinedDocumentUrl = (await httpRequest(requestConfig)).url;
  oldThis.logToConsoleTabbed(`The PDF representation of this document is located at ${combinedDocumentUrl}.`);

  /* Get the PDF itself. */
  requestConfig.url = combinedDocumentUrl;
  requestConfig.responseType = 'arraybuffer';
  const pdfArrayBuffer: ArrayBuffer = (await httpRequest(requestConfig));
  const pdfBlob = new Blob([pdfArrayBuffer], {type: 'application/pdf'});

  if (Settings.debugViewDownloadedPdf) {
    const blobUrl = URL.createObjectURL(pdfBlob);
    (<any> window).open(blobUrl);
  }

  return {'docName': docName, 'formFields': formFields, 'pdfBlob': pdfBlob};
}

async function upload(oldThis: any, docName: string, formFields: {[key: string]: string}, pdfBlob: Blob, documentId: string) {
  oldThis.logToConsole('About to obtain baseUri.');
  const baseUri = await oldThis.urlService.getApiBaseUri(oldThis.destBearerToken, oldThis.destComplianceLevel);
  oldThis.logToConsole('About to form "defaultHeaders" object.');
  const defaultHeaders = {'Authorization': `Bearer ${oldThis.destBearerToken}`};

  oldThis.logToConsoleTabbed(`About to upload the downloaded PDF to the destination 
    account by POSTing to ${baseUri}/transientDocuments`);

  /* POST the same document (but without any custom form fields) as a transient document and get its ID.
  (Informed by https://stackoverflow.com/questions/53038900/nodejs-axios-post-file-from-local-server-to-another-server). */
  const formData = new FormData();
  formData.append('File-Name', docName);
  formData.append('File', pdfBlob);
  
  let requestConfig: any = {
    'method': 'post',
    'url': `${baseUri}/transientDocuments`,
    'headers': defaultHeaders,
    'data': formData
  };
  const response: any = (await oldThis.httpRequestTemp(requestConfig)); // this API endpoint is tricky; have to access data field of response to get response
  const transientDocumentId = response.transientDocumentId;
  oldThis.logToConsoleTabbed(`Uploaded the downloaded PDF to the destination account as a transient document with a transientDocumentId of ${transientDocumentId}.`);

  /* Create a library document from the just-created transient document. */
  let libraryDocumentInfo = 
  {
    'fileInfos' : [{'transientDocumentId' : transientDocumentId}],
    'name': Settings.docNamePrefixForDebug + docName,
    'sharingMode': 'ACCOUNT', // can be 'USER' or 'GROUP' or 'ACCOUNT' or 'GLOBAL'
    'state': 'ACTIVE', // can be 'AUTHORING' or 'ACTIVE'
    'templateTypes': ['DOCUMENT'] // each array elt can be 'DOCUMENT' or 'FORM_FIELD_LAYER'
  };
  
  requestConfig = {
    'method': 'post',
    'url': `${baseUri}/libraryDocuments`,
    'headers': defaultHeaders,
    'data': libraryDocumentInfo
  };
  const newLibraryDocumentId = (await httpRequest(requestConfig)).id;
  oldThis.logToConsoleTabbed(`Created a library document (a template) in the destination account from the transient document with a libraryDocumentId of ${newLibraryDocumentId}.`);

  /* Use a PUT request to add the custom form fields and the values entered earlier to the document. */
  requestConfig = {
    'method': 'put',
    'url': `${baseUri}/libraryDocuments/${newLibraryDocumentId}/formFields`,
    'headers': defaultHeaders,
    'data': formFields
  };
  await httpRequest(requestConfig);
  oldThis.logToConsoleTabbed("Wrote the values the user entered into this document's fields to the library document in the destination account.");
}