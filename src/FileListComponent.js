import React, { useState, useEffect } from "react";
import styles from "./FileListComponent.module.css";

const FileListComponent = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(
          "https://bot.kediritechnopark.com/webhook/api/files"
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

        setFiles(data.data);
        setLoading(false);
      } catch (error) {
        console.error("Gagal mengambil data dari server:", error.message);
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const formatPhoneNumber = (phone) =>
    phone?.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");

  const handleRowClick = async (file) => {
    try {
      const response = await fetch(
        `https://bot.kediritechnopark.com/webhook/8a68d17e-c987-468c-853a-1c7d8104b5ba/api/files/${file.nik}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Respons kosong dari server.");
      }

      const data = JSON.parse(text);

      console.log(data);
      if (data.error) {
        alert(data.error);
        return;
      }
      // Validasi URL gambar (opsional)
      if (data.foto_url && !data.foto_url.match(/\.(jpg|jpeg|png)$/i)) {
        console.warn("URL foto bukan format gambar yang didukung.");
      }

      setSelectedFile(data[0]);
    } catch (error) {
      console.error("Gagal mengambil detail:", error.message || error);
      alert("Gagal mengambil detail. Pastikan data tersedia.");
    }
  };

  const closeModal = () => {
    setSelectedFile(null);
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
        <span className={styles.fileCount}>{files.length} file tersedia</span>
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
