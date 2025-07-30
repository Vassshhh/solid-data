import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ShowImage = () => {
  const { nik } = useParams();
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token not found in localStorage.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://bot.kediritechnopark.com/webhook/ed467164-05c0-4692-bb81-a8f13116bb1b/ktp/img/ikasapta/:nik/${nik}`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch image.");
        }

        const json = await response.json();

        if (json && json[0]?.data) {
          setImageBase64(json[0].data);
        } else {
          throw new Error("Image data not found in response.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [nik]);

  if (loading) return <p>Loading image...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>KTP NIK: {nik}</h2>
      <img
        src={`data:image/jpeg;base64,${imageBase64}`}
        alt={`KTP ${nik}`}
        style={{
          maxWidth: "100%",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
};

export default ShowImage;
