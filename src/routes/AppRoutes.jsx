import React from "react";
import { Routes, Route } from "react-router-dom";
import Menu from "../pages/Menu";
import Game from "../pages/Game";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/Menu" element={<Menu />} />
      <Route path="/Game" element={<Game />} />
    </Routes>
  );
};

export default AppRoutes;
