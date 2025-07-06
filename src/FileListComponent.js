import React, { useState, useEffect } from "react";
import styles from "./FileListComponent.module.css";
import * as XLSX from "xlsx";

const FileListComponent = ({
  setTotalFilesSentToday,
  setTotalFilesSentMonth,
  setTotalFilesSentOverall,
  setOfficerPerformanceData,
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(
          "https://bot.kediritechnopark.com/webhook/files",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const text = await response.text();

        if (!text) {
          throw new Error("Server membalas kosong.");
        }

        const data = JSON.parse(text);

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error("Format respons tidak valid.");
        }

        const fileData = data.data;

        // 1. Set ke state
        setFiles(fileData);

        // 2. Hitung total file hari ini
        const today = new Date().toISOString().slice(0, 10);
        const totalToday = fileData.filter((f) =>
          f.created_at.startsWith(today)
        ).length;
        setTotalFilesSentToday(totalToday);

        // 3. Hitung total bulan ini
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const totalThisMonth = fileData.filter((f) => {
          const d = new Date(f.created_at);
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        }).length;
        setTotalFilesSentMonth(totalThisMonth);

        // 4. Total keseluruhan
        setTotalFilesSentOverall(fileData.length);

        // 5. Grafik performa per bulan (dinamis)
        const dateObjects = fileData.map((item) => new Date(item.created_at));
        if (dateObjects.length > 0) {
          const minDate = new Date(Math.min(...dateObjects));
          const maxDate = new Date(Math.max(...dateObjects));

          const monthlyDataMap = {};
          let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
          const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

          while (current <= end) {
            const monthKey = `${current.getFullYear()}-${String(
              current.getMonth() + 1
            ).padStart(2, "0")}`;
            monthlyDataMap[monthKey] = 0;
            current.setMonth(current.getMonth() + 1);
          }

          fileData.forEach((item) => {
            const d = new Date(item.created_at);
            const monthKey = `${d.getFullYear()}-${String(
              d.getMonth() + 1
            ).padStart(2, "0")}`;
            if (monthlyDataMap[monthKey] !== undefined) {
              monthlyDataMap[monthKey]++;
            }
          });

          const performanceArray = Object.entries(monthlyDataMap).map(
            ([month, count]) => {
              const [year, monthNum] = month.split("-");
              const dateObj = new Date(`${month}-01`);
              const label = new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
              }).format(dateObj); // hasil: "Juli 2025"
              return { month: label, count };
            }
          );

          setOfficerPerformanceData(performanceArray);
        }
      } catch (error) {
        console.error("Gagal mengambil data dari server:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const formatPhoneNumber = (phone) =>
    phone?.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
  const handleRowClick = async (file) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Token tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      const response = await fetch(
        `https://bot.kediritechnopark.com/webhook/6915ea36-e1f4-49ad-a7f1-a27ce0bf2279/ktp/${file.nik}`,
        {
          method: "GET",
          headers: {
            Authorization: token, // atau `Bearer ${token}` jika diperlukan
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Respons kosong dari server.");
      }

      const data = JSON.parse(text);

      if (data.error) {
        alert(data.error);
        return;
      }

      const item = data[0];

      if (!item) {
        alert("Data tidak ditemukan.");
        return;
      }

      // Validasi jika ada image URL
      if (item.foto_url && !item.foto_url.match(/\.(jpg|jpeg|png|webp)$/i)) {
        console.warn(
          "URL foto bukan format gambar yang didukung:",
          item.foto_url
        );
      }

      setSelectedFile(item); // tampilkan di modal misalnya
    } catch (error) {
      console.error("Gagal mengambil detail:", error.message || error);
      alert("Gagal mengambil detail. Pastikan data tersedia.");
    }
  };

  const closeModal = () => {
    setSelectedFile(null);
  };

  const exportToExcel = (data) => {
    const domain = window.location.origin;

    // Step 1: Transform data
    const modifiedData = data.map((item) => ({
      ID: item.id,
      NIK: item.nik,
      Nama: item.nama_lengkap,
      NoHP: item.no_hp,
      Email: item.email,
      Tanggal_Lahir: new Date(item.tanggal_lahir).toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      CreatedAt: new Date(item.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      ImageURL: `${domain}/${item.nik}`, // Will become a hyperlink
    }));

    // Step 2: Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(modifiedData);

    // Step 3: Add hyperlinks to ImageURL column
    modifiedData.forEach((item, index) => {
      const cellAddress = `G${index + 2}`; // G column, +2 because of header
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].l = {
          Target: item.ImageURL,
          Tooltip: "View Image",
        };
      }
    });

    // Step 4: Optional - add column widths
    worksheet["!cols"] = [
      { wch: 5 }, // ID
      { wch: 15 }, // NIK
      { wch: 25 }, // Nama
      { wch: 15 }, // NoHP
      { wch: 30 }, // Email
      { wch: 25 }, // CreatedAt
      { wch: 40 }, // ImageURL
    ];

    // Step 5: Optional - enable filter and freeze header
    worksheet["!autofilter"] = { ref: "A1:G1" };

    // Step 6: Create and export workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "data-export.xlsx");
  };

  if (loading) {
    return (
      <div className={styles.fileListSection}>
        <div className={styles.emptyState}>
          <div className={styles.spinner}></div>
          <div className={styles.emptyStateTitle}>Memuat file...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fileListSection}>
      <div className={styles.fileListHeader}>
        <h2 className={styles.fileListTitle}>📁 Daftar Anggota</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => {
              exportToExcel(files);
            }}
            className={styles.downloadButton}
          >
            ⬇️ Unduh Excel
          </button>
          <span className={styles.fileCount}>{files.length} file tersedia</span>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          <span>✅</span>
          {successMessage}
        </div>
      )}

      <div className={styles.tableContainer}>
        {files.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>Belum ada data</div>
            <p className={styles.emptyStateText}>
              Tidak ada data KTP yang tersedia saat ini.
            </p>
          </div>
        ) : (
          <table className={styles.fileTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>NIK</th>
                <th className={styles.nameColumn}>Nama Lengkap</th>
                <th>No. HP</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr
                  key={file.id}
                  onClick={() => handleRowClick(file)}
                  className={styles.tableRow}
                >
                  <td>{index + 1}</td>
                  <td>{file.nik}</td>
                  <td className={styles.nameColumn}>{file.nama_lengkap}</td>
                  <td>{formatPhoneNumber(file.no_hp)}</td>
                  <td>{file.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Detail */}
      {selectedFile && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto KTP */}
            {selectedFile.data && (
              <img
                src={`data:image/jpeg;base64,${selectedFile.data}`}
                alt={`Foto KTP - ${selectedFile.nik}`}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "contain",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
            )}

            <h3>🪪 Detail Data KTP</h3>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td>NIK</td>
                  <td>{selectedFile.nik}</td>
                </tr>
                <tr>
                  <td>Nama Lengkap</td>
                  <td>{selectedFile.nama_lengkap}</td>
                </tr>
                <tr>
                  <td>Tempat Lahir</td>
                  <td>{selectedFile.tempat_lahir}</td>
                </tr>
                <tr>
                  <td>Tanggal Lahir</td>
                  <td>{selectedFile.tanggal_lahir}</td>
                </tr>
                <tr>
                  <td>Jenis Kelamin</td>
                  <td>{selectedFile.jenis_kelamin}</td>
                </tr>
                <tr>
                  <td>Alamat</td>
                  <td>{selectedFile.alamat}</td>
                </tr>
                <tr>
                  <td>RT/RW</td>
                  <td>{selectedFile.rt_rw}</td>
                </tr>
                <tr>
                  <td>Kelurahan/Desa</td>
                  <td>{selectedFile.kel_desa}</td>
                </tr>
                <tr>
                  <td>Kecamatan</td>
                  <td>{selectedFile.kecamatan}</td>
                </tr>
                <tr>
                  <td>Agama</td>
                  <td>{selectedFile.agama}</td>
                </tr>
                <tr>
                  <td>Status Perkawinan</td>
                  <td>{selectedFile.status_perkawinan}</td>
                </tr>
                <tr>
                  <td>Pekerjaan</td>
                  <td>{selectedFile.pekerjaan}</td>
                </tr>
                <tr>
                  <td>Kewarganegaraan</td>
                  <td>{selectedFile.kewarganegaraan}</td>
                </tr>
                <tr>
                  <td>No HP</td>
                  <td>{selectedFile.no_hp}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>{selectedFile.email}</td>
                </tr>
                <tr>
                  <td>Berlaku Hingga</td>
                  <td>{selectedFile.berlaku_hingga}</td>
                </tr>
                <tr>
                  <td>Tanggal Pembuatan</td>
                  <td>{selectedFile.pembuatan}</td>
                </tr>
                <tr>
                  <td>Kota Pembuatan</td>
                  <td>{selectedFile.kota_pembuatan}</td>
                </tr>
              </tbody>
            </table>
            <button className={styles.closeButton} onClick={closeModal}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileListComponent;
