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

  // Helper function to convert snake_case to Title Case
  const formatKeyToLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to check if value is a date string and convert it
  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Check if the value looks like a date
    if (typeof value === 'string' && 
        (key.includes('tanggal') || key.includes('lahir') || key.includes('berlaku') || key.includes('pembuatan') || key.includes('created_at'))) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return value;
  };

  // Dynamic function to process data for Excel export
  const processDataForExcel = (data) => {
    if (!data || data.length === 0) return [];

    return data.map((item) => {
      const processedItem = {};
      
      Object.entries(item).forEach(([key, value]) => {
        // Skip null, undefined, or empty string values
        if (value === null || value === undefined || value === '') {
          return;
        }

        // Skip certain keys that are not needed in export
        const excludedKeys = ['id', 'document_type', 'created_at', 'data', 'foto_url'];
        if (excludedKeys.includes(key)) {
          return;
        }

        // Format the key as label
        const label = formatKeyToLabel(key);
        
        // Format the value
        const formattedValue = formatValue(key, value);
        
        processedItem[label] = formattedValue;
      });

      return processedItem;
    });
  };

  // Dynamic function to get unique document types
  const getUniqueDocumentTypes = (data) => {
    const types = [...new Set(data.map(item => item.document_type).filter(Boolean))];
    return types;
  };

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
          f.created_at && f.created_at.startsWith(today)
        ).length;
        setTotalFilesSentToday(totalToday);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const totalThisMonth = fileData.filter((f) => {
          if (!f.created_at) return false;
          const d = new Date(f.created_at);
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        }).length;
        setTotalFilesSentMonth(totalThisMonth);

        setTotalFilesSentOverall(fileData.length);

        const dateObjects = fileData
          .filter(item => item.created_at)
          .map((item) => new Date(item.created_at));
        
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

          fileData
            .filter(item => item.created_at)
            .forEach((item) => {
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
          file.nama_lengkap || ''
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

      console.log("Data received from merged API:", data[0]); // Debug log
      console.log("All keys in data:", Object.keys(data[0])); // Debug log
      console.log("Non-null values:", Object.entries(data[0]).filter(([k,v]) => v !== null)); // Debug log
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
    const processedData = processDataForExcel(data);
    if (processedData.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "data-export.xlsx");
  };

  // Get unique document types for dropdown
  const documentTypes = getUniqueDocumentTypes(files);

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
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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
              Tidak ada data yang tersedia saat ini.
            </p>
          </div>
        ) : (
          <table className={styles.fileTable}>
            <thead>
              <tr>
                <th>No</th>
                <th>NIK</th>
                <th>Jenis</th>
                <th className={styles.nameColumn}>Nama Lengkap</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, index) => (
                <tr
                  key={file.id || index}
                  onClick={() => handleRowClick(file)}
                  className={styles.tableRow}
                >
                  <td>{index + 1}</td>
                  <td>{file.nik || '-'}</td>
                  <td>{file.document_type || '-'}</td>
                  <td className={styles.nameColumn}>{file.nama_lengkap || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {selectedFile && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedFile.data && (
              <img
                src={getImageSrc(selectedFile.data)}
                alt={`Foto Document - ${selectedFile.nik || 'Unknown'}`}
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
                fileName={`Document_${selectedFile.nik || selectedFile.id || 'unknown'}.pdf`}
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
                {selectedFile && (console.log("selectedFile in modal:", selectedFile), true) &&
                  Object.entries(selectedFile)
                    .map(([key, value]) => {
                      console.log(`Processing: ${key} = ${value} (type: ${typeof value})`);
                      return [key, value];
                    })
                    .filter(([key, value]) => {
                      console.log(`Filtering: ${key} = ${value}`);
                      
                      // Exclude specific keys that are not part of the display data
                      const excludedKeys = [
                        "id",
                        "document_type", 
                        "created_at",
                        "data", // Exclude image data
                        "foto_url", // Exclude image URL
                      ];
                      
                      if (excludedKeys.includes(key)) {
                        console.log(`Excluded key: ${key}`);
                        return false;
                      }
                      
                      if (value === null) {
                        console.log(`Null value for key: ${key}`);
                        return false;
                      }
                      if (value === undefined) {
                        console.log(`Undefined value for key: ${key}`);
                        return false;
                      }
                      if (typeof value === 'string' && value.trim() === '') {
                        console.log(`Empty string for key: ${key}`);
                        return false;
                      }
                      
                      console.log(`Keeping key: ${key} with value: ${value}`);
                      return true;
                    })
                    .map(([key, value]) => {
                      console.log(`Rendering field: ${key} = ${value}`);
                      
                      // Special handling for 'anggota' array
                      if (key === "anggota" && Array.isArray(value)) {
                        return (
                          <tr key={key}>
                            <td>{formatKeyToLabel(key)}</td>
                            <td>
                              {value.map((member, idx) => (
                                <div key={idx} style={{ marginBottom: "10px", borderBottom: "1px dashed #eee", paddingBottom: "5px" }}>
                                  {Object.entries(member)
                                    .filter(([_, memberValue]) => {
                                      if (memberValue === null || memberValue === undefined) return false;
                                      if (typeof memberValue === 'string' && memberValue.trim() === '') return false;
                                      return true;
                                    })
                                    .map(([memberKey, memberValue]) => (
                                      <div key={memberKey}>
                                        <strong>{formatKeyToLabel(memberKey)}:</strong> {memberValue}
                                      </div>
                                    ))}
                                </div>
                              ))}
                            </td>
                          </tr>
                        );
                      }

                      // Format dates for display
                      let displayValue = value;
                      if (typeof value === 'string' && 
                          (key.includes('tanggal') || key.includes('lahir') || key.includes('berlaku') || key.includes('pembuatan') || key.includes('created_at'))) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                          displayValue = date.toLocaleDateString('id-ID');
                        }
                      }

                      return (
                        <tr key={key}>
                          <td>{formatKeyToLabel(key)}</td>
                          <td>{displayValue}</td>
                        </tr>
                      );
                    })}
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
