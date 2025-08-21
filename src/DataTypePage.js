import React, { useState, useEffect } from "react";
import {
  User, Eye, EyeOff, Plus, X, RefreshCw, FileText, Users, Baby, Settings, LogOut, Camera
} from "lucide-react";
import styles from "./Login.module.css";

/* ===========================================================
   TEMPLATE DATA
   =========================================================== */
const templates = {
  KTP: {
    icon: <User className={styles.templateIcon} />,
    fields: [
      { key: "nik", value: "number" },
      { key: "nama", value: "text" },
      { key: "tempat_lahir", value: "text" },
      { key: "tanggal_lahir", value: "date" },
      { key: "jenis_kelamin", value: "selection" },
      { key: "alamat", value: "text" },
      { key: "agama", value: "selection" },
      { key: "status_perkawinan", value: "selection" },
      { key: "pekerjaan", value: "text" },
    ]
  },
  KK: {
    icon: <Users className={styles.templateIcon} />,
    fields: [
      { key: "nomor_kk", value: "number" },
      { key: "kepala_keluarga", value: "text" },
      { key: "istri", value: "list" },
      { key: "anak", value: "list" },
      { key: "orang_tua", value: "list" },
      { key: "alamat", value: "text" },
      { key: "rt_rw", value: "text" },
      { key: "kelurahan", value: "text" },
      { key: "kecamatan", value: "text" },
      { key: "kabupaten_kota", value: "text" },
      { key: "provinsi", value: "text" },
    ]
  },
  "Akta Kelahiran": {
    icon: <Baby className={styles.templateIcon} />,
    fields: [
      { key: "nomor_akta", value: "text" },
      { key: "nama_anak", value: "text" },
      { key: "jenis_kelamin", value: "selection" },
      { key: "tempat_lahir", value: "text" },
      { key: "tanggal_lahir", value: "date" },
      { key: "nama_ayah", value: "text" },
      { key: "nama_ibu", value: "text" },
    ]
  },
};

/* ===========================================================
   EXPECTATION FORM (Controlled Component)
   - Tidak memakai state internal; parent (DataTypePage) sebagai sumber kebenaran
   =========================================================== */
