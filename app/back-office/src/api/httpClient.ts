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
   if (config.headers.set) {
    config.headers.set('Authorization', `Bearer ${token}`)
   } else {
    config.headers.Authorization = `Bearer ${token}`
   }
  }
 }

 return config
})
