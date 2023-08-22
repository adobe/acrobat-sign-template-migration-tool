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
// import {getApiBaseUriFedRamp, getOAuthBaseUri, getProxyBaseUrl} from './src/util/url-getter';
// import {Settings} from './src/app/settings/settings';

module.exports = [
   {
      /* The double asterix ** matches paths of the form /oauth-api/x1/x2/.../xn; a single asterix * would only
      match paths of the form /oauth-api/x1. */
      context: '/oauth-api/**',
      target: 'https://secure.na1.adobesignstage.us/api/gateway/adobesignauthservice', // getOAuthBaseUri(Settings.inDevelopment, false)
      changeOrigin: true,
      secure: false,
      /* This pathRewrite option causes '/oauth-api' to be deleted from the path before the concatenation (target + path) is formed. */
      pathRewrite: {'^/oauth-api': ''}
   },
   {
      context: '/pdf-api/**',
      target: 'https://secure.na4.adobesign.com/document/cp', // getPdfLibraryBaseUri(Settings.inDevelopment, false)
      changeOrigin: true,
      secure: false,
      pathRewrite: {'^/pdf-api': ''}
   },
   {
      context: '/fedramp-api/**',
      target: 'https://api.na1.adobesignstage.us/api/rest/v6', // getApiBaseUriFedRamp(Settings.inDevelopment, false)
      changeOrigin: true,
      secure: false,
      pathRewrite: {'^/fedramp-api': ''}
   },
   {
      context: '/commercial-api/**',
      target: 'https://api.na4.adobesign.com/api/rest/v6', // getApiBaseUriCommercial(http, bearerAuth, Settings.inDevelopment, false)
      changeOrigin: true,
      secure: false,
      pathRewrite: {'^/commercial-api': ''}
   }
];
