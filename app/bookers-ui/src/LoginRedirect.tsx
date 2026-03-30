// import { useEffect } from 'react';
// import { useAuth } from './auth';

// export const LoginRedirect = () => {
//   const { isAuthenticated, loading } = useAuth();

//   useEffect(() => {
//     console.log("LoginRedirect - isAuthenticated:", isAuthenticated, "loading:", loading);
    
//     if (loading) return;
    
//     if (isAuthenticated) {
//       console.log("Authenticated, redirecting to dashboard");
//       window.location.href = '/bookers';
//     } else {
//       console.log("Not authenticated, redirecting to home");
//       window.location.href = '/';
//     }
//   }, [isAuthenticated, loading]);

//   return (
//     <div style={{ 
//       display: 'flex', 
//       justifyContent: 'center', 
//       alignItems: 'center', 
//       height: '100vh', 
//       background: '#020617', 
//       color: 'white' 
//     }}>
//       Processing login...
//     </div>
//   );
// };