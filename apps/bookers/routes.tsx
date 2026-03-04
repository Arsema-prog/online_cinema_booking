import React from "react";
import { Route, Routes } from "react-router-dom";
import { BookersLayout } from "./layout/BookersLayout";
import { MoviesPage } from "./pages/MoviesPage";

export const BookersRoutes: React.FC = () => {
  return (
    <BookersLayout>
      <Routes>
        <Route path="/" element={<MoviesPage />} />
        <Route path="movies" element={<MoviesPage />} />
     </Routes>
    </BookersLayout>
  );
};

