import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaginatedFormEditable from "./PaginatedFormEditable";
import Modal from "./Modal";
import Expetation from "./Expetation";

const spinnerStyle = `
@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
`;

const ctaBtn = {
  padding: 10,
  backgroundColor: "#ef4444",
  borderRadius: 15,
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "10px",
};

const styles = {
  dashboardHeader: {
    backgroundColor: "var(--white)",
    color: "var(--text-primary)",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "var(--shadow-sm)",
    borderBottom: "3px solid #43a0a7",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(8px)",
  },
  logoAndTitle: { display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 },
  logo: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "0.75rem",
    marginRight: "0.75rem",
    objectFit: "cover",
  },
  h1: {
    margin: "2px",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#43a0a7",
    letterSpacing: "-0.025em",
  },
  dropdownContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexShrink: 0,
  },
  dropdownToggle: {
    backgroundColor: "#f5f5f5",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontSize: "1rem",
    minWidth: "2.5rem",
    height: "2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    backgroundColor: "white",
    borderRadius: "0.75rem",
    boxShadow:
      "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    minWidth: "10rem",
    overflow: "hidden",
    padding: "0.5rem",
    marginTop: "0.5rem",
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#0f172a",
    transition: "background-color 0.2s ease",
    borderRadius: "0.5rem",
    marginBottom: "0.125rem",
  },
  backButton: {
    backgroundColor: "#6c757d",
    color: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "15px",
    width: "100%",
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100px",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #429241",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
};

/* ============================
   ORG & AUTH HELPERS
============================ */
const getCleanToken = () => {
  let raw = localStorage.getItem("token") || "";
  try { raw = JSON.parse(raw); } catch {}
  return String(raw).replace(/^"+|"+$/g, "");
};

// Baca org dari localStorage: pake 'selected_organization' dulu, fallback 'select_organization'
const getSelectedOrganization = () => {
  let raw =
    localStorage.getItem("selected_organization") ??
    localStorage.getItem("select_organization");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
};

// Ambil organization_id aktif (string / dari object)
const getActiveOrgId = () => {
  const sel = getSelectedOrganization();
  if (!sel) return "";
  if (typeof sel === "object" && sel?.organization_id) return String(sel.organization_id);
  return String(sel);
};

// Header umum (JANGAN set Content-Type untuk FormData)
const authHeaders = ({ isJson = false } = {}) => {
  const token = getCleanToken();
  const orgId = getActiveOrgId();
  const base = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { "X-Organization-Id": orgId } : {}),
  };
  return isJson ? { "Content-Type": "application/json", ...base } : base;
};

