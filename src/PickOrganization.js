// PickOrganization.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import styles from "./PickOrganization.module.css";

// ====== KONFIG BACKEND ======
// Webhook n8n untuk mengambil daftar organisasi berdasarkan token JWT
const LIST_ENDPOINT = "https://bot.kediritechnopark.com/webhook/soliddata/get-organization";

// Webhook n8n untuk memilih organisasi
const SELECT_ENDPOINT = "https://bot.kediritechnopark.com/webhook/soliddata/pick-organization";

// Fungsi GET organisasi dari backend N8N
async function getOrganizationsFromBackend() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token tidak ditemukan. Silakan login.");
  }

  const response = await fetch(LIST_ENDPOINT, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Gagal mengambil data organisasi. Status: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Respon bukan array. Format data organisasi tidak valid.");
  }

  return data;
}

export default function PickOrganization() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load daftar organisasi dari backend menggunakan JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getOrganizationsFromBackend();
        setOrgs(data);
      } catch (e) {
        console.error(e);
        setError(e.message || "Terjadi kesalahan saat memuat organisasi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Saat user memilih salah satu organisasi
  const handleSelect = async (org) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const chosen = {
      organization_id: org.organization_id,
      nama_organization: org.nama_organization,
    };

    // simpan lokal untuk dipakai di halaman lain
    localStorage.setItem("selected_organization", JSON.stringify(chosen));

    setPosting(true);
    try {
      await fetch(SELECT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(chosen),
      }).catch(() => {}); // abaikan error jaringan/timeout, tetap navigate

      // Lanjut ke dashboard spesifik org
      navigate(`/dashboard/${org.organization_id}`);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Loader2 className={styles.spin} />
        <span>Memuat organisasi…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <AlertCircle />
        <div>
          <h3>Gagal memuat organisasi</h3>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Pilih Organisasi</h1>
      <p className={styles.subtitle}>Silakan pilih organisasi yang ingin Anda kelola.</p>

      {orgs.length === 0 ? (
        <div className={styles.empty}>
          <Building2 />
          <p>Tidak ada organisasi untuk akun ini.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {orgs.map((org) => (
            <button
              key={org.organization_id}
              className={styles.card}
              onClick={() => handleSelect(org)}
              disabled={posting}
              aria-label={`Pilih organisasi ${org.nama_organization}`}
            >
              <div className={styles.cardIcon}><Building2 /></div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{org.nama_organization}</div>
                <div className={styles.cardMeta}>ID: {org.organization_id}</div>
              </div>
              <ArrowRight className={styles.cardArrow} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
