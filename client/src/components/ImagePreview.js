import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://127.0.0.1:3000";

const ImagePreview = ({ imageUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      try {
        setLoading(true);
        const fileName = imageUrl.split("/").pop();
        const encodedFileName = encodeURIComponent(fileName);

        const response = await axios.get(
          `${BASE_URL}/download/${encodedFileName}`
        );
        setPreviewUrl(response.data.download_url);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching image preview:", err);
        setError("Failed to load image preview");
        setLoading(false);
      }
    };

    if (imageUrl) {
      fetchPresignedUrl();
    }
  }, [imageUrl]);

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div
        className="image-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-preview" onClick={onClose}>
          ×
        </button>
        {loading ? (
          <div className="preview-loading">Loading image...</div>
        ) : error ? (
          <div className="preview-error">{error}</div>
        ) : (
          <img src={previewUrl} alt="Preview" className="preview-image" />
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
