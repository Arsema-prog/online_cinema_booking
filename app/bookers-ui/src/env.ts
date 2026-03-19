export const env = {
  apiGatewayUrl: (import.meta as any).env.VITE_API_GATEWAY_URL as string | undefined,
  supportServiceUrl: (import.meta as any).env.VITE_SUPPORT_SERVICE_URL as string | undefined,
  coreServiceUrl: (import.meta as any).env.VITE_CORE_SERVICE_URL as string | 'http://localhost:8081',
  bookingServiceUrl: (import.meta as any).env.VITE_BOOKING_SERVICE_URL as string | undefined,
  keycloakUrl: (import.meta as any).env.VITE_KEYCLOAK_URL as string,
  keycloakRealm: (import.meta as any).env.VITE_KEYCLOAK_REALM as string,
  keycloakClientId: (import.meta as any).env.VITE_KEYCLOAK_CLIENT_ID as string,
  bookerHomePath: "/bookers",
  backofficeHomePath: "/backoffice"
};

