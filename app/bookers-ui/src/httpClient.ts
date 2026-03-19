import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { env } from "./env";

let accessTokenGetter: (() => string | undefined) | null = null;

export const setAccessTokenGetter = (getter: () => string | undefined) => {
  accessTokenGetter = getter;
};

const createClient = (baseURL?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessTokenGetter) {
      const token = accessTokenGetter();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response) {
        const { status, data } = error.response;
        const message =
          typeof data === "string"
            ? data
            : data?.message || `Request failed with status ${status}`;
        return Promise.reject({ ...error, normalizedMessage: message, status });
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const coreClient = createClient(env.coreServiceUrl || env.apiGatewayUrl);
export const bookingClient = createClient(env.bookingServiceUrl);
export const supportClient = createClient(env.supportServiceUrl);