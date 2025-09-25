export const keycloakConfig = {
  url: process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'https://auth.zenyaa.com',
  realm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'zinya_dev',
  clientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'main-ui',
  bypassAuth: process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true',
};

export const getKeycloakEndpoints = () => {
  const baseUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}`;
  
  return {
    discovery: `${baseUrl}/.well-known/openid_configuration`,
    authorization: `${baseUrl}/protocol/openid-connect/auth`,
    token: `${baseUrl}/protocol/openid-connect/token`,
    logout: `${baseUrl}/protocol/openid-connect/logout`,
    userinfo: `${baseUrl}/protocol/openid-connect/userinfo`,
  };
};

export const authConfig = {
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
  clientId: keycloakConfig.clientId,
  redirectUri: '', // Will be set dynamically
  additionalParameters: {},
  customHeaders: {},
};