const KTPScanner = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [fileTemp, setFileTemp] = useState(null);
  const [isFreeze, setIsFreeze] = useState(false);
  const freezeFrameRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [showDocumentSelection, setShowDocumentSelection] = useState(true);
  // selectedDocumentType menyimpan OBJEK dokumen (dari Expetation), termasuk expectation
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const [isScanned, setIsScanned] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const triggerFileSelect = () => fileInputRef.current?.click();

  const rectRef = useRef({ x: 0, y: 0, width: 0, height: 0, radius: 20 });

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const fillOutsideRect = (ctx, rect, canvasWidth, canvasHeight) => {
    ctx.save();
    const { x, y, width, height, radius } = rect;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "rgba(173, 173, 173, 1)";
    ctx.fill("evenodd");
    ctx.restore();
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const hiddenCanvas = hiddenCanvasRef.current;
          const ctx = canvas.getContext("2d");

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";

          hiddenCanvas.width = video.videoWidth;
          hiddenCanvas.height = video.videoHeight;

          const rectWidth = canvas.width * 0.9;
          const rectHeight = (53.98 / 85.6) * rectWidth;
          const rectX = (canvas.width - rectWidth) / 2;
          const rectY = (canvas.height - rectHeight) / 2;

          rectRef.current = { x: rectX, y: rectY, width: rectWidth, height: rectHeight, radius: 20 };

          const drawToCanvas = () => {
            if (video.readyState === 4) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (isFreeze && freezeFrameRef.current) {
                ctx.putImageData(freezeFrameRef.current, 0, 0);
              } else {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              }
              drawRoundedRect(
                ctx,
                rectRef.current.x,
                rectRef.current.y,
                rectRef.current.width,
                rectRef.current.height,
                rectRef.current.radius
              );
              if (isFreeze) fillOutsideRect(ctx, rectRef.current, canvas.width, canvas.height);
            }
            if (!showDocumentSelection) requestAnimationFrame(drawToCanvas);
          };

          drawToCanvas();
          setCameraInitialized(true);
        };
      }
    } catch (err) {
      console.error("Gagal mendapatkan kamera:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (cameraInitialized) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const drawToCanvas = () => {
        if (video && video.readyState === 4) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (isFreeze && freezeFrameRef.current) {
            ctx.putImageData(freezeFrameRef.current, 0, 0);
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          drawRoundedRect(
            ctx,
            rectRef.current.x,
            rectRef.current.y,
            rectRef.current.width,
            rectRef.current.height,
            rectRef.current.radius
          );
          if (isFreeze) fillOutsideRect(ctx, rectRef.current, canvas.width, canvas.height);
        }
        if (!showDocumentSelection) requestAnimationFrame(drawToCanvas);
      };

      if (!showDocumentSelection) drawToCanvas();
    }
  }, [isFreeze, cameraInitialized, showDocumentSelection]);

  const shootImage = async () => {
    const video = videoRef.current;
    const { x, y, width, height } = rectRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const hiddenCtx = hiddenCanvas.getContext("2d");
    const visibleCtx = canvasRef.current.getContext("2d");

    freezeFrameRef.current = visibleCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setIsFreeze(true);
    setLoading(true);

    hiddenCtx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.floor(width);
    cropCanvas.height = Math.floor(height);
    const cropCtx = cropCanvas.getContext("2d");

    cropCtx.drawImage(
      hiddenCanvas,
      Math.floor(x),
      Math.floor(y),
      Math.floor(width),
      Math.floor(height),
      0,
      0,
      Math.floor(width),
      Math.floor(height)
    );

    const imageDataUrl = cropCanvas.toDataURL("image/png", 1.0);
    setCapturedImage(imageDataUrl);

    setLoading(false);
  };

  function base64ToFile(base64Data, fileName) {
    const arr = base64Data.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], fileName, { type: mime });
  }

  // Scan (kirim image + expectation + organization_id)
  const ReadImage = async (capturedImage) => {
    try {
      setLoading(true);
      const token = getCleanToken();
      const orgId = getActiveOrgId();
      const file = base64ToFile(capturedImage, "image.jpg");

      const formData = new FormData();
      formData.append("image", file);

      // Kirim expectation (bukan sekadar document_type)
      const expectation = selectedDocumentType?.expectation || {};
      formData.append("expectation", JSON.stringify(expectation));

      // (opsional) jika backend masih butuh identifier tipe
      if (selectedDocumentType?.document_type) {
        formData.append("document_type", selectedDocumentType.document_type);
      }

      // >>> penting: sertakan organization_id
      if (orgId) formData.append("organization_id", orgId);

      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/scan",
        {
          method: "POST",
          headers: authHeaders(), // JANGAN set Content-Type (biar FormData yang atur)
          body: formData,
        }
      );

      setLoading(false);

      const data = await res.json();
      if (data.responseCode === 409) {
        setFileTemp({ error: 409 });
        setIsScanned(true);
        return;
      }
      setFileTemp(data);
      setIsScanned(true);
    } catch (error) {
      console.error("Failed to read image:", error);
      setIsScanned(true);
    }
  };

  // SAVE (tambahkan organization_id)
  const handleSaveTemp = async (verifiedData, documentType) => {
    try {
      setLoading(true);
      const token = getCleanToken();
      const orgId = getActiveOrgId();

      const formData = new FormData();
      formData.append("data", JSON.stringify(verifiedData));
      formData.append("document_type", documentType || "");

      // >>> penting: sertakan organization_id
      if (orgId) formData.append("organization_id", orgId);

      await fetch("https://bot.kediritechnopark.com/webhook/solid-data/save", {
        method: "POST",
        headers: authHeaders(), // Authorization + X-Organization-Id
        body: formData,
      });

      setLoading(false);
      setFileTemp(null);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setIsFreeze(false);
        setIsScanned(false);
        setCapturedImage(null);
      }, 3000);
    } catch (err) {
      console.error("Gagal menyimpan ke server:", err);
      setLoading(false);
    }
  };

  // DELETE temp (sertakan organization_id)
  const handleDeleteTemp = async () => {
    try {
      const orgId = getActiveOrgId();
      await fetch("https://bot.kediritechnopark.com/webhook/solid-data/delete", {
        method: "POST",
        headers: authHeaders({ isJson: true }),
        body: JSON.stringify({
          fileTemp,
          ...(orgId ? { organization_id: orgId } : {}),
        }),
      });
      setFileTemp(null);
    } catch (err) {
      console.error("Gagal menghapus dari server:", err);
    }
  };

  const handleManualUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUrl = reader.result;
      setCapturedImage(imageDataUrl);
      setIsFreeze(true);

      const image = new Image();
      image.onload = async () => {
        const rectWidth = rectRef.current.width;
        const rectHeight = rectRef.current.height;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        drawRoundedRect(
          ctx,
          rectRef.current.x,
          rectRef.current.y,
          rectRef.current.width,
          rectRef.current.height,
          rectRef.current.radius
        );
        fillOutsideRect(ctx, rectRef.current, canvas.width, canvas.height);

        freezeFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = rectWidth;
        cropCanvas.height = rectHeight;
        const cropCtx = cropCanvas.getContext("2d");

        cropCtx.drawImage(
          canvas,
          rectRef.current.x,
          rectRef.current.y,
          rectWidth,
          rectHeight,
          0,
          0,
          rectWidth,
          rectHeight
        );
      };
      image.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const goBackToSelection = () => {
    setShowDocumentSelection(true);
    setSelectedDocumentType(null);
    setCameraInitialized(false);
    setIsFreeze(false);
    setCapturedImage(null);
    setFileTemp(null);
    setIsScanned(false);
    setShowSuccessMessage(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleHapus = () => {
    setFileTemp(null);
    setIsFreeze(false);
    setIsScanned(false);
    setCapturedImage(null);
    setShowSuccessMessage(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // selection callback from Expetation (menerima OBJEK dokumen)
  const handleSelectDocumentType = (doc) => {
    setSelectedDocumentType(doc);
    setShowDocumentSelection(false);
    initializeCamera();
  };

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div>
      <div style={styles.dashboardHeader}>
        <div style={styles.logoAndTitle}>
          <img src="/ikasapta.png" alt="Bot Avatar" style={styles.logo} />
          <h1 style={styles.h1}>SOLID</h1>
          <h1 style={{ ...styles.h1, color: "#43a0a7" }}>DATA</h1>
        </div>

        <div style={styles.dropdownContainer} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.dropdownToggle}
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-haspopup="true"
          >
            <svg
              width="15"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {isMenuOpen && (
            <div style={styles.dropdownMenu}>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMenuOpen(false);
                }}
                style={styles.dropdownItem}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                style={styles.dropdownItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showDocumentSelection ? (
        <Expetation onSelect={handleSelectDocumentType} />
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
          <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
          <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              textAlign: "center",
              bottom: 0,
              width: "100%",
              position: "absolute",
              padding: "20px",
            }}
          >
            <button onClick={goBackToSelection} style={styles.backButton}>
              ← Kembali ke Pilihan Dokumen
            </button>

            {showSuccessMessage ? (
              <div
                style={{
                  padding: "20px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#22c55e",
                  textAlign: "center",
                }}
              >
                Data berhasil disimpan
              </div>
            ) : !isFreeze ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", gap: "50px" }}>
                  <div style={ctaBtn} onClick={shootImage}>
                    Ambil Gambar
                  </div>
                  <div style={ctaBtn} onClick={triggerFileSelect}>
                    Upload Gambar
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleManualUpload(e)}
                  style={{ display: "none" }}
                />
              </>
            ) : loading ? (
              <div style={styles.spinnerContainer}>
                <div style={styles.spinner} />
                <style>{spinnerStyle}</style>
              </div>
            ) : (
              capturedImage && (!fileTemp || fileTemp.error === undefined) && !isScanned && (
                <div>
                  <h4 style={{ marginTop: 0 }}>Tinjau Gambar</h4>
                  <div style={ctaBtn} onClick={() => ReadImage(capturedImage)}>
                    Scan
                  </div>

                  <h4 style={{ cursor: "pointer" }} onClick={handleHapus}>
                    Hapus
                  </h4>
                </div>
              )
            )}

            {fileTemp && fileTemp.error !== "409" ? (
              <PaginatedFormEditable
                data={fileTemp}
                handleSimpan={(data) =>
                  handleSaveTemp(data, selectedDocumentType?.document_type || "")
                }
              />
            ) : (
              fileTemp && (
                <>
                  <h4>KTP Sudah Terdaftar</h4>
                  <h4 style={{ cursor: "pointer" }} onClick={handleHapus}>
                    Hapus
                  </h4>
                </>
              )
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        loading={loading}
        fileTemp={fileTemp}
        onSave={handleSaveTemp}
        onDelete={handleDeleteTemp}
      />
    </div>
  );
};

export default KTPScanner;
