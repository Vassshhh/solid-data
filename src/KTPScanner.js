import React, { useEffect, useRef, useState } from "react";
// import PaginatedFormEditable from "./PaginatedFormEditable"; // Assuming this is provided externally or defined above
const STORAGE_KEY = "camera_canvas_gallery";
// Placeholder for PaginatedFormEditable if not provided by user.
// In a real scenario, this would be a separate file.
const PaginatedFormEditable = ({ data, handleSimpan }) => {
  const [editableData, setEditableData] = useState(data);

  useEffect(() => {
    setEditableData(data);
  }, [data]);

  const handleChange = (key, value) => {
    setEditableData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!editableData) return null;

  return (
    <div style={paginatedFormEditableStyles.container}>
      <h3 style={paginatedFormEditableStyles.title}>Form Data</h3>
      {Object.entries(editableData).map(([key, value]) => (
        <div key={key} style={paginatedFormEditableStyles.fieldGroup}>
          <label style={paginatedFormEditableStyles.label}>{key}:</label>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(key, e.target.value)}
            style={paginatedFormEditableStyles.input}
          />
        </div>
      ))}
      <button
        onClick={() => handleSimpan(editableData)}
        style={paginatedFormEditableStyles.saveButton}
      >
        Simpan Data
      </button>
    </div>
  );
};

const paginatedFormEditableStyles = {
  container: {
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#333",
  },
  fieldGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "600",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  saveButton: {
    backgroundColor: "#429241",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "15px",
    width: "100%",
  },
};

