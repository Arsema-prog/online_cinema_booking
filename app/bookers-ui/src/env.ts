// Type definition for Vite env
interface ImportMetaEnv {
  VITE_API_GATEWAY_URL?: string;
  VITE_SUPPORT_SERVICE_URL?: string;
  VITE_CORE_SERVICE_URL?: string;
  VITE_BOOKING_SERVICE_URL?: string;
  VITE_KEYCLOAK_URL?: string;
  VITE_KEYCLOAK_REALM?: string;
  VITE_KEYCLOAK_CLIENT_ID?: string;
}

const viteEnv = (import.meta as any).env as ImportMetaEnv;

export const env = {
  apiGatewayUrl: viteEnv.VITE_API_GATEWAY_URL,
  supportServiceUrl: viteEnv.VITE_SUPPORT_SERVICE_URL || 'http://localhost:8084',
  coreServiceUrl: viteEnv.VITE_CORE_SERVICE_URL || 'http://localhost:8081',
  bookingServiceUrl: viteEnv.VITE_BOOKING_SERVICE_URL || 'http://localhost:8082',
  keycloakUrl: viteEnv.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  keycloakRealm: viteEnv.VITE_KEYCLOAK_REALM || 'cinema-realm',
  keycloakClientId: viteEnv.VITE_KEYCLOAK_CLIENT_ID || 'bookers-ui',
  bookerHomePath: "/bookers",
  backofficeHomePath: "/backoffice"
};

console.log('🔧 Env loaded:', {
  supportServiceUrl: env.supportServiceUrl,
  coreServiceUrl: env.coreServiceUrl,
  keycloakUrl: env.keycloakUrl,
  keycloakRealm: env.keycloakRealm,
  keycloakClientId: env.keycloakClientId
});