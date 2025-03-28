import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://127.0.0.1:3000";

const PdfPreview = ({ fileUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileName = fileUrl.split("/").pop();

  useEffect(() => {
    const fetchPdfUrl = async () => {
      try {
        setLoading(true);
        const encodedFileName = encodeURIComponent(fileName);

        // Get the presigned URL
        const response = await axios.get(
          `${BASE_URL}/download/${encodedFileName}`
        );
        setPdfUrl(response.data.download_url);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching PDF:", err);
        setError("Failed to load PDF document");
        setLoading(false);
      }
    };

    if (fileUrl) {
      fetchPdfUrl();
    }
  }, [fileUrl, fileName]);

  return (
    <div className="pdf-preview-overlay" onClick={onClose}>
      <div
        className="pdf-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdf-preview-header">
          <h3>{fileName}</h3>
          <button className="close-preview" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="pdf-preview-content">
          {loading ? (
            <div className="preview-loading">Loading PDF document...</div>
          ) : error ? (
            <div className="preview-error">{error}</div>
          ) : (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="pdf-frame"
              allow="fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