// Custom Modal Component for New Document Type
const NewDocumentModal = ({ isOpen, onClose, onSubmit }) => {
  const [documentName, setDocumentName] = useState("");
  const [formFields, setFormFields] = useState([
    { id: crypto.randomUUID(), label: "" },
  ]); // State for dynamic form fields
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
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

    // Ensure all fields have labels
    const hasEmptyField = formFields.some((field) => !field.label.trim());
    if (hasEmptyField) {
      // Use a custom message box instead of alert
      // For this example, I'll just log to console, but in a real app, a modal would appear.
      console.log("Please fill all field labels.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass both documentName and formFields to the onSubmit handler
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
  // const useNavigate = () => { /* Placeholder if react-router-dom is not available */ return () => {}; }; // Uncomment if react-router-dom is fully set up
  // const navigate = useNavigate(); // Uncomment if react-router-dom is fully set up

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]); // This state is not used in the current display logic
  const [fileTemp, setFileTemp] = useState(null);
  const [isFreeze, setIsFreeze] = useState(false);
  const freezeFrameRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [KTPdetected, setKTPdetected] = useState(false); // Not directly used for KTP anymore, but kept for consistency
  const [showDocumentSelection, setShowDocumentSelection] = useState(true);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);

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

  // Removed loadImageToCanvas as it's not directly used in the current flow.

  const handleNewDocumentSubmit = async (documentName, fields) => {
    try {
      const token = localStorage.getItem("token"); // Ensure token is available

      // Kirim ke webhook
      const response = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/newtype",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            document_type: documentName,
            fields: fields, // Include the new dynamic fields
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.status) {
        // Simpan ID dokumen ke localStorage
        localStorage.setItem("document_id", result.document_id);

        // Set nama document type agar lanjut ke kamera
        setSelectedDocumentType(
          result.document_type.toLowerCase().replace(/\s+/g, "_")
        );

        setShowDocumentSelection(false);

        // Lanjutkan ke kamera
        initializeCamera();

        console.log("Document ID:", result.document_id);
        console.log(
          "New Document Type Created:",
          result.document_type,
          "with fields:",
          fields
        );
      } else {
        throw new Error(result.message || "Gagal membuat document type");
      }
    } catch (error) {
      console.error("Error submitting new document type:", error);
      // Use a custom message box instead of alert
      console.log("Gagal membuat dokumen. Coba lagi.");
    }
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

          // Set canvas dimensions to match video stream
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto"; // Maintain aspect ratio

          hiddenCanvas.width = video.videoWidth;
          hiddenCanvas.height = video.videoHeight;

          // Calculate rectangle dimensions based on a common document aspect ratio (e.g., ID card)
          const rectWidth = canvas.width * 0.9;
          const rectHeight = (53.98 / 85.6) * rectWidth; // Standard ID card aspect ratio
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
            // Continue drawing only if document selection is not active
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
      // Handle camera access denied or not available
      // For example, show a message to the user or offer manual upload only.
    }
  };

  useEffect(() => {
    // This effect is for loading gallery images, which isn't directly used
    // in the current display but kept for consistency with original code.
    const savedGallery = localStorage.getItem(STORAGE_KEY);
    if (savedGallery) setGalleryImages(JSON.parse(savedGallery));
  }, []);

  // Modified useEffect to only run when isFreeze changes and camera is initialized
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

      // Start drawing loop whenever isFreeze or cameraInitialized changes
      // and document selection is not active.
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

    // Capture the current frame from the visible canvas to freeze it
    freezeFrameRef.current = visibleCtx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setIsFreeze(true);
    setLoading(true);

    // Draw the video frame onto the hidden canvas for cropping
    hiddenCtx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.floor(width);
    cropCanvas.height = Math.floor(height);
    const cropCtx = cropCanvas.getContext("2d");

    // Draw the cropped portion from the hidden canvas to the crop canvas
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

    setKTPdetected(true); // This variable name might be misleading now, but kept for consistency
    setLoading(false);
    // Continue to OCR etc... (handled by ReadImage)
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

  const ReadImage = async (capturedImage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // Ensure token is available

      // Ubah base64 ke file
      const file = base64ToFile(capturedImage, "image.jpg");

      // Gunakan FormData
      const formData = new FormData();
      formData.append("image", file);
      formData.append("document_type", selectedDocumentType); // Add document type to form data

      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/scan",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // No Content-Type for FormData, browser sets it
          },
          body: formData,
        }
      );

      setLoading(false);

      const data = await res.json();
      if (data.responseCode == 409) {
        console.log("Error 409: Document already registered.");
        setFileTemp({ error: 409 });
        return;
      }
      console.log("Scan Result:", data);

      setFileTemp(data);
    } catch (error) {
      console.error("Failed to read image:", error);
      // Handle error, e.g., show a message to the user
    }
  };

  const handleSaveTemp = async (verifiedData, documentType) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // Ensure token is available

      const formData = new FormData();
      formData.append("data", JSON.stringify(verifiedData));

      if (!documentType) {
        console.error("❌ documentType undefined! Cannot save.");
        setLoading(false);
        return;
      }

      console.log("✅ Saving data for documentType:", documentType);
      formData.append("document_type", documentType);

      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/save",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type is set by browser for FormData
          },
          body: formData,
        }
      );

      setLoading(false);
      const result = await res.json();
      console.log("Save Result:", result);
      if (res.ok && result.status) {
        // Successfully saved, clear temp data and reset camera
        setFileTemp(null);
        setIsFreeze(false);
        setCapturedImage(null);
        setKTPdetected(false);
        // Optionally, go back to document selection or re-initialize camera for new scan
        goBackToSelection();
      } else {
        console.error(
          "Failed to save data:",
          result.message || "Unknown error"
        );
        // Show error message to user
      }
    } catch (err) {
      console.error("Gagal menyimpan ke server:", err);
      // Handle error, e.g., show a message to the user
    }
  };

  const handleDeleteTemp = async () => {
    // This function seems to be for deleting temporary data on the server.
    // The current implementation is commented out and sends `fileTemp` as body.
    // If this is meant to delete a specific temporary scan result, it needs
    // an ID or identifier from `fileTemp`.
    try {
      // Example of how it might be implemented if an ID was available:
      // const tempScanId = fileTemp?.id; // Assuming fileTemp has an ID
      // if (tempScanId) {
      //   await fetch(
      //     `https://bot.kediritechnopark.com/webhook/mastersnapper/delete/${tempScanId}`,
      //     {
      //       method: "DELETE", // Or POST with a specific action
      //       headers: { "Content-Type": "application/json" },
      //     }
      //   );
      // }
      setFileTemp(null);
      setIsFreeze(false);
      setCapturedImage(null);
    } catch (err) {
      console.error("Gagal menghapus dari server:", err);
    }
  };

  // `removeImage` is for galleryImages, which is not currently displayed.
  const removeImage = (index) => {
    const newGallery = [...galleryImages];
    newGallery.splice(index, 1);
    setGalleryImages(newGallery);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGallery));
  };

  // `aspectRatio` is used in `initializeCamera` to calculate rectHeight.
  // const aspectRatio = 53.98 / 85.6; // Already used implicitly in initializeCamera

  const handleManualUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUrl = reader.result;
      setCapturedImage(imageDataUrl);
      setIsFreeze(true); // Freeze the display with the uploaded image

      const image = new Image();
      image.onload = async () => {
        const rectWidth = rectRef.current.width;
        const rectHeight = rectRef.current.height;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Clear canvas and draw the uploaded image, respecting the crop area
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the image to the entire canvas first
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Then draw the rounded rectangle outline
        drawRoundedRect(
          ctx,
          rectRef.current.x,
          rectRef.current.y,
          rectRef.current.width,
          rectRef.current.height,
          rectRef.current.radius
        );

        // Fill outside the rectangle to create the masking effect
        fillOutsideRect(ctx, rectRef.current, canvas.width, canvas.height);

        // Store this state as the freeze frame
        freezeFrameRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Create a separate canvas for the actual cropped image data
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = rectWidth;
        cropCanvas.height = rectHeight;
        const cropCtx = cropCanvas.getContext("2d");

        // Draw the cropped portion from the main canvas to the crop canvas
        cropCtx.drawImage(
          canvas, // Source canvas
          rectRef.current.x,
          rectRef.current.y,
          rectWidth,
          rectHeight,
          0, // Destination x
          0, // Destination y
          rectWidth,
          rectHeight
        );

        setKTPdetected(true); // Indicate that an image is ready for scan
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

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Function to get document display info
  const getDocumentDisplayInfo = (docType) => {
    switch (docType) {
      case "ktp":
        return { icon: "🆔", name: "KTP", fullName: "Kartu Tanda Penduduk" };
      case "kk":
        return { icon: "👨‍👩‍👧‍👦", name: "KK", fullName: "Kartu Keluarga" };
      case "akta_kelahiran":
        return {
          icon: "👶",
          name: "Akta Kelahiran",
          fullName: "Akta Kelahiran",
        };
      case "new": // For the "new" option itself
        return { icon: "✨", name: "New Document", fullName: "Dokumen Baru" };
      default:
        // For dynamically added document types, use the name itself
        return {
          icon: "📄",
          name: docType,
          fullName: docType
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        };
    }
  };

  // Placeholder for `useNavigate` if `react-router-dom` is not used in this environment.
  // If `react-router-dom` is available, uncomment the original `useNavigate`.
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
    // In a real browser environment with react-router-dom, this would be:
    // useNavigate()(path);
  };

  return (
    <div>
      <div style={styles.dashboardHeader}>
        <div style={styles.logoAndTitle}>
          {/* Placeholder for image, ensure it's accessible */}
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
            <h2 style={styles.selectionTitle}>Pilih Jenis Dokumen</h2>
            <p style={styles.selectionSubtitle}>
              Silakan pilih jenis dokumen yang akan Anda scan
            </p>

            {/* New horizontal layout like in the image */}
            <div style={styles.documentGrid}>
              <button
                onClick={() => handleDocumentTypeSelection("new")}
                style={styles.documentCard}
              >
                <div style={styles.documentIconContainer}>
                  <div style={styles.plusIcon}>+</div>
                </div>
                <div style={styles.documentLabel}>new</div>
              </button>

              <button
                onClick={() => handleDocumentTypeSelection("ktp")}
                style={styles.documentCard}
              >
                <div
                  style={{
                    ...styles.documentIconContainer,
                    backgroundColor: "#f0f0f0",
                  }}
                >
                  <div style={styles.documentIcon}>🆔</div>
                </div>
                <div style={styles.documentLabel}>ktp</div>
              </button>

              <button
                onClick={() => handleDocumentTypeSelection("akta_kelahiran")}
                style={styles.documentCard}
              >
                <div
                  style={{
                    ...styles.documentIconContainer,
                    backgroundColor: "#f0f0f0",
                  }}
                >
                  <div style={styles.documentIcon}>👶</div>
                </div>
                <div style={styles.documentLabel}>akta</div>
              </button>

              <button
                onClick={() => handleDocumentTypeSelection("kk")}
                style={styles.documentCard}
              >
                <div
                  style={{
                    ...styles.documentIconContainer,
                    backgroundColor: "#f0f0f0",
                  }}
                >
                  <div style={styles.documentIcon}>👨‍👩‍👧‍👦</div>
                </div>
                <div style={styles.documentLabel}>kk</div>
              </button>
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
            {/* Back button */}
            <button onClick={goBackToSelection} style={styles.backButton}>
              ← Kembali ke Pilihan Dokumen
            </button>

            {!isFreeze ? (
              <>
                <div
                  style={{
                    padding: 10,
                    backgroundColor: "#429241",
                    borderRadius: 15,
                    color: "white",
                    fontWeight: "bold",
                    marginTop: 10,
                    cursor: "pointer", // Add cursor pointer for interactivity
                  }}
                  onClick={shootImage}
                >
                  Ambil Gambar{" "}
                  {getDocumentDisplayInfo(
                    selectedDocumentType
                  ).name.toUpperCase()}
                </div>
                <div style={{ fontWeight: "bold", margin: 10 }}>atau</div>
                <div
                  style={{
                    padding: 10,
                    backgroundColor: "#429241",
                    borderRadius: 15,
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer", // Add cursor pointer for interactivity
                  }}
                  onClick={triggerFileSelect}
                >
                  Upload Gambar
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleManualUpload(e)}
                  style={{ marginRight: 10, display: "none" }}
                />
              </>
            ) : loading ? (
              <div style={styles.spinnerContainer}>
                <div style={styles.spinner} />
                <style>{spinnerStyle}</style>
              </div>
            ) : (
              capturedImage &&
              (!fileTemp || fileTemp.error == undefined) && (
                <div>
                  <h4 style={{ marginTop: 0 }}>Tinjau Gambar</h4>
                  <div
                    style={{
                      padding: 10,
                      backgroundColor: "#429241",
                      borderRadius: 15,
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer", // Add cursor pointer for interactivity
                    }}
                    onClick={() => ReadImage(capturedImage)}
                  >
                    Scan
                  </div>

                  <h4
                    onClick={() => {
                      setFileTemp(null);
                      setIsFreeze(false);
                      setCapturedImage(null); // Clear captured image on delete
                      setKTPdetected(false); // Reset KTP detected state
                    }}
                    style={{ cursor: "pointer", color: "#dc3545" }} // Add styling for delete
                  >
                    Hapus
                  </h4>
                </div>
              )
            )}
            {fileTemp && fileTemp.error != "409" ? (
              <div>
                {/* Header untuk bagian save - sama seperti document selection */}
                <div style={styles.saveHeader}>
                  <div style={styles.saveHeaderContent}>
                    <div style={styles.saveHeaderIcon}>
                      {getDocumentDisplayInfo(selectedDocumentType).icon}
                    </div>
                    <div style={styles.saveHeaderText}>
                      <div style={styles.saveHeaderTitle}>
                        Verifikasi Data{" "}
                        {getDocumentDisplayInfo(selectedDocumentType).name}
                      </div>
                      <div style={styles.saveHeaderSubtitle}>
                        Silakan periksa dan lengkapi data{" "}
                        {getDocumentDisplayInfo(selectedDocumentType).fullName}
                      </div>
                    </div>
                  </div>
                </div>

                <PaginatedFormEditable
                  data={fileTemp}
                  handleSimpan={(data) =>
                    handleSaveTemp(data, selectedDocumentType)
                  }
                />
              </div>
            ) : (
              fileTemp &&
              fileTemp.error == "409" && (
                <>
                  <h4 style={{ color: "#dc3545" }}>Dokumen Sudah Terdaftar</h4>
                  <h4
                    onClick={() => {
                      setFileTemp(null);
                      setIsFreeze(false);
                      setCapturedImage(null); // Clear captured image on delete
                      setKTPdetected(false); // Reset KTP detected state
                    }}
                    style={{ cursor: "pointer", color: "#007bff" }} // Add styling for retry/clear
                  >
                    Coba Lagi
                  </h4>
                </>
              )
            )}
          </div>
        </>
      )}

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={showNewDocumentModal}
        onClose={() => setShowNewDocumentModal(false)}
        onSubmit={handleNewDocumentSubmit}
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
    maxHeight: "80vh", // Limit modal height
    overflowY: "auto", // Enable scrolling for long forms
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
    overflow: "hidden", // Ensures rounded corners apply to children
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
    minHeight: "calc(100vh - 70px)", // Adjust based on header height
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
    backgroundColor: "#e0f7fa", // Light blue for icons
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
    height: "100px", // Adjust as needed
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
};

export default CameraCanvas;
