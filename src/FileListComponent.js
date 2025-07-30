import React, { useState, useEffect } from "react";
import styles from "./FileListComponent.module.css";
import * as XLSX from "xlsx";
import { PDFDownloadLink } from "@react-pdf/renderer";
import KTPPDF from "./KTPPDF";

const FileListComponent = ({
  setTotalFilesSentToday,
  setTotalFilesSentMonth,
  setTotalFilesSentOverall,
  setOfficerPerformanceData,
}) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          "https://bot.kediritechnopark.com/webhook/solid-data/files",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const text = await response.text();
        if (!text) throw new Error("Server membalas kosong.");

        const data = JSON.parse(text);
        if (!data.success || !Array.isArray(data.data))
          throw new Error("Format respons tidak valid.");

        const fileData = data.data;
        setFiles(fileData);
        setFilteredFiles(fileData);

        const today = new Date().toISOString().slice(0, 10);
        const totalToday = fileData.filter((f) =>
          f.created_at.startsWith(today)
        ).length;
        setTotalFilesSentToday(totalToday);

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

        setTotalFilesSentOverall(fileData.length);

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
            if (monthlyDataMap[monthKey] !== undefined)
              monthlyDataMap[monthKey]++;
          });

          const performanceArray = Object.entries(monthlyDataMap).map(
            ([month, count]) => {
              const dateObj = new Date(`${month}-01`);
              const label = new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
              }).format(dateObj);
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

  useEffect(() => {
    if (selectedDocumentType) {
      setFilteredFiles(
        files.filter((file) => file.document_type === selectedDocumentType)
      );
    } else {
      setFilteredFiles(files);
    }
  }, [selectedDocumentType, files]);

  const handleRowClick = async (file) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      const response = await fetch(
        `https://bot.kediritechnopark.com/webhook/solid-data/merged?nama_lengkap=${encodeURIComponent(
          file.nama_lengkap
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const text = await response.text();
      if (!text) throw new Error("Respons kosong dari server.");

      const data = JSON.parse(text);
      if (data.error) {
        alert(data.error);
        return;
      }

      setSelectedFile(data[0]);
    } catch (error) {
      console.error("Gagal mengambil detail:", error.message);
      alert("Gagal mengambil detail. Pastikan data tersedia.");
    }
  };

  const getImageSrc = (base64) => {
    if (!base64) return null;
    const cleaned = base64.replace(/\s/g, "");
    if (cleaned.startsWith("iVBOR")) return `data:image/png;base64,${cleaned}`;
    if (cleaned.startsWith("/9j/")) return `data:image/jpeg;base64,${cleaned}`;
    if (cleaned.startsWith("UklGR")) return `data:image/webp;base64,${cleaned}`;
    return `data:image/*;base64,${cleaned}`;
  };

  const closeModal = () => setSelectedFile(null);

  const formatPhoneNumber = (phone) =>
    phone?.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");

  const exportToExcel = (data) => {
    const modifiedData = data.map((item) => ({
      ID: item.id,
      Petugas_ID: item.petugas_id,
      Petugas: item.username,
      NIK: item.nik,
      Nama_Lengkap: item.nama_lengkap,
      Tempat_Lahir: item.tempat_lahir,
      Tanggal_Lahir: new Date(item.tanggal_lahir),
      Jenis_Kelamin: item.jenis_kelamin,
      Alamat: item.alamat,
      RT: item.rt,
      RW: item.rw,
      Kel_Desa: item.kel_desa,
      Kecamatan: item.kecamatan,
      Agama: item.agama,
      Status_Perkawinan: item.status_perkawinan,
      Pekerjaan: item.pekerjaan,
      Kewarganegaraan: item.kewarganegaraan,
      No_HP: item.no_hp,
      Email: item.email,
      Berlaku_Hingga: new Date(item.berlaku_hingga),
      Pembuatan: new Date(item.pembuatan),
      Kota_Pembuatan: item.kota_pembuatan,
      Created_At: new Date(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(modifiedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "data-export.xlsx");
  };

  return (
    <div className={styles.fileListSection}>
      <div className={styles.fileListHeader}>
        <h2 className={styles.fileListTitle}>📁 Daftar Document</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <select
            value={selectedDocumentType}
            onChange={(e) => setSelectedDocumentType(e.target.value)}
            className={styles.fileCount}
          >
            <option value="">Semua</option>
            <option value="ktp">KTP</option>
            <option value="kk">KK</option>
            <option value="akta_kelahiran">Akta Kelahiran</option>
          </select>
          <button
            onClick={() => {
              exportToExcel(filteredFiles);
            }}
            className={styles.downloadButton}
          >
            ⬇️ Unduh Excel
          </button>
          <span className={styles.fileCount}>
            {filteredFiles.length} document
          </span>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          <span>✅</span>
          {successMessage}
        </div>
      )}

      <div className={styles.tableContainer}>
        {filteredFiles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>Belum ada data</div>
            <p className={styles.emptyStateText}>
              Tidak ada data KK yang tersedia saat ini.
            </p>
          </div>
        ) : (
          <table className={styles.fileTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>NIK</th>
                <th>Jenis</th>
                <th className={styles.nameColumn}>Nama Lengkap</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, index) => (
                <tr
                  key={file.id}
                  onClick={() => handleRowClick(file)}
                  className={styles.tableRow}
                >
                  <td>{index + 1}</td>
                  <td>{file.nik}</td>
                  <td>{file.document_type}</td>
                  <td className={styles.nameColumn}>{file.nama_lengkap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal dan komponen lainnya tetap seperti sebelumnya */}
      {selectedFile && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          {" "}
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            {selectedFile.data && (
              <img
                src={getImageSrc(selectedFile.data)}
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
            )}{" "}
            <h3>🪪 Detail Data Document</h3>
            <div style={{ marginBottom: "1rem" }}>
              <PDFDownloadLink
                document={
                  <KTPPDF
                    data={{
                      ...selectedFile,
                      data:
                        selectedFile.data?.startsWith("/") ||
                        selectedFile.data?.length < 50
                          ? null
                          : selectedFile.data.replace(/\s/g, ""),
                      fallbackImage: selectedFile.foto_url,
                    }}
                  />
                }
                fileName={`KTP_${selectedFile.nik}.pdf`}
                style={{
                  textDecoration: "none",
                  padding: "8px 16px",
                  color: "#fff",
                  backgroundColor: "#00adef",
                  borderRadius: "6px",
                  display: "inline-block",
                }}
              >
                {({ loading }) =>
                  loading ? "Menyiapkan PDF..." : "⬇️ Unduh PDF"
                }
              </PDFDownloadLink>
            </div>
            <table className={styles.detailTable}>
              <tbody>
                {[
                  ["NIK", selectedFile.nik],
                  ["No.Al", selectedFile.no_al],
                  ["Nomor Akta Kelahiran", selectedFile.akta_kelahiran_nomor],
                  ["Nama Lengkap", selectedFile.nama_lengkap],
                  ["Anak Ke", selectedFile.anak_ke],
                  ["Tempat Lahir", selectedFile.tempat_lahir],
                  ["Tanggal Lahir", selectedFile.tanggal_lahir],
                  ["Jenis Kelamin", selectedFile.jenis_kelamin],
                  ["Alamat", selectedFile.alamat],
                  ["Ayah", selectedFile.ayah],
                  ["ibu", selectedFile.ibu],
                  ["RT", selectedFile.rt],
                  ["RW", selectedFile.rw],
                  ["Kelurahan/Desa", selectedFile.kel_desa],
                  ["Kecamatan", selectedFile.kecamatan],
                  ["Agama", selectedFile.agama],
                  ["Status Perkawinan", selectedFile.status_perkawinan],
                  ["Pekerjaan", selectedFile.pekerjaan],
                  ["Kewarganegaraan", selectedFile.kewarganegaraan],
                  ["No HP", selectedFile.no_hp],
                  ["Email", selectedFile.email],
                  ["Berlaku Hingga", selectedFile.berlaku_hingga],
                  ["Tanggal Pembuatan", selectedFile.pembuatan],
                  ["Kota Pembuatan", selectedFile.kota_pembuatan],
                ]
                  .filter(([_, value]) => value !== null && value !== "")
                  .map(([label, value]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <button className={styles.closeButton} onClick={closeModal}>
              {" "}
              Tutup{" "}
            </button>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
};

export default FileListComponent;
