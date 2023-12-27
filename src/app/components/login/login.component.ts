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

import { Component, OnInit } from '@angular/core';
import { OAuthService } from '../../services/oauth.service';
import { Shared, SharerService } from '../../services/sharer.service';
import { Credentials } from '../../settings/credentials';
import { Settings } from '../../settings/settings';
import { loadUrl } from '../../util/electron-functions';
import { UrlService } from 'src/app/services/url.service';

/*
  ===================================================================
  Helpful wiki articles
  ===================================================================

  OAuth for commercial:
  https://secure.na1.adobesign.com/public/static/oauthDoc.jsp

  OAuth for gov:
  https://wiki.corp.adobe.com/pages/viewpage.action?spaceKey=~kmashint&title=Adobe+Acrobat+Sign+and+US+Gov+Cloud+-+FedRAMP+Moderate#AdobeAcrobatSignandUSGovCloudFedRAMPModerate-Authorize

  Commercial vs. gov:
  https://wiki.corp.adobe.com/display/ES/API+Application+Commercial+vs+Gov+Cloud
  
  ===================================================================

*/

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  /* Fields input by user. */
  _sourceComplianceLevel: string = 'commercial'; // hardcoded for now; later, use Reactive Forms to pull initial value from .html
  get sourceComplianceLevel(): 'commercial' | 'gov' {
    return this._sourceComplianceLevel as 'commercial' | 'gov';
  }

  _sourceOAuthClientId: string = '';
  get sourceOAuthClientId(): string {
    if (Settings.forceUseTestCredentials)
      return Credentials.sourceOAuthClientId;
    else
      return this._sourceOAuthClientId;
  }

  _sourceOAuthClientSecret: string = '';
  get sourceOAuthClientSecret(): string {
    if (Settings.forceUseTestCredentials)
      return Credentials.sourceOAuthClientSecret;
    else
      return this._sourceOAuthClientSecret;
  }
  
  _sourceLoginEmail: string = '';
  get sourceLoginEmail(): string {
    if (Settings.forceUseTestCredentials)
      return Credentials.sourceLoginEmail;
    else
      return this._sourceLoginEmail;
  }

  _sourceShard: string = '';
  get sourceShard(): string {
    if (this.sourceComplianceLevel === 'commercial')
      return this._sourceShard;
    else // this.sourceComplianceLevel === 'gov'
      return 'na1'; // there is currently only one shard for all gov accounts
  }

  _destComplianceLevel: string = 'commercial'; // hardcoded for now; later, use use Reactive Forms to pull initial value from .html
  get destComplianceLevel(): 'commercial' | 'gov' {
    return this._destComplianceLevel as 'commercial' | 'gov';
  }

  _destOAuthClientId: string = '';
  get destOAuthClientId(): string {
    if (Settings.forceUseTestCredentials)
      return Credentials.destOAuthClientId;
    else
      return this._destOAuthClientId;
  }

  _destOAuthClientSecret: string = '';
  get destOAuthClientSecret(): string {
    if (Settings.forceUseTestCredentials)
      return Credentials.destOAuthClientSecret;
    else
      return this._destOAuthClientSecret;
  }
  
  _destLoginEmail: string = '';  
  get destLoginEmail(): string {
    if (Settings.forceUseTestCredentials)
      return Credentials.destLoginEmail;
    else
      return this._destLoginEmail;
  }

  _destShard: string = '';
  get destShard(): string {
    if (this.destComplianceLevel === 'commercial')
      return this._destShard;
    else // this.destComplianceLevel === 'gov'
      return 'na1'; // there is currently only one shard for all gov accounts
  }

  /* Helper function for use in .html. A null check is not necessary all other times
  this sort of query is made. */
  loggedInSourceDestWithNullCheck(sourceOrDest: 'source' | 'dest'): boolean {
    const shared: Shared = this.sharerService.getShared();
    return (shared != null) && shared.loggedIn.includes(sourceOrDest);
  }

  constructor(private oAuthService: OAuthService, private sharerService: SharerService, private urlService: UrlService) { }
 
  async sourceLogin() {
    this.loginHelper('source', this.sourceComplianceLevel, this.sourceOAuthClientId, this.sourceOAuthClientSecret, this.sourceLoginEmail, this.sourceShard);
  }

  async destLogin() {
    this.loginHelper('dest', this.destComplianceLevel, this.destOAuthClientId, this.destOAuthClientSecret, this.destLoginEmail, this.destShard);
  }

  async loginHelper(sourceOrDest: 'source' | 'dest', complianceLevel: 'commercial' | 'gov', oAuthClientId: string, oAuthClientSecret: string, loginEmail: string, shard: string) {
    /* Get the URL, the "authorization grant request", that the user must be redirected to in order to log in.*/
    const authGrantRequest = this.oAuthService.getOAuthGrantRequest(sourceOrDest, complianceLevel, shard, oAuthClientId, Settings.redirectUri, loginEmail);

    /* Store information that the console UI needs to know in the Shared object. */
    const temp: Shared = this.sharerService.getShared() == null ? new Shared() : this.sharerService.getShared();
    
    /* Add either 'source' or 'dest' to the 'loggedIn' array so as to record which of the source and dest accounts
    have been logged into, and to record the order in which the logins occured. */
    temp.loggedIn.push(sourceOrDest);
    
    /* Store other information that the console UI component needs to know, such as the login credentials for 
    the source or dest account. */
    temp[sourceOrDest] = {
      complianceLevel: complianceLevel,
      initialOAuthState: authGrantRequest.initialOAuthState,
      credentials: {
        oAuthClientId: oAuthClientId,
        oAuthClientSecret: oAuthClientSecret,
        loginEmail: loginEmail
      },
      shard: shard
    };
    this.sharerService.setShared(temp);
  
    /* Redirect the user to the URL that is the authGrantRequest. */
    await loadUrl(authGrantRequest.url);
  }

  async ngOnInit(): Promise<any> {

  }

  /* Helper function used in login.component.html. */
  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}