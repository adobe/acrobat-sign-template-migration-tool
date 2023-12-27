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

import {Injectable} from '@angular/core';
import {getRandomId} from '../util/random';
import {httpRequest} from '../util/electron-functions';
import { UrlService } from './url.service';

export interface I_OAuthGrantRequest {
    url: string;
    initialOAuthState: string;
}

@Injectable({providedIn: 'root'})
export class OAuthService {
  constructor(private urlService: UrlService) { }

  /* 
    Returns a URL which is an "authorizaton grant request". When the user visits this URL,
    they are effectively requesting an authorization grant.

    Also returns a randomly generated state associated with the authorizaton grant request.
    
    Inputs:
      - redirectUri is the URI that the user should be redirected to once they have visited the URL
      that is the authorizaton grant request
      - env must be such that env.toLowerCase() is either 'commercial' or 'gov'
  */
  
  getOAuthGrantRequest(sourceOrDest: 'source' | 'dest', complianceLevel: 'commercial' | 'gov',
    shard = '', clientId: string, redirectUri: string, loginEmail: string): I_OAuthGrantRequest {
    const state = getRandomId();
    const scope = this.getOAuthScopeString(sourceOrDest, complianceLevel);

    /* Build the string of query params that make up part of the authorizaton grant request. */
    const queryParamString = this.urlService.getQueryString(
      {  
        'client_id' : clientId,
        'response_type' : 'code',
        'redirect_uri' : redirectUri,
        'scope' : scope,
        'state' : state,
        'login_hint' : loginEmail
      }
    );  

    /* Return the authorizaton grant request and the randomly generated state associated with it. */
    return {
      'url': this.urlService.getOAuthBaseUri(shard, complianceLevel) + this.urlService.getOAuthAuthorizationGrantRequestEndpoint(complianceLevel) + queryParamString,
      'initialOAuthState': state
    };  
  }

  /*
    Inputs:
      - authGrantResponse is a URL whose query params encode the response to the request for an authorization grant.
      - initialOAuthState is the state that is sent as a part of the authorization grant request. This function needs to know
      initialOAuthState so that it can compare it to authGrantResponse's initialOAuthState and thus verify that
      the server sending authGrantResponse is not a malicous actor pretending to be the authorizaton server.  

    Returns a unique string that is the "authorization grant". This authorizaton grant is used to
    request more tokens (access tokens, ID tokens, or refresh tokens).
  */
  getAuthGrant(authGrantResponse: string, initialOAuthState: string): string {
    const queryParams = this.urlService.getQueryParams(authGrantResponse);

    /* If the authGrantResponse indicates an error, throw an error. */
    if (queryParams.hasOwnProperty('error')) {
      const errorMessage = 'An erroneous request was made to the OAuth /authorize endpoint.\n' +
      `Error: ${queryParams['error']}\nError description: ${queryParams['error_description']}`;
      throw new Error(errorMessage);
    }
    /* If the authGrantResponse indicates no errors, check that the server sending the authorizaton grant is legitimate.
    If it is, return the authorizaton grant. */
    else if (queryParams.hasOwnProperty('code')) {
      const code: string = queryParams['code'];
      const state: string = queryParams['state'];

      if (state !== initialOAuthState) {
        throw new Error(`The state recieved from the server claiming to be authorization server does not 
        match initial state passed to the authorization server.`);
      }

      return code;
    }
    else
      throw new Error('The authorization grant URL does not contain a "code" or an "error" query param.');
  }

  async getToken(complianceLevel: 'commercial' | 'gov', shard = '', clientId: string,
                 clientSecret: string, authGrant: string, redirectUri: string): Promise<any> {
    
    let requestConfig: any = {
      'method': 'post',
      'url': this.urlService.getOAuthBaseUri(shard, complianceLevel) + this.urlService.getOAuthTokenRequestEndpoint(complianceLevel),
      'headers': {'Content-Type': 'application/x-www-form-urlencoded'}
    };

    /* Whether we need to pass arguments as part of the request body or as query params depends
    on whether the account is commercial or gov. */
    const args = {
      'client_id' : clientId,
      'client_secret' : clientSecret,
      'grant_type' : 'authorization_code',
      'code' : authGrant,
      'redirect_uri' : redirectUri
    };

    if (complianceLevel === 'commercial')
      requestConfig.data = args; // request body
    else // complianceLevel === 'gov'
      requestConfig.params = args; // query params

    const response = (await httpRequest(requestConfig));
    return this.handleTokenEndpointErrorsAndReturn(response);
  }

  async refreshToken(complianceLevel: 'commercial' | 'gov', shard = '', 
  clientId: string, clientSecret: string, refreshToken: string): Promise<any> {
    let requestConfig: any = {
      'method': 'post',
      'url': this.urlService.getOAuthBaseUri(shard, complianceLevel) + this.urlService.getOAuthRefreshRequestEndpoint(complianceLevel),
      'headers': {'Content-Type': 'application/x-www-form-urlencoded'}
    };

    /* Whether we need to pass arguments as part of the request body or as query params depends
    on whether the account is commercial or gov. */
    const args = {
      'client_id' : clientId,
      'client_secret' : clientSecret,
      'grant_type' : 'refresh_token',
      'refresh_token': refreshToken
    };

    if (complianceLevel === 'commercial')
      requestConfig.data = args; // pass args in request body
    else // complianceLevel === 'gov'
      requestConfig.params = args; // pass args as query params

    const response = (await httpRequest(requestConfig));
    return this.handleTokenEndpointErrorsAndReturn(response);
  }

  /* Helper functions. */
  getOAuthScopeString(sourceOrDest: 'source' | 'dest', complianceLevel: 'commercial' | 'gov'): string {
    if (sourceOrDest === 'source') {
      if (complianceLevel === 'commercial')
        return 'library_read:self';
      else { // complianceLevel == 'gov'
        return 'library_read';
      }
    }
    else { // sourceOrDest === 'dest'
      if (complianceLevel === 'commercial')
        return 'library_write:self';
      else // complianceLevel === 'gov'
        /* If permissions cooresponding to {the scope string returned by this function} are granted 
        by the server, then, including 'offline_access' in said scope string enables the request of refresh tokens.
        Refresh tokens cannot be requested in the gov environment unless this 'offline_access' has been
        approved by the server. */
        return 'library_write offline_access';
    }
  }

  handleTokenEndpointErrorsAndReturn(tokenResponse: any) {
    if (tokenResponse.hasOwnProperty('error')) {
      const errorMessage = 'An erroneous request was made to the OAuth /token endpoint.\n' +
      `Error: ${tokenResponse.error}\nError description: ${tokenResponse.error_description}`;
      throw new Error(errorMessage);
    }
    else if (tokenResponse.hasOwnProperty('access_token')) {
      if (tokenResponse.token_type !== "Bearer")
        throw new Error(`The response object from the OAuth /token endpoint contains an "access_token", but the "token_type" is "${tokenResponse.token_type}" instead of Bearer".`);
      
      return {'accessToken': tokenResponse.access_token, 'refreshToken': tokenResponse.refresh_token};
    }
    else
      throw new Error('The response object from the OAuth /token endpoint does not contain a "access_token" or an "error".');
  }
}
