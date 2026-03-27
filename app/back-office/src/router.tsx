import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BranchesPage from './pages/BranchesPage';
import MoviesPage from './pages/MoviesPage';
import ScreensPage from './pages/ScreensPage';
import ScreeningsPage from './pages/ScreeningsPage';
import UsersPage from './pages/UsersPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'branches',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <BranchesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'movies',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <MoviesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'screens',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <ScreensPage />
              </RoleGuard>
            ),
          },
          {
            path: 'screenings',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <ScreeningsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'users',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <UsersPage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);