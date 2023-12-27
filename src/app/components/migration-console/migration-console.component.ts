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

import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import axios from 'axios';
import { Shared, SharedInner, SharerService } from '../../services/sharer.service';
import { Settings } from '../../settings/settings';
import { httpRequest } from '../../util/electron-functions';
import { tab } from '../../util/spacing';
import { migrateAll as migrateAll } from './migration';
import { OAuthService } from 'src/app/services/oauth.service';
import { UrlService } from 'src/app/services/url.service';

@Component({
  selector: 'app-migration-console',
  templateUrl: './migration-console.component.html',
  styleUrls: ['./migration-console.component.scss']
})
export class MigrationConsoleComponent { 
  /* Reactive forms. */

  migrationToolForm = this.formBuilder.group(
  {
    documents: this.formBuilder.array([]),
    consoleMessages: this.formBuilder.array([])
  });

  get documents(): FormArray<FormGroup> {
    return this.migrationToolForm.controls['documents'] as FormArray;
  }

  readyForDownload: boolean = false;

  populateDocForm(libraryDocuments: any[]) {
    this.readyForDownload = true; // causes the "Begin upload" button to appear
    libraryDocuments.forEach(template => {
      const documentForm = this.formBuilder.group({
        name: [template.name],
        isSelected: [false]
      });
      this.documents.push(documentForm);
    });
  }

  get consoleMessages() {
    return this.migrationToolForm.controls['consoleMessages'] as FormArray;
  }

  logToConsole(message: string) {
    this.consoleMessages.push(this.formBuilder.control(message));
  }

  logToConsoleTabbed(message: string) {
    this.logToConsole(tab() + message);
  }

  async getDocumentList(): Promise<any> {
    const baseUrl = await this.urlService.getApiBaseUri(this.sourceBearerToken, this.sourceComplianceLevel);

    /* Get all library documents. */
    const pageSize = 100;
    let libraryDocuments: any[] = [];
    let response;
    let cursorQueryString = '';
    let done = false;
    for (let i = 1; !done; i ++) {
      const requestConfig = {
        'method': 'get',
        'url': `${baseUrl}/libraryDocuments?pageSize=${pageSize}` + cursorQueryString,
        'headers': {'Authorization': `Bearer ${this.sourceBearerToken}`}
      };
      response = (await httpRequest(requestConfig));

      libraryDocuments = libraryDocuments.concat(response.libraryDocumentList);
      const cursor = response.page.nextCursor;
      if (cursor !== undefined) {
        cursorQueryString = `&cursor=${cursor}`;
        done = Settings.devPageLimit >= 0 && i >= Settings.devPageLimit;
      }
      else
        done = true;

      this.logToConsole(`Loaded more than ${(i - 1) * pageSize} and at most ${i * pageSize} documents from the commercial account.`);
    }
    this.logToConsole(`Done loading. Loaded ${libraryDocuments.length} documents from the commercial account.`)

    /* Initalize documentIds. */
    const oldThis: MigrationConsoleComponent = this;
    libraryDocuments.forEach(function(doc: any) {
      oldThis.documentIds.push(doc.id);
    });
    
    /* Set up the FormArray that will be used to display the list of documents to the user. */
    this.populateDocForm(libraryDocuments); 
  }

  private documentIds: string[] = [];

  /* These two variables are not referenced in this file, but instead in migration.ts.
  In the future it would be better to have migrate() return values that should be used
  to update these two variables, rather than having migrate() actually perform said update
  by accessing a reference to this. */
  sourceBearerToken = '';
  sourceRefreshToken = '';
  destBearerToken = '';
  destRefreshToken = '';

  /* Fields input by user. */
  sourceComplianceLevel: 'commercial' | 'gov-stage' | 'gov-prod' = 'commercial';
  sourceOAuthClientId: string = '';
  sourceOAuthClientSecret: string = '';
  sourceLoginEmail: string = '';
  sourceShard: string = '';

  destComplianceLevel: 'commercial' | 'gov-stage' | 'gov-prod' = 'commercial';
  destOAuthClientId: string = '';
  destOAuthClientSecret: string = '';
  destLoginEmail: string = '';
  destShard: string = '';

