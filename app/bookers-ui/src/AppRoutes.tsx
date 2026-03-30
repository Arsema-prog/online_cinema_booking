import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth";
import HomePage from "./pages/HomePage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { BookersLayout } from "./layout/BookersLayout";
import { MoviesPage } from "./pages/MoviesPage";
import { CinemaMoviesPage } from "./pages/CinemaMoviesPage";
import { BookingPage } from "./pages/BookingPage";
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { BookingCancelPage } from './pages/BookingCancelPage';
import { SnackSelectionPage } from './pages/SnackSelectionPage';
import { PaymentPage } from './pages/PaymentPage';
import { BookingHistoryPage } from "./pages/BookingHistoryPage";
  import { MovieScreeningsPage }  from "./pages/MovieScreeningsPage"  
const LoadingScreen = () => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100vh", 
    background: "#020617", 
    color: "white" 
  }}>
    Loading...
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegistrationPage />} />
      
      <Route path="/bookers/booking/success" element={
        <ProtectedRoute>
          <BookingSuccessPage />
        </ProtectedRoute>
      } />
      <Route path="/bookers/booking/cancel" element={
        <ProtectedRoute>
          <BookingCancelPage />
        </ProtectedRoute>
      } />
      <Route path="/bookers/snacks" element={
  <ProtectedRoute>
    <SnackSelectionPage />
  </ProtectedRoute>
} />

<Route path="/bookers/payment" element={
  <ProtectedRoute>
    <PaymentPage />
  </ProtectedRoute>
} />

      {/* Protected Bookers Routes */}
      <Route 
        path="/bookers" 
        element={
          <ProtectedRoute>
            <BookersLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MoviesPage />} />
        <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:movieId" element={<MovieScreeningsPage />} /> 
        <Route path="cinemas/:cinemaId/movies" element={<CinemaMoviesPage />} />
        <Route path="booking/:screeningId" element={<BookingPage />} />
        <Route path="history" element={<BookingHistoryPage />} />
      </Route>
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};