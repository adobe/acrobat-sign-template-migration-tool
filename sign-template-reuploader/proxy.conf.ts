// import {getApiBaseUriFedRamp, getOAuthBaseUri} from './src/util/url-getter';
// import {Settings} from './src/app/settings/settings';

module.exports = [
   {
      /* The double asterix ** matches paths of the form /oauth-api/x1/x2/.../xn; a single asterix * would only
      match paths of the form /oauth-api/x1. */
      context: '/oauth-api/**',
      target: 'https://secure.na1.adobesignstage.us/api/gateway/adobesignauthservice', // getOAuthBaseUri(Settings.inDevelopent)
      changeOrigin: true,
      secure: false,
      /* This pathRewrite option causes '/oauth-api' to be deleted from the path before the concatenation (target + path) is formed. */
      pathRewrite: {'^/oauth-api': ''}
   },
   {
      context: '/doc-pdf-api/**',
      target: 'https://secure.na4.adobesign.com/document/cp', //hardcoded for now
      changeOrigin: true,
      secure: false,
      pathRewrite: {'^/doc-pdf-api': ''}
   },
   {
      context: 'fedramp-api',
      target: 'https://api.na1.adobesignstage.us/api/rest/v6/', // getApiBaseUriFedRamp(Settings.inDevelopment)
      changeOrigin: true,
      secure: false,
      pathRewrite: {'^/fedramp-api': ''}
   }
];