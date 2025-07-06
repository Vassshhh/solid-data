import React, { useState } from "react";

// Helper to format ISO date
const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

const isDateField = (value) =>
  value && typeof value === "object" && value.type === "dateTime";

const PaginatedFormEditable = ({ data, handleSimpan }) => {
  const [formData, setFormData] = useState(() => {
    const flat = {};
    Object.entries(data[0]).forEach(([key, value]) => {
      if (isDateField(value)) {
        flat[key] = formatDate(value.value);
      } else {
        flat[key] = value;
      }
    });
    return flat;
  });

  const fields = Object.keys(formData).filter(
    (key) => key.toLowerCase() !== "total"
  );
  const fieldsPerPage = 3;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(fields.length / fieldsPerPage);

  const handleChange = (key, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const startIndex = page * fieldsPerPage;
  const currentFields = fields.slice(startIndex, startIndex + fieldsPerPage);

  return (
    <div>
      {currentFields.map((key) => (
        <div key={key} style={{ marginBottom: 10, textAlign: "left" }}>
          <label
            style={{
              fontWeight: "bold",
              textTransform: "capitalize",
              textAlign: "left",
              display: "block",
              marginBottom: 5,
            }}
          >
            {key}
          </label>

          {/* Tanggal */}
          {["Tanggal Lahir", "Berlaku Hingga", "Tanggal Dibuat"].includes(
            key
          ) ? (
            formData[key] ? (
              <input
                type="date"
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 5,
                  border: "1px solid #ddd",
                }}
              />
            ) : (
              <div
                style={{
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 5,
                  backgroundColor: "#f9f9f9",
                }}
              >
                Seumur Hidup{" "}
                <button
                  onClick={() =>
                    handleChange(key, new Date().toISOString().split("T")[0])
                  }
                  style={{
                    marginLeft: 10,
                    padding: "4px 8px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Isi Tanggal
                </button>
              </div>
            )
          ) : (
            // Input biasa
            <input
              type="text"
              value={formData[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 5,
                border: "1px solid #ddd",
              }}
            />
          )}
        </div>
      ))}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
        >
          Back
        </button>

        <button onClick={() => handleSimpan(formData)}>Simpan</button>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginatedFormEditable;
