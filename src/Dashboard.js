import React, { useState, useRef, useEffect } from "react";
import styles from "./Dashboard.module.css";
import { useNavigate, useParams } from "react-router-dom"; // ***
import FileListComponent from "./FileListComponent";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "https://bot.kediritechnopark.com/webhook/solid-data";

const Dashboard = () => {
  const navigate = useNavigate();
  const { organization_id: orgIdFromRoute } = useParams(); // ***
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [user, setUser] = useState({});
  const [totalFilesSentToday, setTotalFilesSentToday] = useState(0);
  const [totalFilesSentMonth, setTotalFilesSentMonth] = useState(0);
  const [totalFilesSentOverall, setTotalFilesSentOverall] = useState(0);
  const [officerPerformanceData, setOfficerPerformanceData] = useState([]);
  const [officers, setOfficers] = useState([]);

  // Helper: ambil orgId yang valid dari route atau localStorage
  const getActiveOrg = () => {
    const selected = JSON.parse(localStorage.getItem("selected_organization") || "null");
    // prioritas: URL param, fallback ke localStorage
    const orgId = orgIdFromRoute || selected?.organization_id;
    const orgName = selected?.nama_organization || "";
    return { orgId, orgName };
  };

  // Helper: header standar, opsional kirim X-Organization-Id
  const authHeaders = (extra = {}) => {
    const token = localStorage.getItem("token");
    const { orgId } = getActiveOrg();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Organization-Id": orgId ? String(orgId) : undefined, // backend boleh pakai header ini jika mau
      ...extra,
    };
  };

  // Pastikan sudah login & punya org yang dipilih
  useEffect(() => {
    const token = localStorage.getItem("token");
    const { orgId } = getActiveOrg();

    if (!token) {
      navigate("/login");
      return;
    }
    if (!orgId) {
      navigate("/pick-organization");
      return;
    }

    // Sinkronkan URL dengan orgId dari localStorage kalau user buka /dashboard tanpa param
    if (!orgIdFromRoute) {
      navigate(`/dashboard/${orgId}`, { replace: true });
    }
  }, [orgIdFromRoute, navigate]);

  // Verifikasi token & ambil ringkasan dashboard untuk org terpilih
  useEffect(() => {
    const verifyTokenAndFetchData = async () => {
      const token = localStorage.getItem("token");
      const { orgId } = getActiveOrg();
      if (!token || !orgId) return;

      try {
        // GET -> kirim orgId lewat query string
        const res = await fetch(
          `${API_BASE}/dashboard?organization_id=${encodeURIComponent(orgId)}`,
          { method: "GET", headers: authHeaders() }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Dashboard error:", data);
        }

        // Contoh normalisasi struktur user dari backend
        // Pakai apa yang ada: data.user atau data[0] atau langsung isi metrik
        if (data?.user) setUser(data.user);
        else if (Array.isArray(data) && data.length) setUser(data[0]);

        // Jika backend mengembalikan metrik-metrik ini, set di sini.
        if (typeof data?.total_today === "number") setTotalFilesSentToday(data.total_today);
        if (typeof data?.total_month === "number") setTotalFilesSentMonth(data.total_month);
        if (typeof data?.total_overall === "number") setTotalFilesSentOverall(data.total_overall);
        if (Array.isArray(data?.officerPerformance))
          setOfficerPerformanceData(data.officerPerformance);
      } catch (err) {
        console.error("Token/Fetch dashboard gagal:", err);
      }
    };

    verifyTokenAndFetchData();
  }, [orgIdFromRoute]);

  // Ambil daftar officer (khusus admin) untuk org terpilih
  const fetchOfficers = async () => {
    const { orgId } = getActiveOrg();
    if (!orgId) return;

    try {
      const res = await fetch(
        `${API_BASE}/list-user?organization_id=${encodeURIComponent(orgId)}`,
        { method: "GET", headers: authHeaders() }
      );
      const data = await res.json();
      setOfficers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat daftar officer:", err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchOfficers();
    }
  }, [user?.role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // jangan hapus selected_organization kalau mau balik lagi ke org sebelumnya
    window.location.reload();
  };

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    const { orgId } = getActiveOrg();
    if (!orgId) return;

    try {
      const res = await fetch(`${API_BASE}/add-officer`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          username,
          password,
          organization_id: orgId, // *** kirim org pada body
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Gagal menambahkan officer");
      }

      setSuccessMessage("Officer berhasil ditambahkan");
      setUsername("");
      setPassword("");
      setErrorMessage("");

      await fetchOfficers();
    } catch (err) {
      setErrorMessage(err.message || "Gagal menambahkan officer");
      setSuccessMessage("");
    }
  };

  const handleDeleteOfficer = async (id) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus petugas ini?");
    if (!confirmDelete) return;

    const { orgId } = getActiveOrg();
    if (!orgId) return;

    try {
      const res = await fetch(`${API_BASE}/delete-officer`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({
          id,
          organization_id: orgId, // *** kirim org pada body
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Gagal menghapus officer");
      }

      setOfficers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      alert("Gagal menghapus petugas: " + err.message);
    }
  };

  // Tutup menu bila klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { orgName } = getActiveOrg();

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <div className={styles.logoAndTitle}>
          <img src="/ikasapta.png" alt="Bot Avatar" />
          <h1 className={styles.h1}>SOLID</h1>
          <h1 className={styles.h1} styles="color: #43a0a7;">DATA</h1>
          {/* *** tampilkan nama org aktif */}
          {orgName && <span className={styles.orgBadge}>Org: {orgName}</span>}
        </div>

        <div className={styles.dropdownContainer} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={styles.dropdownToggle}
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-haspopup="true"
          >
            <svg width="15" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => {
                  navigate("/scan");
                  setIsMenuOpen(false);
                }}
                className={styles.dropdownItem}
              >
                Scan
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className={styles.dropdownItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.summaryCardsContainer}>
          <div className={styles.summaryCard}>
            <h3>Hari Ini</h3>
            <p>{totalFilesSentToday.toLocaleString()}</p>
          </div>
        <div className={styles.summaryCard}>
            <h3>Bulan Ini</h3>
            <p>{totalFilesSentMonth.toLocaleString()}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Keseluruhan</h3>
            <p>{totalFilesSentOverall.toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          {user?.role === "admin" && (
            <div className={styles.formSection}>
              <h2>Daftar Petugas</h2>
              <div className={styles.officerListContainer}>
                <div className={styles.officerList}>
                  {officers.length > 0 ? (
                    officers.map((officer) => (
                      <div key={officer.id} className={styles.officerItem}>
                        <div className={styles.officerInfo}>
                          <span className={styles.officerIcon}>👤</span>
                          <div className={styles.officerDetails}>
                            <strong className={styles.officerName}>
                              {officer.username}
                            </strong>
                            <span className={styles.officerRole}>
                              {officer.role}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteOfficer(officer.id)}
                          className={styles.deleteButton}
                          title="Hapus Petugas"
                        >
                          ❌
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <span>📋</span>
                      <p>Belum ada petugas terdaftar</p>
                    </div>
                  )}
                </div>
              </div>

              <hr className={styles.separator} />
              <h2>Tambah Petugas Baru</h2>
              <form onSubmit={handleAddOfficer} className={styles.form}>
                <label>
                  Username
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                  />
                </label>
                <button type="submit" className={styles.submitButton}>
                  Tambah Officer
                </button>
              </form>

              {successMessage && (
                <p className={styles.success}>{successMessage}</p>
              )}
              {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            </div>
          )}

          <div className={styles.chartSection}>
            <h2>Grafik Upload Document</h2>
            {officerPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={officerPerformanceData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00adef" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.warning}>
                📋 Belum ada data upload untuk ditampilkan
              </div>
            )}
          </div>
        </div>

        {/* *** kirim orgId ke FileListComponent agar fetch-nya ikut org */}
        <FileListComponent
          organizationId={getActiveOrg().orgId} // ***
          setTotalFilesSentToday={setTotalFilesSentToday}
          setTotalFilesSentMonth={setTotalFilesSentMonth}
          setTotalFilesSentOverall={setTotalFilesSentOverall}
          setOfficerPerformanceData={setOfficerPerformanceData}
        />
      </div>

      <div className={styles.footer}>
        © 2025 Kediri Technopark • Dashboard SOLID DATA
      </div>
    </div>
  );
};

export default Dashboard;
