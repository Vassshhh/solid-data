<<<<<<< HEAD
import { Routes, Route } from "react-router-dom";
=======
import "./App.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./Dashboard";

import Login from "./Login";
>>>>>>> b9b4e4c859bd8face05c8d89d7f0c914d9e84a04
import CameraKtp from "./KTPScanner";
import Dashboard from "./Dashboard";

import "./App.css";

// ✅ Komponen proteksi route
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
<<<<<<< HEAD
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<CameraKtp />} />
      </Routes>
=======
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<CameraKtp />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
        </Routes>
      </BrowserRouter>
>>>>>>> b9b4e4c859bd8face05c8d89d7f0c914d9e84a04
    </div>
  );
}

export default App;
