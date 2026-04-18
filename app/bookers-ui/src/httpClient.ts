import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { env } from "./env";

let accessTokenGetter: (() => string | undefined) | null = null;

export const setAccessTokenGetter = (getter: () => string | undefined) => {
  accessTokenGetter = getter;
};

export const getAccessTokenGetter = () => {
  return accessTokenGetter || (() => undefined);
};

const createClient = (baseURL?: string, name?: string): AxiosInstance => {
  console.log(`Creating ${name || "client"} with baseURL: ${baseURL}`);

  const instance = axios.create({
    baseURL,
    timeout: 20000
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
    console.log(`${name || "client"} - ${config.method?.toUpperCase()} ${fullUrl}`);

    const method = (config.method || "get").toLowerCase();
    const requestPath = config.url || "";
    const isPublicCoreGet =
      method === "get" && requestPath.startsWith("/api/v1/core/");

    if (accessTokenGetter) {
      const token = accessTokenGetter();
      if (token && !isPublicCoreGet) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else if (isPublicCoreGet) {
        // Public core read endpoints should not receive stale/expired bearer tokens,
        // otherwise resource-server auth can still return 401 before permitAll.
        config.headers.delete("Authorization");
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      console.log(`${name || "client"} - Response from ${response.config.url}:`, response.status);
      return response;
    },
    (error) => {
      console.error(`${name || "client"} - Error from ${error.config?.url}:`, {
        status: error.response?.status,
        code: error.code,
        message: error.message
      });

      if (error.response) {
        const { status, data } = error.response;
        const message =
          typeof data === "string"
            ? data
            : data?.message || `Request failed with status ${status}`;
        return Promise.reject({ ...error, normalizedMessage: message, status });
      }

      const networkMessage = error?.message || "Network request failed";
      return Promise.reject({ ...error, normalizedMessage: networkMessage, status: undefined });
    }
  );

  return instance;
};

console.log("Environment values:", {
  apiGatewayUrl: env.apiGatewayUrl
});

export const apiClient = createClient(env.apiGatewayUrl, "apiClient");
export default apiClient;
