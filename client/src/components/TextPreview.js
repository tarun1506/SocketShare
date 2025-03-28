import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://127.0.0.1:3000";

const TextPreview = ({ fileUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const fileName = fileUrl.split("/").pop();

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        setLoading(true);
        const encodedFileName = encodeURIComponent(fileName);

        // Get the presigned URL
        const response = await axios.get(
          `${BASE_URL}/download/${encodedFileName}`
        );
        const downloadUrl = response.data.download_url;

        // Fetch the content using the presigned URL
        const contentResponse = await axios.get(downloadUrl, {
          responseType: "text",
        });

        setContent(contentResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching text content:", err);
        setError("Failed to load text content");
        setLoading(false);
      }
    };

    if (fileUrl) {
      fetchTextContent();
    }
  }, [fileUrl, fileName]);

  return (
    <div className="text-preview-overlay" onClick={onClose}>
      <div
        className="text-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-preview-header">
          <h3>{fileName}</h3>
          <button className="close-preview" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="text-preview-content">
          {loading ? (
            <div className="preview-loading">Loading content...</div>
          ) : error ? (
            <div className="preview-error">{error}</div>
          ) : (
            <pre className="text-content">{content}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextPreview;
