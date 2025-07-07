import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ShowImage from "./ShowImage";

import Dashboard from "./Dashboard";
import Login from "./Login";
import CameraKtp from "./KTPScanner";
import Profile from "./ProfileTab";

// Komponen untuk melindungi route dengan token
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
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} />}
        />
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route
          path="/profile"
          element={<ProtectedRoute element={<Profile />} />}
        />
        <Route path="/:nik" element={<ShowImage />} />
      </Routes>
    </div>
  );
}

export default App;
