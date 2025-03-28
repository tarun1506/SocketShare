import React, { useState, useEffect } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

const BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://127.0.0.1:3000";

const PdfPreview = ({ fileUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset;
      return Math.min(Math.max(1, newPage), numPages);
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale((prevScale) => Math.min(prevScale + 0.2, 2.5));
  const zoomOut = () => setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  return (
    <div className="pdf-preview-overlay" onClick={onClose}>
      <div
        className="pdf-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdf-preview-header">
          <h3>{fileName}</h3>
          <div className="pdf-controls">
            <div className="pdf-pagination">
              {numPages && (
                <span>
                  Page {pageNumber} of {numPages}
                </span>
              )}
              <button
                onClick={previousPage}
                disabled={pageNumber <= 1 || loading}
                className="pagination-button"
              >
                ‹
              </button>
              <button
                onClick={nextPage}
                disabled={pageNumber >= numPages || loading}
                className="pagination-button"
              >
                ›
              </button>
            </div>
            <div className="pdf-zoom">
              <button
                onClick={zoomOut}
                className="zoom-button"
                title="Zoom out"
              >
                −
              </button>
              <button
                onClick={resetZoom}
                className="zoom-button"
                title="Reset zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button onClick={zoomIn} className="zoom-button" title="Zoom in">
                +
              </button>
            </div>
            <button className="close-preview" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        <div className="pdf-preview-content">
          {loading ? (
            <div className="preview-loading">Loading PDF document...</div>
          ) : error ? (
            <div className="preview-error">{error}</div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setError("Failed to load PDF document")}
              loading={<div className="preview-loading">Loading PDF...</div>}
              error={<div className="preview-error">Failed to load PDF</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="pdf-page"
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
