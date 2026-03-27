import React, {
 createContext,
 useContext,
 useEffect,
 useState,
 useCallback,
 useRef
} from "react"

import Keycloak from "keycloak-js"
import { env } from "../../env"
import { setAccessTokenGetter } from "../api/httpClient"

interface AuthContextValue {

 keycloak: Keycloak | null
 isAuthenticated: boolean
 isLoading: boolean
 token?: string
 roles: string[]

 login: () => void
 logout: () => void
 hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const keycloak = new Keycloak({
 url: env.keycloakUrl,
 realm: env.keycloakRealm,
 clientId: env.keycloakClientId
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

 const [isAuthenticated, setIsAuthenticated] = useState(false)
 const [isLoading, setIsLoading] = useState(true)
 const [token, setToken] = useState<string>()
 const [roles, setRoles] = useState<string[]>([])
 const isInitRef = useRef(false)

 useEffect(() => {
  if (isInitRef.current) return
  isInitRef.current = true

  keycloak.init({
   onLoad: "check-sso",
   pkceMethod: "S256",
   checkLoginIframe: false
  }).then(auth => {

   setIsAuthenticated(auth)
   setToken(keycloak.token)

   const realmRoles =
    (keycloak.tokenParsed as any)?.realm_access?.roles ?? []

   setRoles(realmRoles)

   setAccessTokenGetter(() => keycloak.token)

  }).finally(() => {
   setIsLoading(false)
  })

  const interval = setInterval(() => {
   if (!keycloak.authenticated) return
   keycloak
    .updateToken(60)
    .then(refreshed => {
     if (!refreshed) return
     setToken(keycloak.token)
     const realmRoles =
      (keycloak.tokenParsed as any)?.realm_access?.roles ?? []
     setRoles(realmRoles)
     setAccessTokenGetter(() => keycloak.token)
    })
    .catch(() => {
     keycloak.logout({ redirectUri: window.location.origin })
    })
  }, 30000)

  return () => {
   clearInterval(interval)
  }

 }, [])

 const login = useCallback(() => {
  keycloak.login()
 }, [])

 const logout = useCallback(() => {
  keycloak.logout({
   redirectUri: window.location.origin
  })
 }, [])

 const hasRole = useCallback(
  (role: string) => roles.includes(role),
  [roles]
 )

 return (

  <AuthContext.Provider value={{
   keycloak,
   isAuthenticated,
   isLoading,
   token,
   roles,
   login,
   logout,
   hasRole
  }}>

   {children}

  </AuthContext.Provider>
 )
}

export const useAuth = () => {

 const context = useContext(AuthContext)

 if (!context)
  throw new Error("useAuth must be used within AuthProvider")

 return context
}