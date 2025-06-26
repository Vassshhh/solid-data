import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "camera_canvas_gallery";

const CameraCanvas = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [fileTemp, setFileTemp] = useState(null);
  const [isFreeze, setIsFreeze] = useState(false);
  const freezeFrameRef = useRef(null);

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

  useEffect(() => {
    const savedGallery = localStorage.getItem(STORAGE_KEY);
    if (savedGallery) setGalleryImages(JSON.parse(savedGallery));

    const getCameraStream = async () => {
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
              requestAnimationFrame(drawToCanvas);
            };

            drawToCanvas();
          };
        }
      } catch (err) {
        console.error("Gagal mendapatkan kamera:", err);
      }
    };

    getCameraStream();
  }, [isFreeze]);

  const shootImage = () => {
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
  };

  const ReadImage = async (capturedImage) => {
    const imageId = uuidv4();

    try {
      let res = await fetch(
        "https://bot.kediritechnopark.com/webhook/mastersnapper/read",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId, image: capturedImage }),
        }
      );

      const { output } = await res.json();

      // Bersihkan dan parsing JSON dari output
      const jsonString = output
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();

      const data = JSON.parse(jsonString);

      const newImage = {
        imageId,
        NIK: data.NIK || "",
        Nama: data.Nama || "",
        TTL: data.TTL || "",
        Kelamin: data.Kelamin || "",
        Alamat: data.Alamat || "",
        RtRw: data["RT/RW"] || "",
        KelDesa: data["Kel/Desa"] || "",
        Kec: data.Kec || "",
        Agama: data.Agama || "",
        Hingga: data.Hingga || "",
        Pembuatan: data.Pembuatan || "",
        Kota: data["Kota Pembuatan"] || "",
      };

      setFileTemp(newImage);
    } catch (error) {
      console.error("Failed to read image:", error);
    }
  };

  const handleSaveTemp = async () => {
    try {
      await fetch(
        "https://bot.kediritechnopark.com/webhook/mastersnapper/save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileTemp }),
        }
      );

      const updatedGallery = [fileTemp, ...galleryImages];
      setGalleryImages(updatedGallery);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGallery));
      setFileTemp(null);
    } catch (err) {
      console.error("Gagal menyimpan ke server:", err);
    }
  };

  const handleDeleteTemp = async () => {
    try {
      await fetch(
        "https://bot.kediritechnopark.com/webhook/mastersnapper/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileTemp }),
        }
      );

      setFileTemp(null);
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

  const aspectRatio = 53.98 / 85.6;

  const handleManualUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUrl = reader.result;
      setCapturedImage(imageDataUrl);
      setIsFreeze(true);

      // Create an image object from the uploaded file
      const image = new Image();
      image.onload = () => {
        // Get the width of the rounded rectangle from rectRef
        const rectWidth = rectRef.current.width;
        const rectHeight = rectRef.current.height;

        // Create a canvas to draw the uploaded image
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Set the scale factor based on the rectangle width
        const scaleFactor = rectWidth / image.width;

        // Calculate the new height based on the aspect ratio
        const newHeight = image.height * scaleFactor;

        // Clear the canvas and draw the video or freeze frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (isFreeze && freezeFrameRef.current) {
          ctx.putImageData(freezeFrameRef.current, 0, 0);
        } else {
          const video = videoRef.current;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Draw the rounded rectangle
        drawRoundedRect(
          ctx,
          rectRef.current.x,
          rectRef.current.y,
          rectRef.current.width,
          rectRef.current.height,
          rectRef.current.radius
        );

        // Draw the image inside the rounded rectangle
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(
          rectRef.current.x + rectRef.current.radius,
          rectRef.current.y
        );
        ctx.lineTo(
          rectRef.current.x + rectRef.current.width - rectRef.current.radius,
          rectRef.current.y
        );
        ctx.quadraticCurveTo(
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y,
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y + rectRef.current.radius
        );
        ctx.lineTo(
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y + rectRef.current.height - rectRef.current.radius
        );
        ctx.quadraticCurveTo(
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y + rectRef.current.height,
          rectRef.current.x + rectRef.current.width - rectRef.current.radius,
          rectRef.current.y + rectRef.current.height
        );
        ctx.lineTo(
          rectRef.current.x + rectRef.current.radius,
          rectRef.current.y + rectRef.current.height
        );
        ctx.quadraticCurveTo(
          rectRef.current.x,
          rectRef.current.y + rectRef.current.height,
          rectRef.current.x,
          rectRef.current.y + rectRef.current.height - rectRef.current.radius
        );
        ctx.lineTo(
          rectRef.current.x,
          rectRef.current.y + rectRef.current.radius
        );
        ctx.quadraticCurveTo(
          rectRef.current.x,
          rectRef.current.y,
          rectRef.current.x + rectRef.current.radius,
          rectRef.current.y
        );
        ctx.closePath();
        ctx.clip(); // Clip the image within the rounded rectangle

        // Draw the uploaded image inside the clipped region
        ctx.drawImage(
          image,
          rectRef.current.x,
          rectRef.current.y,
          rectWidth,
          newHeight // Height is scaled based on the image's aspect ratio
        );

        ctx.restore();

        // Save the image data into the freeze frame reference
        freezeFrameRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
      };
      image.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid black", maxWidth: "100%", height: "auto" }}
      />
      <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

      {!isFreeze ? (
        <div style={{ marginTop: 10 }}>
          <button onClick={shootImage}>Shoot</button>
          <div style={{ marginBottom: 10 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleManualUpload(e)}
              style={{ marginRight: 10 }}
            />
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setIsFreeze(false)}>Hapus</button>
          <button
            onClick={() => {
              ReadImage(capturedImage);
            }}
          >
            Simpan
          </button>
        </div>
      )}

      {fileTemp && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          <h4>Verifikasi Data</h4>
          <table>
            <tbody>
              {Object.entries(fileTemp).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ paddingRight: 10, fontWeight: "bold" }}>
                    {key}
                  </td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleSaveTemp}
              style={{
                marginRight: 10,
                backgroundColor: "green",
                color: "white",
              }}
            >
              Simpan ke Galeri
            </button>
            <button
              onClick={handleDeleteTemp}
              style={{ backgroundColor: "red", color: "white" }}
            >
              Hapus
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Gallery</h3>
        <div style={{ display: "flex", width: "100%", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 120px)",
              gap: 10,
            }}
          >
            {galleryImages.length === 0 && (
              <p style={{ gridColumn: "1 / -1" }}>
                Belum ada gambar tersimpan.
              </p>
            )}
            {galleryImages.map((item, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: 120,
                  height: 120 * aspectRatio,
                  overflow: "visible",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: "-13px",
                    right: "-13px",
                    background: "rgba(255, 0, 0, 1)",
                    border: "none",
                    color: "white",
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    cursor: "pointer",
                    fontWeight: "bold",
                    lineHeight: "18px",
                    textAlign: "center",
                    padding: 0,
                  }}
                  title={`Hapus gambar ${index + 1}`}
                  aria-label={`Hapus gambar ${index + 1}`}
                >
                  ×
                </button>
                <img
                  src={item.image}
                  alt={`Gallery ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCanvas;
