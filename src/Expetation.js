import React, { useEffect, useState } from "react";
import { User, Users, Baby, Settings, Plus, X } from "lucide-react";

/* ============================
   Helpers
============================ */
const getCleanToken = () => {
  let raw = localStorage.getItem("token") || "";
  try { raw = JSON.parse(raw); } catch {}
  return String(raw).replace(/^"+|"+$/g, "");
};

// BACA org dari localStorage: utamakan 'selected_organization', fallback 'select_organization'
const getSelectedOrganization = () => {
  let raw =
    localStorage.getItem("selected_organization") ??
    localStorage.getItem("select_organization");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
};

// Ambil organization_id aktif (string atau object)
const getActiveOrgId = () => {
  const sel = getSelectedOrganization();
  if (!sel) return "";
  if (typeof sel === "object" && sel?.organization_id) return String(sel.organization_id);
  return String(sel);
};

// Header auth standar (ikutkan X-Organization-Id juga)
const authHeaders = () => {
  const token = getCleanToken();
  const orgId = getActiveOrgId();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { "X-Organization-Id": orgId } : {}),
  };
};

// ID generator aman
const safeUUID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${Date.now().toString(16)}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

// Ubah array fields -> object expectation dengan menjaga urutan
const fieldsToExpectationObject = (fields, forcedOrder = []) => {
  if (!Array.isArray(fields)) return {};
  const base = {};
  fields.forEach((f) => {
    const k = (f?.key || f?.label || "").toString().trim();
    const v = (f?.value || "text").toString().trim();
    if (k) base[k] = v || "text";
  });
  if (!forcedOrder?.length) return base;

  const ordered = {};
  forcedOrder.forEach((k) => {
    if (k in base) ordered[k] = base[k];
  });
  Object.keys(base).forEach((k) => {
    if (!(k in ordered)) ordered[k] = base[k];
  });
  return ordered;
};

