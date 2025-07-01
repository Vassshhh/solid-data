import "./App.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./Dashboard";
import Login from "./Login";
import CameraKtp from "./KTPScanner";

import "./App.css";

// ✅ Komponen proteksi route
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/scan" element={<CameraKtp />} />
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
      </Routes>
    </div>
  );
}

export default App;
