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

interface AuthUser {
 username?: string
 email?: string
 firstName?: string
 lastName?: string
}

interface TokenClaims {
 realm_access?: {
  roles?: string[]
 }
 preferred_username?: string
 email?: string
 given_name?: string
 family_name?: string
}

interface AuthContextValue {
 keycloak: Keycloak | null
 isAuthenticated: boolean
 isLoading: boolean
 token?: string
 roles: string[]
 user?: AuthUser

 login: () => void
 logout: () => void
 hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const keycloak = new Keycloak({
            url: 'http://localhost:8180',
            realm: 'cinema-realm',
            clientId: 'back-office'
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

 const [isAuthenticated, setIsAuthenticated] = useState(false)
 const [isLoading, setIsLoading] = useState(true)
 const [token, setToken] = useState<string>()
 const [roles, setRoles] = useState<string[]>([])
 const [user, setUser] = useState<AuthUser>()
 const isInitRef = useRef(false)

 const syncAuthState = useCallback(() => {
  const claims = keycloak.tokenParsed as TokenClaims | undefined

  setToken(keycloak.token)
  setRoles(claims?.realm_access?.roles ?? [])
  setUser({
   username: claims?.preferred_username,
   email: claims?.email,
   firstName: claims?.given_name,
   lastName: claims?.family_name,
  })
  setAccessTokenGetter(() => keycloak.token)
 }, [])

 useEffect(() => {
  if (isInitRef.current) return
  isInitRef.current = true

  keycloak.init({
   onLoad: "check-sso",
   silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
   pkceMethod: "S256",
  checkLoginIframe: false
  }).then(auth => {

   setIsAuthenticated(auth)
   syncAuthState()

  }).finally(() => {
   setIsLoading(false)
  })

  const interval = setInterval(() => {
   if (!keycloak.authenticated) return
   keycloak
   .updateToken(60)
    .then(refreshed => {
     if (!refreshed) return
     syncAuthState()
    })
    .catch(() => {
     keycloak.logout({ redirectUri: window.location.origin })
    })
  }, 30000)

  return () => {
   clearInterval(interval)
  }

 }, [syncAuthState])

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
   user,
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