const toSlug = (name) =>
  (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

/* ============================
   Template Data (Default)
============================ */
const templates = {
  KTP: {
    icon: <User style={{ width: 24, height: 24 }} />,
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
    icon: <Users style={{ width: 24, height: 24 }} />,
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
    icon: <Baby style={{ width: 24, height: 24 }} />,
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

// Urutan paksa untuk payload "Akta Kelahiran"
const AKTA_KELAHIRAN_FORCED_ORDER = [
  "nomor_akta",
  "nama_anak",
  "jenis_kelamin",
  "tempat_lahir",
  "tanggal_lahir",
  "nama_ayah",
  "nama_ibu",
];

/* ============================
   ExpectationForm
============================ */
const ExpectationForm = ({ fields, setFields }) => {
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
    <div style={expectationFormStyles.container}>
      {safeFields.map((f, i) => (
        <div key={i} style={expectationFormStyles.fieldRow}>
          <input
            type="text"
            placeholder="Field name"
            value={f.key}
            onChange={(e) => updateField(i, "key", e.target.value)}
            style={expectationFormStyles.fieldInput}
          />
          <select
            value={f.value}
            onChange={(e) => updateField(i, "value", e.target.value)}
            style={expectationFormStyles.fieldSelect}
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
            style={expectationFormStyles.removeFieldButton}
            title="Hapus field"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        style={expectationFormStyles.addFieldButton}
      >
        <Plus style={{ width: 16, height: 16, marginRight: 8 }} />
        Tambah Field
      </button>
    </div>
  );
};

/* ============================
   Modal: New Document
============================ */
const NewDocumentModal = ({ isOpen, onClose, onSubmit }) => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [fields, setFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate("");
      setDocumentName("");
      setFields([]);
    }
  }, [isOpen]);

  const handleTemplateSelect = (templateName) => {
    setSelectedTemplate(templateName);

    if (templateName === "Custom") {
      setDocumentName("");
      setFields([{ key: "", value: "" }]);
    } else {
      const tpl = templates[templateName]?.fields || [];
      setDocumentName(templateName);
      setFields(tpl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentName.trim()) return;

    const validFields = (fields || []).filter(f => f.key && f.key.trim() && f.value);
    if (validFields.length === 0) return;

    setIsSubmitting(true);
    try {
      const forcedOrder = documentName.trim() === "Akta Kelahiran"
        ? AKTA_KELAHIRAN_FORCED_ORDER
        : [];
      const expectationObj = fieldsToExpectationObject(validFields, forcedOrder);
      await onSubmit(documentName.trim(), expectationObj);

      setSelectedTemplate("");
      setDocumentName("");
      setFields([]);
      onClose();
    } catch (err) {
      console.error("Error submit new document type:", err);
      alert("Terjadi kesalahan saat membuat tipe dokumen baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const validFields = (fields || []).filter(f => f.key && f.key.trim() && f.value);
  const isFormValid = documentName.trim() && validFields.length > 0;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Tambah Jenis Dokumen Baru</h3>
          <button onClick={onClose} style={modalStyles.closeButton} disabled={isSubmitting}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={modalStyles.content}>
            {/* Template Selection */}
            <div style={modalStyles.section}>
              <label style={modalStyles.sectionLabel}>Pilih Template</label>
              <div style={modalStyles.templateGrid}>
                {Object.entries(templates).map(([templateName, template]) => (
                  <button
                    key={templateName}
                    type="button"
                    onClick={() => handleTemplateSelect(templateName)}
                    style={{
                      ...modalStyles.templateCard,
                      ...(selectedTemplate === templateName ? modalStyles.templateCardActive : {})
                    }}
                    disabled={isSubmitting}
                  >
                    <div style={modalStyles.templateContent}>
                      <div style={{
                        ...modalStyles.templateIconContainer,
                        ...(selectedTemplate === templateName ? modalStyles.templateIconActive : {})
                      }}>
                        {template.icon}
                      </div>
                      <span style={modalStyles.templateName}>{templateName}</span>
                    </div>
                  </button>
                ))}

                {/* Custom Template */}
                <button
                  type="button"
                  onClick={() => handleTemplateSelect("Custom")}
                  style={{
                    ...modalStyles.templateCard,
                    ...modalStyles.customTemplateCard,
                    ...(selectedTemplate === "Custom" ? modalStyles.customTemplateActive : {})
                  }}
                  disabled={isSubmitting}
                >
                  <div style={modalStyles.templateContent}>
                    <div style={{
                      ...modalStyles.templateIconContainer,
                      ...(selectedTemplate === "Custom" ? modalStyles.customIconActive : {})
                    }}>
                      <Settings style={{ width: 24, height: 24 }} />
                    </div>
                    <span style={modalStyles.templateName}>Custom</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Form Section - hanya muncul jika template dipilih */}
            {selectedTemplate && (
              <>
                <div style={modalStyles.section}>
                  <label style={modalStyles.label}>Nama Document Type</label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Data yang ingin di tambahkan"
                    style={modalStyles.input}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div style={modalStyles.section}>
                  <label style={modalStyles.label}>Fields</label>
                  <ExpectationForm
                    fields={fields}
                    setFields={setFields}
                  />
                </div>
              </>
            )}
          </div>

          {selectedTemplate && (
            <div style={modalStyles.footer}>
              <button type="button" onClick={onClose} style={modalStyles.cancelButton} disabled={isSubmitting}>
                Batal
              </button>
              <button
                type="submit"
                style={modalStyles.submitButton}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? "Mengirim..." : "Tambah"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

/* ============================
   Komponen Utama: Expetation
============================ */
const Expetation = ({ onSelect }) => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);

  const getDocumentDisplayInfo = (doc) => {
    const base = (doc?.display_name ?? doc?.nama_tipe ?? "").toString();
    const pretty = base
      ? base.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : "Tanpa Nama";
    return { icon: "📄", name: pretty, fullName: pretty };
  };

  // Normalisasi data dari server "show"
  const normalizeItem = (doc) => {
    const humanName = doc.display_name ?? doc.nama_tipe ?? doc.document_type ?? "";
    const slug = toSlug(humanName);

    let expectationObj = {};
    if (doc.expectation && typeof doc.expectation === "object" && !Array.isArray(doc.expectation)) {
      expectationObj = { ...doc.expectation };
    } else if (Array.isArray(doc.expectation)) {
      expectationObj = fieldsToExpectationObject(doc.expectation);
    } else if (Array.isArray(doc.fields)) {
      expectationObj = fieldsToExpectationObject(doc.fields);
    } else if (templates[humanName]) {
      expectationObj = fieldsToExpectationObject(templates[humanName].fields);
    }

    return {
      id: doc.id ?? doc.data_type_id ?? safeUUID(),
      nama_tipe: slug,
      display_name: humanName,
      expectation: expectationObj,
    };
  };

  /* ============================
     Komunikasi dengan webhook
  ============================ */

  // Kirim org ke /solid-data/show (GET + query + header)
  const sendSelectedOrgToWebhook = async () => {
    try {
      const orgId = getActiveOrgId();
      const url = new URL("https://bot.kediritechnopark.com/webhook/solid-data/show");
      if (orgId) url.searchParams.set("organization_id", orgId);

      await fetch(url.toString(), {
        method: "GET",
        headers: authHeaders(),
      });
    } catch (err) {
      console.error("Gagal mengirim organization_id ke /solid-data/show:", err);
    }
  };

  // Ambil daftar tipe dokumen (ikutkan organization_id)
  const fetchDocumentTypes = async () => {
    try {
      setLoadingDocumentTypes(true);

      const orgId = getActiveOrgId();
      const url = new URL("https://bot.kediritechnopark.com/webhook/solid-data/show");
      if (orgId) url.searchParams.set("organization_id", orgId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: authHeaders(),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const normalized = (Array.isArray(data) ? data : [])
        .filter((doc) => (doc.nama_tipe ?? doc.document_type) !== "INACTIVE")
        .map(normalizeItem);

      setDocumentTypes(normalized);
    } catch (error) {
      console.error("Error fetching document types:", error);
      // fallback dari templates lokal
      const fallback = Object.keys(templates).map((name) =>
        normalizeItem({
          id: safeUUID(),
          nama_tipe: toSlug(name),
          display_name: name,
          fields: templates[name].fields
        })
      );
      setDocumentTypes(fallback);
    } finally {
      setLoadingDocumentTypes(false);
    }
  };

  // Saat mount: 1) kirim organization_id  2) ambil list tipe dokumen
  useEffect(() => {
    (async () => {
      await sendSelectedOrgToWebhook();
      await fetchDocumentTypes();
    })();
  }, []);

  // Hapus tipe dokumen (POST body + header X-Organization-Id)
  const handleDeleteDocumentType = async (id, namaTipe) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus dokumen tipe "${namaTipe}"?`)) {
      try {
        const orgId = getActiveOrgId();
        const response = await fetch("https://bot.kediritechnopark.com/webhook/solid-data/delete-document-type", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            id,
            nama_tipe: namaTipe,
            ...(orgId ? { organization_id: orgId } : {}),
          }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.success) {
          setDocumentTypes((prev) => prev.filter((d) => d.id !== id));
          alert(`Dokumen tipe "${namaTipe}" berhasil dihapus.`);
        } else {
          console.error("Server reported failure:", result);
          alert(`Gagal menghapus dokumen tipe "${namaTipe}": ${result.message || "Respon tidak menunjukkan keberhasilan."}`);
        }
      } catch (error) {
        console.error("Error deleting document type:", error);
        alert(`Terjadi kesalahan saat menghapus dokumen tipe "${namaTipe}". Detail: ${error.message}`);
      } finally {
        setIsEditMode(false);
      }
    }
  };

  // Buat tipe dokumen baru (POST body + header X-Organization-Id)
  const handleNewDocumentSubmit = async (documentName, expectationObj) => {
    try {
      const orgId = getActiveOrgId();

      const resp = await fetch("https://bot.kediritechnopark.com/webhook/create-data-type", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          nama_tipe: documentName,          // EXACT seperti input
          expectation: expectationObj,
          ...(orgId ? { organization_id: orgId } : {}),
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status} ${resp.statusText} - ${text}`);
      }

      await fetchDocumentTypes();
      alert(`Dokumen tipe "${documentName}" berhasil dibuat.`);
    } catch (error) {
      console.error("Error submitting new document type:", error);
      alert(`Terjadi kesalahan saat membuat dokumen tipe "${documentName}".`);
    }
  };

  const handleDocumentTypeSelection = (item) => {
    if (!item) return;
    if (item === "new") {
      setShowNewDocumentModal(true);
    } else {
      onSelect?.(item);
    }
  };

  return (
    <div style={selectionStyles.selectionContainer}>
      <div style={selectionStyles.selectionContent}>
        <div style={selectionStyles.selectionHeader}>
          <h2 style={selectionStyles.selectionTitle}>Pilih Jenis Dokumen</h2>
          <button onClick={() => setIsEditMode(!isEditMode)} style={selectionStyles.editButton}>
            {isEditMode ? "Selesai" : "Edit"}
          </button>
        </div>
        <p style={selectionStyles.selectionSubtitle}>Silakan pilih jenis dokumen yang akan Anda scan</p>

        <div style={selectionStyles.documentGrid}>
          {loadingDocumentTypes ? (
            <div style={selectionStyles.spinnerContainer}>
              <div style={selectionStyles.spinner} />
              <style>{spinnerStyle}</style>
            </div>
          ) : (
            <>
              <button onClick={() => handleDocumentTypeSelection("new")} style={selectionStyles.documentCard}>
                <div style={selectionStyles.documentIconContainer}>
                  <div style={selectionStyles.plusIcon}>+</div>
                </div>
                <div style={selectionStyles.documentLabel}>new</div>
              </button>

              {documentTypes.map((doc) => {
                const displayInfo = getDocumentDisplayInfo(doc);
                return (
                  <div key={doc.id} style={selectionStyles.documentCardWrapper}>
                    <button onClick={() => handleDocumentTypeSelection(doc)} style={selectionStyles.documentCard}>
                      <div style={{ ...selectionStyles.documentIconContainer, backgroundColor: "#f0f0f0" }}>
                        <div style={selectionStyles.documentIcon}>{displayInfo.icon}</div>
                      </div>
                      <div style={selectionStyles.documentLabel}>{displayInfo.name}</div>
                    </button>
                    {isEditMode && (
                      <button
                        style={selectionStyles.deleteIcon}
                        onClick={() => handleDeleteDocumentType(doc.id, doc.nama_tipe)}
                      >
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <NewDocumentModal
        isOpen={showNewDocumentModal}
        onClose={() => setShowNewDocumentModal(false)}
        onSubmit={handleNewDocumentSubmit}
      />
    </div>
  );
};

/* ============================
   Styles
============================ */
const spinnerStyle = `
@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
`;

const expectationFormStyles = {
  container: { marginTop: "10px" },
  fieldRow: { display: "flex", alignItems: "center", marginBottom: "12px", gap: "8px" },
  fieldInput: {
    flex: "2",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.3s ease",
  },
  fieldSelect: {
    flex: "1",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "white",
    cursor: "pointer",
  },
  removeFieldButton: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  addFieldButton: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "10px",
  },
};

const selectionStyles = {
  selectionContainer: {
    display: "flex", justifyContent: "center", alignItems: "center",
    minHeight: "calc(100vh - 70px)", padding: "20px", boxSizing: "border-box", backgroundColor: "#f0f2f5",
  },
  selectionContent: {
    backgroundColor: "white", borderRadius: "16px", padding: "30px", textAlign: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)", maxWidth: "600px", width: "100%",
  },
  selectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  selectionTitle: { fontSize: "28px", fontWeight: "bold", marginBottom: "10px", color: "#333" },
  selectionSubtitle: { fontSize: "16px", color: "#666", marginBottom: "30px" },
  documentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "20px", justifyContent: "center" },
  documentCard: {
    backgroundColor: "#f8f9fa", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", border: "1px solid #e9ecef",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  documentIconContainer: { width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#e0f7fa", display: "flex", justifyContent: "center", alignItems: "center" },
  documentIcon: { fontSize: "30px" },
  plusIcon: { fontSize: "40px", color: "#43a0a7", fontWeight: "200" },
  documentLabel: { fontSize: "15px", fontWeight: "bold", color: "#333", textTransform: "capitalize" },
  spinnerContainer: { display: "flex", justifyContent: "center", alignItems: "center", height: "100px" },
  spinner: { border: "4px solid #f3f3f3", borderTop: "4px solid #429241", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" },
  editButton: { backgroundColor: "#007bff", color: "white", padding: "8px 15px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: "bold", cursor: "pointer" },
  documentCardWrapper: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  deleteIcon: {
    position: "absolute", top: "-10px", right: "-10px", backgroundColor: "#dc3545", color: "white", borderRadius: "50%",
    width: "28px", height: "28px", fontSize: "20px", display: "flex", justifyContent: "center", alignItems: "center",
    cursor: "pointer", border: "2px solid white", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", zIndex: 10,
  },
};

const modalStyles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { backgroundColor: "white", borderRadius: "16px", width: "90%", maxWidth: "600px", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)", maxHeight: "85vh", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 0 20px", borderBottom: "1px solid #e9ecef", marginBottom: "20px" },
  title: { margin: 0, fontSize: "18px", fontWeight: "bold", color: "#333" },
  closeButton: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "gray", padding: 0, width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" },
  content: { padding: "0 20px 20px 20px" },
  section: { marginBottom: "25px" },
  sectionLabel: { display: "block", marginBottom: "15px", fontWeight: "bold", color: "#333", fontSize: "16px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333", fontSize: "14px" },
  input: { width: "100%", padding: "12px", border: "2px solid #e9ecef", borderRadius: "8px", fontSize: "16px", outline: "none", transition: "border-color 0.3s ease", boxSizing: "border-box" },
  templateGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" },
  templateCard: { backgroundColor: "#f8f9fa", borderRadius: "12px", padding: "15px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s ease" },
  templateCardActive: { borderColor: "#007bff", backgroundColor: "#e3f2fd" },
  customTemplateCard: { backgroundColor: "#fff3cd" },
  customTemplateActive: { borderColor: "#ffc107", backgroundColor: "#fff3cd" },
  templateContent: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  templateIconContainer: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e0f7fa", display: "flex", justifyContent: "center", alignItems: "center", transition: "background-color 0.2s ease" },
  templateIconActive: { backgroundColor: "#007bff", color: "white" },
  customIconActive: { backgroundColor: "#ffc107", color: "white" },
  templateName: { fontSize: "12px", fontWeight: "bold", color: "#333", textAlign: "center" },
  footer: { display: "flex", gap: "10px", padding: "20px", borderTop: "1px solid #e9ecef" },
  cancelButton: { flex: 1, padding: "12px", border: "2px solid #e9ecef", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#666" },
  submitButton: { flex: 1, padding: "12px", border: "none", borderRadius: "8px", backgroundColor: "#429241", color: "white", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
};

export default Expetation;
