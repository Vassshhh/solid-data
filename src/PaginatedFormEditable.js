import React, { useState } from "react";

// Helper to format ISO date
const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

const PaginatedFormEditable = ({ data }) => {
  const [formData, setFormData] = useState(() => {
    const flat = {};
    Object.entries(data[0]).forEach(([key, value]) => {
      if (value && typeof value === "object" && "value" in value) {
        flat[key] = formatDate(value.value);
      } else {
        flat[key] = value;
      }
    });
    return flat;
  });

  const fields = Object.keys(formData);
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
            }}
          >
            {key}
          </label>
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
