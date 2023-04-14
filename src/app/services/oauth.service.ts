import {Injectable} from '@angular/core';
import {UrlTree, Router, UrlSerializer} from '@angular/router';
import {getRandomId} from '../util/random';
import {httpRequest} from '../util/electron-functions';
import {getOAuthAuthorizationGrantRequestEndpoint, getOAuthBaseUri, getOAuthTokenRequestEndpoint} from '../util/url-getter';

export interface I_OAuthGrantRequest {
    url: string;
    initialOAuthState: string;
}

@Injectable({providedIn: 'root'})
export class OAuthService {
  constructor(private router: Router,
              private serializer: UrlSerializer)
  { }

  /* 
    Returns a URL which is an "authorizaton grant request". When the user visits this URL,
    they are effectively requesting an authorization grant.

    Also returns a randomly generated state associated with the authorizaton grant request.
    
    Inputs:
      - redirectUri is the URI that the user should be redirected to once they have visited the URL
      that is the authorizaton grant request
      - env must be such that env.toLowerCase() is either 'commercial' or 'fedramp'
  */
  
  getOAuthGrantRequest(sourceOrDest: 'source' | 'dest', complianceLevel: 'commercial' | 'fedramp',
   shard = '', clientId: string, redirectUri: string, loginEmail: string): I_OAuthGrantRequest {
    const state = getRandomId();
    const scope = this.getOAuthScopeString(sourceOrDest, complianceLevel);

    /* Build the string of query params that make up part of the authorizaton grant request. */
    const tree: UrlTree = this.router.createUrlTree([''],
    {
      'queryParams':
      {
        'client_id' : clientId,
        'response_type' : 'code',
        'redirect_uri' : redirectUri,
        'scope' : scope,
        'state' : state,
        'login_hint' : loginEmail
      }
    });
    let queryParams: string = this.serializer.serialize(tree);
    queryParams = queryParams.substring(1, queryParams.length); // remove the / at the beginning    

    /* Return the authorizaton grant request and the randomly generated state associated with it. */
    return {
      'url': getOAuthBaseUri(shard, complianceLevel) + getOAuthAuthorizationGrantRequestEndpoint(complianceLevel) + queryParams,
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
    /* Consider the query param string instead of the entire URL so that we can avoid
    parsing errors when the URL has the ? after a /, and is something like 
    https://migrationtool.com/?a1=a2&b1=b2 (as opposed to the more usual https://migrationtool.com?a1=a2&b1=b2). */
    const queryParamString = authGrantResponse.substring(authGrantResponse.indexOf("?"));
    const tree: UrlTree = this.serializer.parse(queryParamString);

    /* Handle errors. If no errors, check that the server sending the authorizaton grant is
    legitimate, and then return the authorizaton grant. */

    if (tree.queryParams.hasOwnProperty('error')) {
      const errorMessage = 'An erroneous request was made to the OAuth /authorize endpoint.\n' +
      `Error: ${tree.queryParams['error']}\nError description: ${tree.queryParams['error_description']}`;
      throw new Error(errorMessage);
    }
    else if (tree.queryParams.hasOwnProperty('code')) {
      const code: string = tree.queryParams['code'];
      const state: string = tree.queryParams['state'];

      if (state !== initialOAuthState) {
        throw new Error(`The state recieved from the server claiming to be authorization server does not 
        match initial state passed to the authorization server.`);
      }

      return code;
    }
    else
      throw new Error('The authorization grant URL does not contain a "code" or an "error" query param.');
  }

  async getToken(complianceLevel: 'commercial' | 'fedramp', shard = '', 
  clientId: string, clientSecret: string, authGrant: string, redirectUri: string): Promise<any> {
    const requestConfig = {
      'method': 'post',
      'url': getOAuthBaseUri(shard, complianceLevel) + getOAuthTokenRequestEndpoint(complianceLevel),
      'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
      'params':
       {
          'client_id' : clientId,
          'client_secret' : clientSecret,
          'grant_type' : 'authorization_code',
          'code' : authGrant,
          'redirect_uri' : redirectUri
       }
    };

    const response = (await httpRequest(requestConfig));
    return this.handleTokenEndpointErrorsAndReturn(response);
  }

  async refreshToken(complianceLevel: 'commercial' | 'fedramp', shard = '', 
  clientId: string, clientSecret: string, refreshToken: string): Promise<any> {
    const requestConfig = {
      'method': 'post',
      'url': getOAuthBaseUri(shard, complianceLevel) + getOAuthTokenRequestEndpoint(complianceLevel),
      'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
      'params':
      {
        'client_id' : clientId,
        'client_secret' : clientSecret,
        'grant_type' : 'refresh_token',
        'refresh_token': refreshToken
      }
    };

    const response = (await httpRequest(requestConfig));
    return this.handleTokenEndpointErrorsAndReturn(response);
  }

  /* Helper functions. */
  getOAuthScopeString(sourceOrDest: 'source' | 'dest', complianceLevel: 'commercial' | 'fedramp'): string {
    if (sourceOrDest === 'source') {
      if (complianceLevel === 'commercial')
        return 'library_read:account';
      else { // complianceLevel == 'fedramp'
        /* 'offline_access' is crucial. Instructs the POST to /token in getToken() to return a refresh token. */
        return 'library_read';
      }
    }
    else { // sourceOrDest === 'dest'
      if (complianceLevel === 'commercial')
        return 'library_read:account library_write:account agreement_write:account';
      else // complianceLevel == 'fedramp'
        return 'library_read library_write agreement_write offline_access';
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
