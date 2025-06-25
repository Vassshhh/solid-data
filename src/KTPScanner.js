import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "camera_canvas_gallery";

const CameraCanvas = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // visible canvas
  const hiddenCanvasRef = useRef(null); // hidden canvas for capture
  const [capturedImage, setCapturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isFreeze, setIsFreeze] = useState(false);
  const freezeFrameRef = useRef(null); // menyimpan freeze frame imageData

  // Fungsi untuk gambar rounded rectangle
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

  // Fungsi untuk mewarnai area luar rectangle dengan hitam semi transparan
  const fillOutsideRect = (ctx, rect, canvasWidth, canvasHeight) => {
    ctx.save();

    const { x, y, width, height, radius } = rect;

    // Buat path rounded rectangle
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

    // Buat clipping inverse area (area luar rectangle)
    ctx.rect(0, 0, canvasWidth, canvasHeight);

    // Fill dengan mode 'evenodd' supaya area di luar path rectangle terisi
    ctx.fillStyle = "rgba(173, 173, 173, 1)"; // hitam semi transparan
    ctx.fill("evenodd");

    ctx.restore();
  };

  // Variabel global untuk posisi rectangle dan ukurannya supaya bisa dipakai di shootImage
  const rectRef = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 20,
  });

  useEffect(() => {
    // Load gallery dari localStorage saat pertama kali mount
    const savedGallery = localStorage.getItem(STORAGE_KEY);
    if (savedGallery) {
      setGalleryImages(JSON.parse(savedGallery));
    }

    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();

            const video = videoRef.current;
            const canvas = canvasRef.current; // visible canvas
            const hiddenCanvas = hiddenCanvasRef.current; // hidden canvas
            const ctx = canvas.getContext("2d");

            // Set ukuran canvas sesuai video asli
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Style visible canvas supaya scaled sesuai container dan tidak overflow
            canvas.style.maxWidth = "100%";
            canvas.style.height = "auto";

            hiddenCanvas.width = video.videoWidth;
            hiddenCanvas.height = video.videoHeight;

            // Hitung ukuran rectangle KTP
            const rectWidth = canvas.width * 0.9;
            const rectHeight = (53.98 / 85.6) * rectWidth; // aspek rasio KTP
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
                  // Tampilkan freeze frame yang sudah disimpan
                  ctx.putImageData(freezeFrameRef.current, 0, 0);

                  drawRoundedRect(
                    ctx,
                    rectRef.current.x,
                    rectRef.current.y,
                    rectRef.current.width,
                    rectRef.current.height,
                    rectRef.current.radius
                  );

                  // Overlay area luar rectangle dengan hitam
                  fillOutsideRect(
                    ctx,
                    rectRef.current,
                    canvas.width,
                    canvas.height
                  );
                } else {
                  // Render video live + rectangle
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  drawRoundedRect(
                    ctx,
                    rectRef.current.x,
                    rectRef.current.y,
                    rectRef.current.width,
                    rectRef.current.height,
                    rectRef.current.radius
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;

    // Hitung posisi rectangle sekali
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

    let animationFrameId;

    const drawToCanvas = () => {
      if (video.readyState === 4) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (isFreeze && freezeFrameRef.current) {
          ctx.putImageData(freezeFrameRef.current, 0, 0);

          drawRoundedRect(
            ctx,
            rectRef.current.x,
            rectRef.current.y,
            rectRef.current.width,
            rectRef.current.height,
            rectRef.current.radius
          );

          // Overlay area luar rectangle dengan hitam
          fillOutsideRect(ctx, rectRef.current, canvas.width, canvas.height);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          drawRoundedRect(
            ctx,
            rectRef.current.x,
            rectRef.current.y,
            rectRef.current.width,
            rectRef.current.height,
            rectRef.current.radius
          );
        }
      }
      animationFrameId = requestAnimationFrame(drawToCanvas);
    };

    drawToCanvas();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isFreeze]);

  // Fungsi untuk capture gambar area rectangle dan simpan ke localStorage + freeze effect
  const shootImage = () => {
    const video = videoRef.current;
    const { x, y, width, height } = rectRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const hiddenCtx = hiddenCanvas.getContext("2d");
    const visibleCtx = canvasRef.current.getContext("2d");

    // Ambil image data canvas visible untuk freeze frame
    freezeFrameRef.current = visibleCtx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Aktifkan freeze frame
    setIsFreeze(true);

    // Tangkap gambar video ke hidden canvas
    hiddenCtx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

    // Buat canvas crop
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.floor(width);
    cropCanvas.height = Math.floor(height);
    const cropCtx = cropCanvas.getContext("2d");

    // Crop area rectangle dari hidden canvas
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

  // Fungsi hapus gambar dari gallery
  const removeImage = (index) => {
    const newGallery = [...galleryImages];
    newGallery.splice(index, 1);
    setGalleryImages(newGallery);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGallery));
  };

  // Rasio KTP
  const aspectRatio = 53.98 / 85.6;

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      {/* Canvas visible untuk tampilan */}
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid black", maxWidth: "100%", height: "auto" }}
      />
      {/* Canvas hidden untuk capture full res */}
      <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />
      {!isFreeze ? (
        <div style={{ marginTop: 10 }}>
          <button onClick={shootImage}>Shoot</button>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setIsFreeze(false)}>Hapus</button>
          <button
            onClick={() => {
              setIsFreeze(false);

              const newImage = {
                image: capturedImage, // ini base64
                data: {
                  createdAt: new Date().toISOString(), // atau data lain yang kamu butuh
                  // kamu bisa tambahkan info lain di sini, misalnya lokasi, metadata, dll.
                },
              };

              const newGallery = [newImage, ...galleryImages];
              setGalleryImages(newGallery);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newGallery));
            }}
          >
            Simpan
          </button>
        </div>
      )}
      {/* Gallery */}
      <div style={{ marginTop: 20 }}>
        <h3>Gallery</h3>

        <div
          style={{
            display: "flex",
            width: "100%",
            gap: 10,
          }}
        >
          {/* Galeri: 2 kolom tetap */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 120px)", // 2 kolom tetap
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

          {/* Tombol Next responsif mengisi kekosongan width */}
          {galleryImages.length > 0 && (
            <button
              style={{
                flexGrow: 1,
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 24,
                cursor: "pointer",
              }}
              onClick={() => {
                // Aksi tombol >
              }}
            >
              &gt;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCanvas;