  constructor(private formBuilder: FormBuilder,
              private sharerService: SharerService,
              private oAuthService: OAuthService, // migration.ts uses this instance's oAuthService
              private urlService: UrlService) { }

  async migrate(): Promise<any> {
    /* Get a list of all the indices cooresponding to documents that the user wants to upload. */
    let selectedDocs: string[] = [];
    const oldThis: MigrationConsoleComponent = this;
    let i = 0;
    this.documents.controls.forEach(function(group: any) {
      if (group.value.isSelected) {
        selectedDocs.push(oldThis.documentIds[i]);
      }
      i ++;
    });

    migrateAll(this, selectedDocs);
  }

  async ngOnInit() {
    /* See preload.ts for the definitions of the functions from "api". */

    /* Send a message to the Electron main process indicating that this ngOnInit() method has begun executing. */
    (<any> window).api.notifyIsConsoleInitStarted();
    
    /* When the Electron main process recieves the notification sent in the above, it sends a message back that,
    when recieved, results in the invocation of the below defined callback function. The callback function is aware
    of the URL that the user has just been redirected to. */
    const oldThis: MigrationConsoleComponent = this;
    (<any> window).api.onConsoleInitFinish(async function (event: any, redirectUrls: string[]) {
      const shared: Shared = oldThis.sharerService.getShared();

      /* Use the client IDs provided by the user to determine which redirect URL is returned by the login for the
      source account and which one is returned by the login for the destination account. */
      const sourceIndex: 0 | 1 = shared.loggedIn.indexOf('source') as 0 | 1;
      const destIndex: 1 | 0 = shared.loggedIn.indexOf('dest') as 1 | 0;
      const sourceRedirectUrl: string = redirectUrls[sourceIndex];
      const destRedirectUrl: string = redirectUrls[destIndex];

      /* Take the information embedded in the sourceRedirectUrl and use it alongside the source login credentials to update
      the source Bearer and refresh tokens. */
      let tokenResponse = await oldThis.oAuthLogIn(oldThis, shared.source, sourceRedirectUrl);
      oldThis.sourceComplianceLevel = shared.source.complianceLevel; oldThis.sourceShard = shared.source.shard;
      oldThis.sourceBearerToken = tokenResponse.accessToken; oldThis.sourceRefreshToken = tokenResponse.refreshToken;
      console.log('sourceBearerToken ', oldThis.sourceBearerToken);

      /* Do the same with the destRedirectUrl. */
      tokenResponse = await oldThis.oAuthLogIn(oldThis, shared.dest, destRedirectUrl);
      oldThis.destComplianceLevel = shared.dest.complianceLevel; oldThis.destShard = shared.dest.shard;
      oldThis.destBearerToken = tokenResponse.accessToken; oldThis.destRefreshToken = tokenResponse.refreshToken;
      console.log('destBearerToken ', oldThis.destBearerToken);
    });
  }

  async oAuthLogIn(oldThis: any, sourceOrDest: SharedInner, redirectUrl: string) {
    /* Get credentials from earlier. */
    oldThis.oAuthClientId = sourceOrDest.credentials.oAuthClientId;
    oldThis.oAuthClientSecret = sourceOrDest.credentials.oAuthClientSecret;
    oldThis.loginEmail = sourceOrDest.credentials.loginEmail;

    /* Use the credentials to get a "Bearer" token from OAuth. */
    const authGrant = oldThis.oAuthService.getAuthGrant(redirectUrl, sourceOrDest.initialOAuthState);
    return await oldThis.oAuthService.getToken(sourceOrDest.complianceLevel, sourceOrDest.shard, oldThis.oAuthClientId, oldThis.oAuthClientSecret, authGrant, Settings.redirectUri);
  }

  /* Helper functions. */

  async delay(seconds: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /* We should be able to use httpRequest from util/electron-functions.ts instead of this,
  but it seems that requestConfig.data isn't copied correctly (maybe not even copied at all)
  when requestConfig is passed from httpRequest() to the axios() call in electron/main.ts. */
  async httpRequestTemp(requestConfig: any): Promise<any> {
    return (await axios(requestConfig)).data;
  }
}
