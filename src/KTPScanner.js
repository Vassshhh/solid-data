import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaginatedFormEditable from "./PaginatedFormEditable"; // Import PaginatedFormEditable
import Modal from "./Modal"; // Import Modal

const STORAGE_KEY = "camera_canvas_gallery";

// Placeholder for PaginatedFormEditable - Removed as it's now imported.
// The actual component definition should be in PaginatedFormEditable.js

// Custom Modal Component for New Document Type
const NewDocumentModal = ({ isOpen, onClose, onSubmit }) => {
  const [documentName, setDocumentName] = useState("");
  const [formFields, setFormFields] = useState([
    { id: crypto.randomUUID(), label: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDocumentName("");
      setFormFields([{ id: crypto.randomUUID(), label: "" }]);
    }
  }, [isOpen]);

  const handleAddField = () => {
    setFormFields([...formFields, { id: crypto.randomUUID(), label: "" }]);
  };

  const handleRemoveField = (idToRemove) => {
    setFormFields(formFields.filter((field) => field.id !== idToRemove));
  };

  const handleFieldLabelChange = (id, newLabel) => {
    setFormFields(
      formFields.map((field) =>
        field.id === id ? { ...field, label: newLabel } : field
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentName.trim()) return;

    const hasEmptyField = formFields.some((field) => !field.label.trim());
    if (hasEmptyField) {
      console.log("Please fill all field labels.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        documentName.trim(),
        formFields.map((field) => ({ label: field.label.trim() }))
      );
      setDocumentName("");
      setFormFields([{ id: crypto.randomUUID(), label: "" }]);
      onClose();
    } catch (error) {
      console.error("Error submitting new document type:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Tambah Jenis Dokumen Baru</h3>
          <button
            onClick={onClose}
            style={modalStyles.closeButton}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={modalStyles.content}>
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

            <h4
              style={{ marginTop: "20px", marginBottom: "10px", color: "#333" }}
            >
              Define Fields for this Document Type:
            </h4>
            {formFields.map((field, index) => (
              <div key={field.id} style={modalStyles.formFieldRow}>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    handleFieldLabelChange(field.id, e.target.value)
                  }
                  placeholder={`Field Name ${index + 1}`}
                  style={modalStyles.fieldInput}
                  disabled={isSubmitting}
                  required
                />
                {formFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    style={modalStyles.removeFieldButton}
                    disabled={isSubmitting}
                  >
                    −
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddField}
              style={modalStyles.addFieldButton}
              disabled={isSubmitting}
            >
              + Add Another Field
            </button>
          </div>
          <div style={modalStyles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={modalStyles.cancelButton}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              style={modalStyles.submitButton}
              disabled={
                isSubmitting ||
                !documentName.trim() ||
                formFields.some((field) => !field.label.trim())
              }
            >
              {isSubmitting ? "Mengirim..." : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CameraCanvas = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [fileTemp, setFileTemp] = useState(null);
  const [isFreeze, setIsFreeze] = useState(false);
  const freezeFrameRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [KTPdetected, setKTPdetected] = useState(false);
  const [showDocumentSelection, setShowDocumentSelection] = useState(true);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false); // New state for edit mode

  // NEW STATES - Added from code 2
  const [isScanned, setIsScanned] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // Added from code 2

  const handleDeleteDocumentType = async (id, documentType) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus dokumen tipe "${documentType}"?`)) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("https://bot.kediritechnopark.com/webhook/solid-data/delete-document-type", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, document_type: documentType }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Delete response:", result);

        // Check for 'success' property from the server response
        if (result.success) {
          setDocumentTypes(prevTypes => prevTypes.filter(doc => doc.id !== id));
          alert(`Dokumen tipe "${documentType}" berhasil dihapus.`);
        } else {
          // Log the full result if success is false to help debug why it's failing
          console.error(`Server reported failure for deleting document type "${documentType}":`, result);
          alert(`Gagal menghapus dokumen tipe "${documentType}": ${result.message || "Respon tidak menunjukkan keberhasilan."}`);
        }
      } catch (error) {
        console.error("Error deleting document type:", error);
        alert(`Terjadi kesalahan saat menghapus dokumen tipe "${documentType}". Detail: ${error.message}`);
      } finally {
        // Ensure edit mode is exited after a delete attempt
        setIsEditMode(false);
      }
    }
  };

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setLoadingDocumentTypes(true);
        const response = await fetch("https://bot.kediritechnopark.com/webhook/solid-data/show");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const activeDocumentTypes = data.filter(doc => doc.document_type !== "INACTIVE");
        setDocumentTypes(activeDocumentTypes);
      } catch (error) {
        console.error("Error fetching document types:", error);
        // Optionally handle error display to user
      } finally {
        setLoadingDocumentTypes(false);
      }
    };

    fetchDocumentTypes();
  }, []);

  const handleDocumentTypeSelection = (type) => {
    if (type === "new") {
      setShowNewDocumentModal(true);
    } else {
      setSelectedDocumentType(type);
      setShowDocumentSelection(false);
      initializeCamera();
    }
  };

  const fileInputRef = useRef(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleNewDocumentSubmit = async (documentName, fields) => {
    try {
      const token = localStorage.getItem("token");

      // Construct the prompt based on fields
      const fieldJson = fields.map(field => `  "${field.label.toLowerCase().replace(/\s+/g, '_')}": "string"`).join(",\n");
      const promptContent = `Ekstrak data ${documentName} dan kembalikan dalam format JSON object tunggal berikut:\n\n{\n${fieldJson}\n}\n\nATURAN PENTING:\n- Kembalikan HANYA object JSON tunggal {...}, BUKAN array [{...}]\n- Gunakan format tanggal sederhana YYYY-MM-DD (jika ada field tanggal)\n- Jangan tambahkan penjelasan atau teks lain\n- Pastikan semua field diisi berdasarkan data yang terdeteksi`;

      const [dataResponse, promptResponse] = await Promise.all([
        fetch("https://bot.kediritechnopark.com/webhook/solid-data/newtype-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            document_type: documentName,
            fields: fields,
          }),
        }),
        fetch("https://bot.kediritechnopark.com/webhook/solid-data/newtype-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            document_type: documentName,
            prompt: promptContent,
          }),
        }),
      ]);

      const dataResult = await dataResponse.json();
      const promptResult = await promptResponse.json();

      console.log("Server response for newtype-data:", dataResult);
      console.log("Server response for newtype-prompt:", promptResult);

      // Re-fetch document types to update the list, regardless of success or failure
      const fetchDocumentTypes = async () => {
        try {
          setLoadingDocumentTypes(true);
          const response = await fetch("https://bot.kediritechnopark.com/webhook/solid-data/show");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const activeDocumentTypes = data.filter(doc => doc.document_type !== "INACTIVE");
          setDocumentTypes(activeDocumentTypes);
        } catch (error) {
          console.error("Error re-fetching document types:", error);
        } finally {
          setLoadingDocumentTypes(false);
        }
      };
      await fetchDocumentTypes(); // Re-fetch after creation attempt

      // Always show success notification as requested
      alert(`Dokumen tipe "${documentName}" berhasil dibuat (atau percobaan pembuatan selesai).`);

      // The following states and onClose should be handled by NewDocumentModal's handleSubmit
      // setSelectedDocumentType(
      //   documentName.toLowerCase().replace(/\s+/g, "_")
      // );
      // setShowDocumentSelection(false);
      // initializeCamera();

      console.log("New Document Type Creation Attempt Finished:", documentName, "with fields:", fields);
    } catch (error) {
      // Log the error for debugging, but still show a "success" message to the user as requested
      console.error("Error submitting new document type:", error);
      alert(`Dokumen tipe "${documentName}" berhasil dibuat (atau percobaan pembuatan selesai).`); // Still show success as requested
    }
    // Removed the finally block from here, as state resets and onClose belong to NewDocumentModal
  };

  const rectRef = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 20,
  });

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

          rectRef.current = {
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            radius: 20,
          };

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
              if (isFreeze) {
                fillOutsideRect(
                  ctx,
                  rectRef.current,
                  canvas.width,
                  canvas.height
                );
              }
            }
            if (!showDocumentSelection) {
              requestAnimationFrame(drawToCanvas);
            }
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
    const savedGallery = localStorage.getItem(STORAGE_KEY);
    if (savedGallery) setGalleryImages(JSON.parse(savedGallery));
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
          if (isFreeze) {
            fillOutsideRect(ctx, rectRef.current, canvas.width, canvas.height);
          }
        }
        if (!showDocumentSelection) {
          requestAnimationFrame(drawToCanvas);
        }
      };

      if (!showDocumentSelection) {
        drawToCanvas();
      }
    }
  }, [isFreeze, cameraInitialized, showDocumentSelection]);

  const shootImage = async () => {
    const video = videoRef.current;
    const { x, y, width, height } = rectRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const hiddenCtx = hiddenCanvas.getContext("2d");
    const visibleCtx = canvasRef.current.getContext("2d");

    freezeFrameRef.current = visibleCtx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
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

    setKTPdetected(true);
    setLoading(false);
  };

  function base64ToFile(base64Data, fileName) {
    const arr = base64Data.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }

  // MODIFIED ReadImage function - Updated to match code 2's approach
  const ReadImage = async (capturedImage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const file = base64ToFile(capturedImage, "image.jpg");

      const formData = new FormData();
      formData.append("image", file);
      // Re-added document_type to formData as per user's request
      formData.append("document_type", selectedDocumentType);

      // FIXED: Use the same endpoint as code 2 for consistent data processing
      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/scan", // Changed to solid-data/scan
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      setLoading(false);

      const data = await res.json();
      if (data.responseCode == 409) {
        console.log(409); // Changed log message to match user's working snippet
        setFileTemp({ error: 409 });
        setIsScanned(true); // Added from code 2
        return;
      }
      console.log(data); // Changed log message to match user's working snippet

      setFileTemp(data);
      setIsScanned(true); // Added from code 2 - Hide review buttons after scan
    } catch (error) {
      console.error("Failed to read image:", error);
      setIsScanned(true); // Added from code 2 - Hide buttons even on error
    }
  };

  // MODIFIED handleSaveTemp function - Updated to match code 2's approach
  const handleSaveTemp = async (verifiedData, documentType) => { // Re-added documentType parameter
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("data", JSON.stringify(verifiedData));
      formData.append("document_type", documentType); // Re-added document_type to formData

      // Use the same endpoint as code 2 for consistent saving
      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/save", // Changed to solid-data/save
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Jangan set Content-Type secara manual untuk FormData
          },
          body: formData,
        }
      );

      setLoading(false);
      // Removed result parsing as it's not in the user's working snippet for this part
      // const result = await res.json();
      // console.log("Save Result:", result);
      
      // if (res.ok && result.status) { // Removed conditional check
        // SUCCESS HANDLING - Added from code 2
        setFileTemp(null);
        setShowSuccessMessage(true); // Show success message

        // Hide success message after 3 seconds and reset states
        setTimeout(() => {
          setShowSuccessMessage(false);
          setIsFreeze(false);
          setIsScanned(false);
          setCapturedImage(null);
          // setKTPdetected(false); // Removed as it's not in the user's working snippet
          // Optionally go back to selection or reset for new scan
          // goBackToSelection();
        }, 3000);
      // } else { // Removed else block
      //   console.error(
      //     "Failed to save data:",
      //     result.message || "Unknown error"
      //   );
      // }
    } catch (err) {
      console.error("Gagal menyimpan ke server:", err);
      setLoading(false);
    }
  };

  const handleDeleteTemp = async () => {
    try {
      // Aligned with user's working snippet for delete
      await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/delete", // Changed to solid-data/delete
        {
          method: "POST", // User's snippet uses POST for delete
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileTemp }), // User's snippet sends fileTemp as body
        }
      );

      setFileTemp(null);
      // Removed setIsFreeze, setCapturedImage, setIsScanned, setShowSuccessMessage as they are handled by handleHapus
      // setIsFreeze(false);
      // setCapturedImage(null);
      // setIsScanned(false);
      // setShowSuccessMessage(false);
    } catch (err) {
      console.error("Gagal menghapus dari server:", err);
    }
  };

  const removeImage = (index) => {
    const newGallery = [...galleryImages];
    newGallery.splice(index, 1);
    setGalleryImages(newGallery);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGallery));
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

        freezeFrameRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

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

        setKTPdetected(true);
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
    setKTPdetected(false);
    setIsScanned(false); // Added from code 2
    setShowSuccessMessage(false); // Added from code 2

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // NEW FUNCTION - Added from code 2
  const handleHapus = () => {
    setFileTemp(null);
    setIsFreeze(false);
    setIsScanned(false);
    setCapturedImage(null);
    setShowSuccessMessage(false);
    setKTPdetected(false);
    // Also stop camera stream if active - Added from user's working snippet
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const getDocumentDisplayInfo = (docType) => {
    const foundDoc = documentTypes.find(doc => doc.document_type === docType);
    if (foundDoc) {
      return {
        icon: "📄", // Generic icon for fetched types, or could be dynamic if provided by API
        name: foundDoc.document_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        fullName: foundDoc.document_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      };
    }

    switch (docType) {
      case "new":
        return { icon: "✨", name: "New Document", fullName: "Dokumen Baru" };
      default:
        return {
          icon: "📄",
          name: docType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          fullName: docType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        };
    }
  };

  return (
    <div>
      <div style={styles.dashboardHeader}>
        <div style={styles.logoAndTitle}>
          <img
            src="https://placehold.co/40x40/429241/white?text=LOGO"
            alt="Bot Avatar"
            style={styles.logo}
          />
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
                  navigate("/profile");
                  setIsMenuOpen(false);
                }}
                style={styles.dropdownItem}
              >
                Profile
              </button>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMenuOpen(false);
                }}
                style={styles.dropdownItem}
              >
                Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {showDocumentSelection ? (
        <div style={styles.selectionContainer}>
          <div style={styles.selectionContent}>
            <div style={styles.selectionHeader}> {/* New div for header */}
              <h2 style={styles.selectionTitle}>Pilih Jenis Dokumen</h2>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                style={styles.editButton}
              >
                {isEditMode ? "Selesai" : "Edit"}
              </button>
            </div>
            <p style={styles.selectionSubtitle}>
              Silakan pilih jenis dokumen yang akan Anda scan
            </p>

            <div style={styles.documentGrid}>
              {loadingDocumentTypes ? (
                <div style={styles.spinnerContainer}>
                  <div style={styles.spinner} />
                  <style>{spinnerStyle}</style>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleDocumentTypeSelection("new")}
                    style={styles.documentCard}
                  >
                    <div style={styles.documentIconContainer}>
                      <div style={styles.plusIcon}>+</div>
                    </div>
                    <div style={styles.documentLabel}>new</div>
                  </button>
                  {documentTypes.map((doc) => {
                    const displayInfo = getDocumentDisplayInfo(doc.document_type);
                    return (
                      <div key={doc.id} style={styles.documentCardWrapper}> {/* Wrapper for card and delete icon */}
                        <button
                          onClick={() => handleDocumentTypeSelection(doc.document_type)}
                          style={styles.documentCard}
                        >
                          <div
                            style={{
                              ...styles.documentIconContainer,
                              backgroundColor: "#f0f0f0",
                            }}
                          >
                            <div style={styles.documentIcon}>{displayInfo.icon}</div>
                          </div>
                          <div style={styles.documentLabel}>{displayInfo.name}</div>
                        </button>
                        {isEditMode && (
                          <button
                            style={styles.deleteIcon}
                            onClick={() => handleDeleteDocumentType(doc.id, doc.document_type)}
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
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ display: "none" }}
          />
          <canvas
            ref={canvasRef}
            style={{ maxWidth: "100%", height: "auto" }}
          />
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

            {/* SUCCESS MESSAGE - Added from code 2 */}
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
                <div
                  style={{ display: "flex", justifyContent: "center", gap: "50px" }}
                >
                  <div
                    style={{
                      padding: 10,
                      backgroundColor: "#ef4444", // Changed color to match user's working snippet
                      borderRadius: 15,
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                    onClick={shootImage}
                  >
                    Ambil Gambar
                  </div>
                  <div
                    style={{
                      padding: 10,
                      backgroundColor: "#ef4444", // Changed color to match user's working snippet
                      borderRadius: 15,
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                    onClick={triggerFileSelect}
                  >
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
              capturedImage &&
              (!fileTemp || fileTemp.error == undefined) &&
              !isScanned && ( // MODIFIED: Hide when isScanned is true (from code 2)
                <div>
                  <h4 style={{ marginTop: 0 }}>Tinjau Gambar</h4>
                  <div
                    style={{
                      padding: 10,
                      backgroundColor: "#ef4444", // Changed color to match user's working snippet
                      borderRadius: 15,
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginBottom: "10px",
                    }}
                    onClick={() => ReadImage(capturedImage)}
                  >
                    Scan
                  </div>

                  <h4
                    style={{ cursor: "pointer" }} // Removed color to match user's working snippet
                    onClick={handleHapus} // MODIFIED: Use handleHapus from code 2
                  >
                    Hapus
                  </h4>
                </div>
              )
            )}
            
            {/* DATA DISPLAY SECTION - Updated to match code 2's approach */}
            {fileTemp && fileTemp.error != "409" ? (
              <PaginatedFormEditable
                data={fileTemp}
                handleSimpan={(data) => handleSaveTemp(data, selectedDocumentType)} // Re-added selectedDocumentType
              />
            ) : (
              fileTemp && (
                <>
                  <h4>KTP Sudah Terdaftar</h4> {/* Changed text to match user's working snippet */}
                  <h4
                    style={{ cursor: "pointer" }} // Removed color to match user's working snippet
                    onClick={handleHapus} // MODIFIED: Use handleHapus from code 2
                  >
                    Hapus
                  </h4>
                </>
              )
            )}
          </div>
        </>
      )}

      <NewDocumentModal
        isOpen={showNewDocumentModal}
        onClose={() => setShowNewDocumentModal(false)}
        onSubmit={handleNewDocumentSubmit}
      />

      {/* Modal component from user's working snippet */}
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

const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Modal styles
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 20px 0 20px",
    borderBottom: "1px solid #e9ecef",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    padding: "0",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: "0 20px 20px 20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#333",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "2px solid #e9ecef",
    borderRadius: "8px",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box",
  },
  formFieldRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    gap: "10px",
  },
  fieldInput: {
    flexGrow: 1,
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  removeFieldButton: {
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    fontSize: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  addFieldButton: {
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  },
  footer: {
    display: "flex",
    gap: "10px",
    padding: "20px",
    borderTop: "1px solid #e9ecef",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    border: "2px solid #e9ecef",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#666",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  submitButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#429241",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
};

const styles = {
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e9ecef",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  logoAndTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
  },
  h1: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdownToggle: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    minWidth: "120px",
    zIndex: 100,
    marginTop: "10px",
    overflow: "hidden",
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    padding: "10px 15px",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "16px",
    color: "#333",
    transition: "background-color 0.2s",
  },
  selectionContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 70px)",
    padding: "20px",
    boxSizing: "border-box",
    backgroundColor: "#f0f2f5",
  },
  selectionContent: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "30px",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    width: "100%",
  },
  selectionTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  selectionSubtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "30px",
  },
  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "20px",
    justifyContent: "center",
  },
  documentCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    border: "1px solid #e9ecef",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  documentIconContainer: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#e0f7fa",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  documentIcon: {
    fontSize: "30px",
  },
  plusIcon: {
    fontSize: "40px",
    color: "#43a0a7",
    fontWeight: "200",
  },
  documentLabel: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#333",
    textTransform: "capitalize",
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
  saveHeader: {
    backgroundColor: "#e0f7fa",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  saveHeaderContent: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  saveHeaderIcon: {
    fontSize: "30px",
  },
  saveHeaderText: {
    textAlign: "left",
  },
  saveHeaderTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#212529",
  },
  saveHeaderSubtitle: {
    fontSize: "14px",
    color: "#495057",
  },
  selectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  editButton: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "8px 15px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  documentCardWrapper: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  deleteIcon: {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    backgroundColor: "#dc3545",
    color: "white",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    fontSize: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    border: "2px solid white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    zIndex: 10,
  },
};

export default CameraCanvas;
