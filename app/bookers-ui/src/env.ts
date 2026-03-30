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
  apiGatewayUrl: (import.meta as any).env.VITE_API_GATEWAY_URL as string | undefined,
  supportServiceUrl: (import.meta as any).env.VITE_SUPPORT_SERVICE_URL as string | undefined,
  coreServiceUrl: (import.meta as any).env.VITE_CORE_SERVICE_URL as string | 'http://localhost:8081',
  bookingServiceUrl: (import.meta as any).env.VITE_BOOKING_SERVICE_URL as string | undefined,
  keycloakUrl: (import.meta as any).env.VITE_KEYCLOAK_URL as string,
  keycloakRealm: (import.meta as any).env.VITE_KEYCLOAK_REALM as string,
  keycloakClientId: (import.meta as any).env.VITE_KEYCLOAK_CLIENT_ID as string,
  bookerHomePath: "/bookers"
};

console.log('🔧 Env loaded:', {
  supportServiceUrl: env.supportServiceUrl,
  coreServiceUrl: env.coreServiceUrl,
  keycloakUrl: env.keycloakUrl,
  keycloakRealm: env.keycloakRealm,
  keycloakClientId: env.keycloakClientId
});