function ExpectationForm({ fields, setFields }) {
  const safeFields = fields?.length ? fields : [{ key: "", value: "" }];

  const updateField = (index, key, value) => {
    const next = safeFields.map((f, i) => (i === index ? { ...f, [key]: value } : f));
    setFields(next);
  };

  const addField = () =>
    setFields([...(safeFields || []), { key: "", value: "" }]);

  const removeField = (index) => {
    const next = safeFields.filter((_, i) => i !== index);
    setFields(next);
  };

  return (
    <div className={styles.expectationForm}>
      {safeFields.map((f, i) => (
        <div key={i} className={styles.fieldRow}>
          <input
            type="text"
            placeholder="Field name"
            value={f.key}
            onChange={(e) => updateField(i, "key", e.target.value)}
            className={styles.fieldInput}
          />
          <select
            value={f.value}
            onChange={(e) => updateField(i, "value", e.target.value)}
            className={styles.fieldSelect}
          >
            <option value="">Pilih Type</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
            <option value="selection">Selection</option>
            <option value="list">List</option>
          </select>
          <button
            type="button"
            onClick={() => removeField(i)}
            className={styles.removeFieldButton}
            title="Hapus field"
          >
            <X className={styles.removeIcon} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        className={styles.addFieldButton}
      >
        <Plus className={styles.addIcon} />
        Tambah Field
      </button>
    </div>
  );
}

/* ===========================================================
   DATA TYPE PAGE
   =========================================================== */
export default function DataTypePage() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isFormSectionOpen, setIsFormSectionOpen] = useState(false);

  const [namaTipe, setNamaTipe] = useState("");
  const [fields, setFields] = useState([]);
  const [expectation, setExpectation] = useState({});

  const [scanned, setScanned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const LIST_SCANNED_URL = "https://bot.kediritechnopark.com/webhook/list-scanned";

  const resolveNama = (row) =>
    row?.nama ??
    row?.data?.nama ??
    row?.fields?.nama ??
    row?.payload?.nama ??
    row?.kepala_keluarga ??
    row?.nama_anak ??
    row?.name ??
    "-";

  const resolveType = (row) =>
    row?.type ??
    row?.type_data ??
    row?.nama_tipe ??
    row?.data_type ??
    row?.template_name ??
    "-";

  const fetchScanned = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(LIST_SCANNED_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setScanned(rows);
    } catch (e) {
      setError("Gagal memuat daftar hasil scan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanned();
  }, []);

  // Auto-bangun expectation dari fields (single source of truth)
  useEffect(() => {
    const obj = Object.fromEntries(
      (fields || [])
        .map((f) => [f?.key ?? "", f?.value ?? ""])
        .filter(([k]) => k !== "")
    );
    setExpectation(obj);
  }, [fields]);

  const handleTemplateSelect = (templateName) => {
    if (selectedTemplate === templateName && isFormSectionOpen) {
      // klik ulang => tutup form & reset
      setIsFormSectionOpen(false);
      setSelectedTemplate("");
      setNamaTipe("");
      setFields([]);
      setExpectation({});
      return;
    }

    // pilih dan buka form
    setIsFormSectionOpen(true);
    setSelectedTemplate(templateName);

    if (templateName === "Custom") {
      setNamaTipe("");
      setFields([]);
      setExpectation({});
    } else {
      const tpl = templates[templateName]?.fields || [];
      setNamaTipe(templateName);
      setFields(tpl); // expectation otomatis lewat useEffect
    }
  };

  const handleSubmit = async () => {
    if (!namaTipe.trim()) {
      alert("Nama Tipe harus diisi!");
      return;
    }

    try {
      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/create-data-type",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_tipe: namaTipe, expectation }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("Data Type created!");
        setSelectedTemplate("");
        setNamaTipe("");
        setFields([]);
        setExpectation({});
        setIsFormSectionOpen(false);
      } else {
        alert("Gagal membuat data type");
      }
    } catch (error) {
      alert("Gagal membuat data type");
    }
  };

  return (
    <div className={styles.dataTypePage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerBrand}>
            <div className={styles.headerLogo}>
              <FileText className={styles.headerLogoIcon} />
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.headerTitle}>DataScan</h1>
              <p className={styles.headerSubtitle}>Data Management System</p>
            </div>
          </div>

          {/* Tombol Scans + Logout */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => { window.location.href = "/scan"; }}
              className={styles.submitButton}
              title="Buka pemindaian KTP"
            >
              <Camera style={{ marginRight: 6 }} />
              Scans
            </button>

            <button
              className={styles.logoutButton}
              onClick={() => {
                localStorage.removeItem("token");
                window.location.reload();
              }}
            >
              <LogOut className={styles.logoutIcon} />
              <span className={styles.logoutText}>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className={styles.mainContent}>
        {/* Create Data Type Section */}
        <div className={styles.createSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Buat Tipe Data Baru</h2>
            <p className={styles.sectionSubtitle}>Pilih template atau buat tipe data custom sesuai kebutuhan</p>
          </div>

          {/* Template Selection */}
          <div className={styles.templateSection}>
            <h3 className={styles.templateTitle}>Pilih Template</h3>
            <div className={styles.templateGrid}>
              {Object.entries(templates).map(([templateName, template]) => (
                <button
                  key={templateName}
                  onClick={() => handleTemplateSelect(templateName)}
                  className={`${styles.templateCard} ${
                    selectedTemplate === templateName ? styles.templateCardActive : ""
                  }`}
                >
                  <div className={styles.templateContent}>
                    <div className={`${styles.templateIconContainer} ${
                      selectedTemplate === templateName ? styles.templateIconActive : ""
                    }`}>
                      {template.icon}
                    </div>
                    <span className={styles.templateName}>{templateName}</span>
                  </div>
                </button>
              ))}

              {/* Custom Template */}
              <button
                onClick={() => handleTemplateSelect("Custom")}
                className={`${styles.templateCard} ${styles.customTemplateCard} ${
                  selectedTemplate === "Custom" ? styles.customTemplateActive : ""
                }`}
              >
                <div className={styles.templateContent}>
                  <div className={`${styles.templateIconContainer} ${
                    selectedTemplate === "Custom" ? styles.customIconActive : ""
                  }`}>
                    <Settings className={styles.templateIcon} />
                  </div>
                  <span className={styles.templateName}>Custom</span>
                </div>
              </button>
            </div>
          </div>

          {/* Form Section */}
          {isFormSectionOpen && (
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Tipe Data</label>
                <input
                  type="text"
                  placeholder="Masukkan nama tipe data"
                  className={styles.inputField}
                  value={namaTipe}
                  onChange={(e) => setNamaTipe(e.target.value)}
                />
              </div>

              {/* Fields Section */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fields</label>
                <ExpectationForm
                  fields={fields}
                  setFields={setFields}
                />
              </div>

              <button
                onClick={handleSubmit}
                className={styles.submitButton}
              >
                Simpan Tipe Data
              </button>
            </div>
          )}
        </div>

        {/* Scanned Data List */}
        <div className={styles.dataSection}>
          <div className={styles.dataHeader}>
            <div className={styles.dataHeaderInfo}>
              <h2 className={styles.dataTitle}>Data Hasil Scan</h2>
              <p className={styles.dataSubtitle}>Daftar semua data yang telah di-scan</p>
            </div>
            <button
              onClick={fetchScanned}
              disabled={loading}
              className={styles.refreshButton}
            >
              <RefreshCw className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>No</th>
                  <th className={styles.tableHeaderCell}>Tipe Data</th>
                  <th className={styles.tableHeaderCell}>Nama</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {loading ? (
                  <tr>
                    <td colSpan={3} className={styles.loadingCell}>
                      <div className={styles.loadingContent}>
                        <RefreshCw className={`${styles.loadingIcon} ${styles.spinning}`} />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                ) : scanned.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.emptyCell}>
                      Belum ada data hasil scan
                    </td>
                  </tr>
                ) : (
                  scanned.map((row, idx) => (
                    <tr key={row.id || row.nik || idx} className={styles.tableRow}>
                      <td className={styles.tableCell}>{idx + 1}</td>
                      <td className={styles.tableCell}>
                        <span className={styles.typeBadge}>
                          {resolveType(row)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>{resolveNama(row)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
