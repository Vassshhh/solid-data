import "./App.css";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ShowImage from "./ShowImage";
import SuccessPage from "./SuccessPage";
import Dashboard from "./Dashboard";
import LoginPage from "./Login";
import Expetation from "./DataTypePage";
import CameraKtp from "./KTPScanner";
import Profile from "./ProfileTab";
import PickOrganization from "./PickOrganization"; // <-- import baru

// LandingPage.js
const LandingPage = () => {
  return (
    <div>
      <h1>Selamat datang di Aplikasi Kami</h1>
      {/* Tambahkan konten lainnya sesuai kebutuhan */}
    </div>
  );
};

// Komponen untuk melindungi route dengan token
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Simpan token dari query parameter ke localStorage (jika ada)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);

      // Bersihkan token dari URL setelah disimpan
      const newSearch = new URLSearchParams(location.search);
      newSearch.delete("token");

      // Replace URL tanpa query token
      navigate(
        {
          pathname: location.pathname,
          search: newSearch.toString(),
        },
        { replace: true }
      );
    }
  }, [location, navigate]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Halaman pilih organisasi (wajib setelah login) */}
        <Route
          path="/pickorganization"
          element={<ProtectedRoute element={<PickOrganization />} />}
        />

        <Route path="/scan" element={<CameraKtp />} />
        <Route path="/success" element={<SuccessPage />} />

        {/* Jika user ke /dashboard tanpa memilih organisasi, arahkan ke /pickorganization */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Navigate to="/pickorganization" />} />}
        />

        {/* Dashboard spesifik organisasi */}
        <Route
          path="/dashboard/:organization"
          element={<ProtectedRoute element={<Dashboard />} />}
        />

        <Route
          path="/dashboard/:organization/scan"
          element={<ProtectedRoute element={<Expetation />} />}
        />

        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
