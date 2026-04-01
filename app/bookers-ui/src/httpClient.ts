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

    if (accessTokenGetter) {
      const token = accessTokenGetter();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
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
  supportServiceUrl: env.supportServiceUrl,
  coreServiceUrl: env.coreServiceUrl,
  apiGatewayUrl: env.apiGatewayUrl,
  bookingServiceUrl: env.bookingServiceUrl
});

export const coreClient = createClient(env.coreServiceUrl, "coreClient");
export const bookingClient = createClient(env.bookingServiceUrl, "bookingClient");
export const supportClient = createClient(env.supportServiceUrl, "supportClient");
