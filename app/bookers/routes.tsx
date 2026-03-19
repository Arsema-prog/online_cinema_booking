import React from "react";
import { Route, Routes } from "react-router-dom";
import { BookersLayout } from "./layout/BookersLayout";
import { MoviesPage } from "./pages/MoviesPage";
import { BookingPage } from "./pages/BookingPage";

export const BookersRoutes: React.FC = () => {
  return (
    <BookersLayout>
      <Routes>
        <Route path="/" element={<MoviesPage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="booking/:showId" element={<BookingPage />} />
      </Routes>
    </BookersLayout>
  );
};

