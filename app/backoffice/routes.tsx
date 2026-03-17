import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { BackofficeLayout } from "./layout/BackofficeLayout";
import { MovieListPage } from "./pages/MovieListPage";
import { MovieFormPage } from "./pages/MovieFormPage";
import { UserListPage } from "./pages/UserListPage";

export const BackofficeRoutes: React.FC = () => {
  return (
    <BackofficeLayout>
      <Routes>
        <Route path="/" element={<Navigate to="movies" replace />} />
        <Route path="movies" element={<MovieListPage />} />
        <Route path="movies/new" element={<MovieFormPage />} />
        <Route path="movies/:id/edit" element={<MovieFormPage />} />
        <Route path="users" element={<UserListPage />} />
      </Routes>
    </BackofficeLayout>
  );
};

