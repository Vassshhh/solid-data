import React, { useState, useRef, useEffect } from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
// Pastikan Anda sudah menginstal Recharts: npm install recharts
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Contoh Recharts

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("officer");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState({});
  const [totalFilesSentToday, setTotalFilesSentToday] = useState(0);
  const [totalFilesSentMonth, setTotalFilesSentMonth] = useState(0);
  const [totalFilesSentOverall, setTotalFilesSentOverall] = useState(0);
  const [officerPerformanceData, setOfficerPerformanceData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    const verifyTokenAndFetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(
          "https://bot.kediritechnopark.com/webhook/dashboard/psi",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data[0].payload.username) {
          throw new Error("Unauthorized");
        }

        setUser(data[0].payload);

        // Pastikan API Anda mengembalikan data ini, contoh:
        // data[0].payload.stats = { today: 120, month: 2500, overall: 15000 };
        // data[0].payload.officerPerformance = [{ name: "Budi", filesSent: 50 }, { name: "Ani", filesSent: 70 }];

        if (data[0].payload.stats) {
          setTotalFilesSentToday(data[0].payload.stats.today);
          setTotalFilesSentMonth(data[0].payload.stats.month);
          setTotalFilesSentOverall(data[0].payload.stats.overall);
        }

        if (data[0].payload.officerPerformance) {
          setOfficerPerformanceData(data[0].payload.officerPerformance);
        }
      } catch (error) {
        console.error("Token tidak valid:", error.message);
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    };

    verifyTokenAndFetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const handleAddOfficer = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "https://bot.kediritechnopark.com/webhook/add-officer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username,
            password,
            role: selectedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal menambahkan officer");
      }

      setSuccessMessage("Officer berhasil ditambahkan");
      setUsername("");
      setPassword("");
      setSelectedRole("officer");
      setErrorMessage("");
      // Pertimbangkan untuk memuat ulang data performa jika penambahan officer baru mempengaruhi grafik
    } catch (error) {
      setErrorMessage(error.message || "Gagal menambahkan officer");
      setSuccessMessage("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <div className={styles.logoAndTitle}>
          <img src="/dermalounge.jpg" alt="Bot Avatar" />
          <h1 className={styles.h1}>PSI Dashboard</h1>
        </div>

        <div className={styles.dropdownContainer} ref={menuRef}>
          <span className={styles.userDisplayName}>
            {user.username || "Guest"}
          </span>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={styles.dropdownToggle}
            aria-expanded={isMenuOpen ? "true" : "false"} /* Aksesibilitas */
            aria-haspopup="true" /* Aksesibilitas */
          >
            ☰
          </button>
          {isMenuOpen && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsMenuOpen(false);
                }} /* Tutup menu setelah klik */
                className={styles.dropdownItem}
              >
                Profile
              </button>
              <button
                onClick={() => {
                  navigate("/scan");
                  setIsMenuOpen(false);
                }} /* Tutup menu setelah klik */
                className={styles.dropdownItem}
              >
                Scan
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }} /* Tutup menu setelah klik */
                className={styles.dropdownItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Summary Cards */}
        <div className={styles.summaryCardsContainer}>
          <div className={styles.summaryCard}>
            <h3>Total Hari Ini</h3>
            <p>{totalFilesSentToday}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Bulan Ini</h3>
            <p>{totalFilesSentMonth}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Keseluruhan</h3>
            <p>{totalFilesSentOverall}</p>
          </div>
        </div>

        {/* Grid for Form (Admin) and Chart (Admin & Officer) */}
        <div className={styles.dashboardGrid}>
          {user.role === "admin" /* Render form hanya jika admin */ && (
            <div className={styles.formSection}>
              <h2>Tambah Officer Baru</h2>
              <form onSubmit={handleAddOfficer} className={styles.form}>
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Role:
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                  >
                    <option value="officer">Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button type="submit" className={styles.submitButton}>
                  Add
                </button>
              </form>

              {successMessage && (
                <p className={styles.success}>{successMessage}</p>
              )}
              {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            </div>
          )}

          {/* Chart Section - Visible to both Admin and Officer */}
          <div className={styles.chartSection}>
            <h2>Performa Pengiriman File Petugas</h2>
            {officerPerformanceData.length > 0 ? (
              // Contoh implementasi Recharts:
              /*
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={officerPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="filesSent"
                    fill={getComputedStyle(document.documentElement).getPropertyValue('--primary-red')}
                  />
                </BarChart>
              </ResponsiveContainer>
              */
              <div className={styles.chartPlaceholder}>
                Grafik performa petugas akan ditampilkan di sini. (Integrasikan
                library grafik seperti Recharts/Chart.js)
              </div>
            ) : (
              <p className={styles.warning}>
                Tidak ada data performa petugas untuk ditampilkan.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.footer}>&copy; 2025 Kediri Technopark</div>
    </div>
  );
};

export default Dashboard;
