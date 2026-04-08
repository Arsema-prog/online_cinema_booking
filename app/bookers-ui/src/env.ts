interface ImportMetaEnv {
  VITE_API_GATEWAY_URL?: string;
  VITE_KEYCLOAK_URL?: string;
  VITE_KEYCLOAK_REALM?: string;
  VITE_KEYCLOAK_CLIENT_ID?: string;
  VITE_BOOKER_HOME_PATH?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

const viteEnv = (import.meta as any).env as ImportMetaEnv;

export const env = {
  apiGatewayUrl: viteEnv.VITE_API_GATEWAY_URL ?? "http://localhost:8090",
  keycloakUrl: viteEnv.VITE_KEYCLOAK_URL ?? "http://localhost:8180",
  keycloakRealm: viteEnv.VITE_KEYCLOAK_REALM ?? "cinema-realm",
  keycloakClientId: viteEnv.VITE_KEYCLOAK_CLIENT_ID ?? "bookers-ui",
  bookerHomePath: viteEnv.VITE_BOOKER_HOME_PATH ?? "/bookers",
  stripePublishableKey: viteEnv.VITE_STRIPE_PUBLISHABLE_KEY ?? "pk_test_mock"
};
