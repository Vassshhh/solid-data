import React, { useEffect, useState } from "react";

const fieldLabels = {
  nik: "NIK",
  fullName: "Nama Lengkap",
  birthPlace: "Tempat Lahir",
  birthDate: "Tanggal Lahir",
  gender: "Jenis Kelamin",
  address: "Alamat",
  neighborhoodCode: "RT/RW",
  village: "Kelurahan/Desa",
  subDistrict: "Kecamatan",
  religion: "Agama",
  maritalStatus: "Status Perkawinan",
  occupation: "Pekerjaan",
  nationality: "Kewarganegaraan",
  validUntil: "Berlaku Hingga",
  issuedCity: "Kota Terbit",
  issuedDate: "Tanggal Terbit",
  phoneNumber: "No. HP",
  email: "Email",
};

function Modal({ isOpen, onClose, loading, fileTemp, onSave, onDelete }) {
  const [formData, setFormData] = useState({});
  const [step, setStep] = useState(0);

  // ❗️Field yang disembunyikan, bisa diisi sesuai kebutuhan
  const disabledFields = [];

  useEffect(() => {
    if (fileTemp) {
      setFormData(Array.isArray(fileTemp) ? fileTemp[0] : fileTemp);
      setStep(0);
    } else {
      setFormData({});
    }
  }, [fileTemp]);

  if (!isOpen) return null;

  const handleChange = (key, newValue, isDate = false) => {
    setFormData((prev) => ({
      ...prev,
      [key]: isDate ? { ...prev[key], value: newValue } : newValue,
    }));
  };

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return isNaN(d) ? "" : d.toISOString().split("T")[0];
  };

  const renderInput = (key, value) => {
    if (value && typeof value === "object" && value.type === "dateTime") {
      return (
        <input
          type="date"
          value={formatDate(value.value)}
          onChange={(e) => handleChange(key, e.target.value, true)}
          style={styles.input}
        />
      );
    }

    if (key === "address") {
      return (
        <textarea
          rows={2}
          value={value || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          style={{ ...styles.input, resize: "vertical" }}
        />
      );
    }

    return (
      <input
        type="text"
        value={value != null ? value : ""}
        onChange={(e) => handleChange(key, e.target.value)}
        style={styles.input}
      />
    );
  };

  // Langkah-langkah form (per halaman)
  const rawSteps = [
    ["nik", "fullName", "birthPlace", "birthDate"],
    ["gender", "address", "neighborhoodCode", "village", "subDistrict"],
    ["religion", "maritalStatus", "occupation"],
    [
      "nationality",
      "validUntil",
      "issuedCity",
      "issuedDate",
      "phoneNumber",
      "email",
    ],
  ];

  // Filter field yang disable/hide
  const steps = rawSteps.map((fields) =>
    fields.filter((key) => !disabledFields.includes(key))
  );

  // Filter langkah kosong
  const visibleSteps = steps.filter((step) => step.length > 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner} />
            <style>{spinnerStyle}</style>
          </div>
        ) : (
          Object.keys(formData).length > 0 && (
            <>
              <h4>
                Verifikasi Data (Langkah {step + 1} dari {visibleSteps.length})
              </h4>
              <table style={styles.table}>
                <tbody>
                  {visibleSteps[step].map((key) => (
                    <tr key={key} style={styles.tableRow}>
                      <td style={styles.tableLabel}>
                        {fieldLabels[key] || key}
                      </td>
                      <td style={styles.tableInput}>
                        {renderInput(key, formData[key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <button
                  disabled={step === 0}
                  onClick={() => setStep((s) => s - 1)}
                  style={{
                    ...styles.saveButton,
                    opacity: step === 0 ? 0.5 : 1,
                  }}
                >
                  &lt; Sebelumnya
                </button>

                <button
                  disabled={step === visibleSteps.length - 1}
                  onClick={() => setStep((s) => s + 1)}
                  style={{
                    ...styles.saveButton,
                    opacity: step === visibleSteps.length - 1 ? 0.5 : 1,
                  }}
                >
                  Selanjutnya &gt;
                </button>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => onSave(formData)}
                  style={styles.saveButton}
                >
                  Simpan ke Galeri
                </button>
                <button onClick={onDelete} style={styles.deleteButton}>
                  Hapus
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

// Styles dan spinner animation
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    minWidth: 350,
    maxWidth: "90vw",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
  spinnerContainer: {
    textAlign: "center",
    padding: 40,
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: 40,
    height: 40,
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableRow: {
    borderBottom: "1px solid #eee",
  },
  tableLabel: {
    padding: "8px 10px",
    fontWeight: "bold",
    width: "30%",
    verticalAlign: "top",
    textTransform: "capitalize",
  },
  tableInput: {
    padding: "8px 10px",
  },
  input: {
    padding: 6,
    borderRadius: 4,
    border: "1px solid #ccc",
    width: "100%",
  },
  actions: {
    marginTop: 20,
    textAlign: "right",
  },
  saveButton: {
    marginRight: 10,
    backgroundColor: "green",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "red",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
};

const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default Modal;
