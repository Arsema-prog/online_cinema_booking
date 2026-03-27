import axios, { type AxiosInstance } from "axios"
import { env } from "../../env"

let accessTokenGetter: (() => string | undefined) | null = null

export const setAccessTokenGetter = (getter: () => string | undefined) => {
 accessTokenGetter = getter
}

export const apiClient: AxiosInstance = axios.create({
 baseURL: env.apiGatewayUrl,
 timeout: 10000,
})

apiClient.interceptors.request.use((config) => {

 if (accessTokenGetter) {
  const token = accessTokenGetter()

  if (token) {
   console.log("[apiClient] Token found! Setting Authorization header. length:", token.length);
   if (config.headers.set) {
    config.headers.set('Authorization', `Bearer ${token}`)
   } else {
    config.headers.Authorization = `Bearer ${token}`
   }
  } else {
   console.log("[apiClient] No token available! accessTokenGetter is:", !!accessTokenGetter);
  }
 } else {
  console.log("[apiClient] accessTokenGetter is not set!");
 }

 return config
})