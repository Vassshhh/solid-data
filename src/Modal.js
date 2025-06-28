import React from "react";

const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default function Modal({ isOpen, onClose, loading, children }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner} />
            <style>{spinnerStyle}</style>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

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
};
