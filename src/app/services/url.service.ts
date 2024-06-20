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

import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, Router, UrlSerializer, UrlTree } from '@angular/router';
import { Settings } from '../settings/settings';
import { httpRequest } from '../util/electron-functions';

@Injectable({providedIn: 'root'})
export class UrlService {
  constructor(private router: Router, private serializer: UrlSerializer) {}

  /* 
      Returns the base URI that is used to access the Adobe Sign API.
  */
  async getApiBaseUri(bearerToken: string = '', complianceLevel: 'commercial' | 'gov-stage' | 'gov-prod') {
    /* If the account is commercial, then the URI returned by this function depends on what shard (e.g. na1, na2, na3, na4)
    the account is on; we use an API call to determine the return value. */
    if (complianceLevel === 'commercial') {
      if (bearerToken === '')
        throw new Error('The empty string was passed as the "bearerToken" argument in a call to getApiBaseUri().');      
      
      const requestConfig = {
        'method': 'get',
        'url': 'https://api.na1.adobesign.com/api/rest/v6/baseUris',
        'headers': {Authorization: `Bearer ${bearerToken}`}
      };
      const response = (await httpRequest(requestConfig));
      let baseUri = response['apiAccessPoint'];
      baseUri = baseUri.substring(0, baseUri.length - 1) + "/api/rest/v6";
      return baseUri;
    }
    /* All gov accounts are on the na1 shard, so we can hardcode the returned value for gov accounts. */
    else { // complianceLevel.includes('gov')
      if (complianceLevel.includes('stage'))
        return 'https://api.na1.adobesignstage.us/api/rest/v6';
      else // complianceLevel.includes('prod') 
        return 'https://api.na1.adobesign.us/api/rest/v6';
    }
  }

  /* 
    When using this function for a commercial account (complianceLevel === 'commercial'), one will have to postpend either the string
    'public/oauth/v2' or a string of the form `/oauth/v2/${str}` to access typical OAuth endpoints. (The first option
    is only used for the authorization grant request.)
    
    When using this function for a gov account (complianceLevel.includes('gov')), one will have to postpend a string of 
    the form `/api/v1/${str}` to access typical OAuth endpoints.  
  */
  getOAuthBaseUri(shard = '', complianceLevel: 'commercial' | 'gov-stage' | 'gov-prod'): string {
    if (complianceLevel === 'commercial') { // For commercial, always use the prod endpoint
      if (shard === '')
        throw new Error('The empty string was passed as the "shard" argument in a call to getOAuthBaseUri().')  
      return `https://secure.${shard}.adobesign.com`;
    }
    else { // complianceLevel.includes('gov')
      if (complianceLevel.includes('stage'))
        return 'https://secure.na1.adobesignstage.us/api/gateway/adobesignauthservice';
      else // complianceLevel.includes('prod')
        return 'https://secure.na1.adobesign.us/api/gateway/adobesignauthservice';
    }
  }

  getOAuthAuthorizationGrantRequestEndpoint(complianceLevel: 'commercial' | 'gov-stage' | 'gov-prod') {
    if (complianceLevel === 'commercial')
      return '/public/oauth/v2';
    else // complianceLevel.includes('gov')
      return '/api/v1/authorize';
  }

  getOAuthTokenRequestEndpoint(complianceLevel: 'commercial' | 'gov-stage' | 'gov-prod') {
    if (complianceLevel === 'commercial')
      return '/oauth/v2/token';
    else // complianceLevel.includes('gov')
      return '/api/v1/token';
  }

  getOAuthRefreshRequestEndpoint(complianceLevel: 'commercial' | 'gov-stage' | 'gov-prod') {
    if (complianceLevel === 'commercial')
      return '/oauth/v2/refresh';
    else // complianceLevel.includes('gov')
      return '/oauth/v2/token';
  }

  getQueryParams(url: string): {[key: string]: any} {
    const queryParamString = url.substring(url.indexOf("?"));
    const tree: UrlTree = this.serializer.parse(queryParamString);
    return tree.queryParams;
  }

  getQueryString(queryParams: {[key: string]: any}) {
    const serializer: UrlSerializer = new DefaultUrlSerializer();
    const tree: UrlTree = this.router.createUrlTree([''], {'queryParams': queryParams});
    const queryParamsWithSlash: string = serializer.serialize(tree);
    return queryParamsWithSlash.substring(1, queryParamsWithSlash.length); // remove the / at the beginning  
  }
}