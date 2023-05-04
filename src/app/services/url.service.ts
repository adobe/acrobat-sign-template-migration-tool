import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, Router, UrlSerializer, UrlTree } from '@angular/router';
import { Settings } from '../settings/settings';
import { httpRequest } from '../util/electron-functions';

@Injectable({providedIn: 'root'})
export class UrlService {
  constructor(private router: Router, private serializer: UrlSerializer) {}

  /* 
    - apiEnv needs to be specified if and only if complianceLevel === 'fedramp'

      Returns the base URI that is used to access the Adobe Sign API.
  */
  async getApiBaseUri(bearerToken: string = '', complianceLevel: 'commercial' | 'fedramp', apiEnv: 'stage' | 'prod' = Settings.apiEnv) {
    /* If the account is commercial, then the URI returned by this function depends on what shard (e.g. na1, na2, na3, na4)
    the account is on; we use an API call to determine the return value. */
    if (complianceLevel === 'commercial') {
      if (bearerToken === '')
        throw new Error('The empty string was passed as the "bearerAuth" argument in a call to getApiBaseUri().');      
      
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
    /* All FedRamp accounts are on the na1 shard, so we can hardcode the returned value for FedRamp accounts. */
    else { // complianceLevel === 'fedramp'
      if (apiEnv === 'stage')
        return 'https://api.na1.adobesignstage.us/api/rest/v6';
      else // apiEnv === 'prod' 
        return 'https://api.na1.adobesign.us/api/rest/v6';
    }
  }

  /* 
    When using this function for a commercial account (complianceLevel === 'commercial'), one will have to postpend either the string
    'public/oauth/v2' or a string of the form `/oauth/v2/${str}` to access typical OAuth endpoints. (The first option
    is only used for the authorization grant request.)
    
    When using this function for a FedRamp account (complianceLevel === 'fedramp'), one will have to postpend a string of 
    the form `/api/v1/${str}` to access typical OAuth endpoints.  
  */
  getOAuthBaseUri(shard = '', complianceLevel: 'commercial' | 'fedramp', apiEnv: 'stage' | 'prod' = Settings.apiEnv): string {
    if (complianceLevel === 'commercial') { // For commercial, always use the prod endpoint
      if (shard === '')
        throw new Error('The empty string was passed as the "shard" argument in a call to getOAuthBaseUri().')  
      return `https://secure.${shard}.adobesign.com`;
    }
    else { // complianceLevel === 'fedramp'
      if (apiEnv === 'stage')
        return 'https://secure.na1.adobesignstage.us/api/gateway/adobesignauthservice';
      else // apiEnv === 'prod'
        return 'https://secure.na1.adobesign.us/api/gateway/adobesignauthservice';
    }
  }

  getOAuthAuthorizationGrantRequestEndpoint(complianceLevel: 'commercial' | 'fedramp') {
    if (complianceLevel === 'commercial')
      return '/public/oauth/v2';
    else // complianceLevel === 'fedramp'
      return '/api/v1/authorize';
  }

  getOAuthTokenRequestEndpoint(complianceLevel: 'commercial' | 'fedramp') {
    if (complianceLevel === 'commercial')
      return '/oauth/v2/token';
    else // complianceLevel === 'fedramp'
      return '/api/v1/token';
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