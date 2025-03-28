import React from "react";
import ProgressBar from "./ProgressBar";

const UploadArea = ({
  file,
  setFile,
  dragActive,
  setDragActive,
  handleUpload,
  loading,
  uploadProgress,
}) => {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  return (
    <div
      className={`upload-area ${dragActive ? "drag-active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="upload-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 512 512"
        >
          <path
            d="M320,367.79h76c55,0,100-29.21,100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69,0-113.44,45.79-128,91.2-60,5.7-112,43.88-112,106.4s54,106.4,120,106.4h56"
            style={{
              fill: "none",
              stroke: "currentColor",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "32px",
            }}
          />
          <polyline
            points="320 255.79 256 191.79 192 255.79"
            style={{
              fill: "none",
              stroke: "currentColor",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "32px",
            }}
          />
          <line
            x1="256"
            y1="448.21"
            x2="256"
            y2="207.79"
            style={{
              fill: "none",
              stroke: "currentColor",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "32px",
            }}
          />
        </svg>
      </div>
      <p className="upload-text">
        {file ? file.name : "Drag & drop a file or click to browse"}
      </p>
      <input
        type="file"
        id="file-input"
        className="file-input"
        onChange={handleFileChange}
      />
      <label htmlFor="file-input" className="file-input-label">
        Choose File
      </label>
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`upload-button ${!file || loading ? "disabled" : ""}`}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {loading && <ProgressBar progress={uploadProgress} />}
    </div>
  );
};

export default UploadArea;
