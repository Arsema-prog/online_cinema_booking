import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BranchesPage from './pages/BranchesPage';
import MoviesPage from './pages/MoviesPage';
import ScreensPage from './pages/ScreensPage';
import ScreeningsPage from './pages/ScreeningsPage';
import UsersPage from './pages/UsersPage';
import RulesPage from './pages/RulesPage';
import SnacksPage from './pages/SnacksPage';
import TicketsPage from './pages/TicketsPage';
import TicketValidationRedirect from './components/TicketValidationRedirect';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import LandingPage from './pages/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/validate-ticket',
    element: <TicketValidationRedirect />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { 
            path: 'dashboard', 
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                <DashboardPage />
              </RoleGuard>
            )
          },
          {
            path: 'branches',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <BranchesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'movies',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
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
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
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
          {
            path: 'rules',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <RulesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'snacks',
            element: (
              <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                <SnacksPage />
              </RoleGuard>
            ),
          },
          {
            path: 'tickets',
            element: (
              <RoleGuard allowedRoles={['ADMIN']}>
                <TicketsPage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);