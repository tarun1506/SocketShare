import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://127.0.0.1:3000";

const TIMEOUT_DURATION = 3000;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [dragActive, setDragActive] = useState(false);

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/files`);
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

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

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploadStatus({ success: true, url: response.data.file_url });
      fetchFiles(); // Refresh file list after upload
      setFile(null); // Clear the selected file

      // Set a timeout to clear the upload status after 3 seconds
      setTimeout(() => {
        setUploadStatus(null);
      }, TIMEOUT_DURATION);
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.response?.data?.error || "Upload failed",
      });
    }
    setLoading(false);
  };

  // Deletion handler using a URL-safe file name
  const handleDelete = async (fileUrl) => {
    const rawFileName = fileUrl.split("/").pop();
    const fileName = encodeURIComponent(rawFileName);
    try {
      await axiosInstance.delete(`${BASE_URL}/delete/${fileName}`);
      fetchFiles(); // Refresh file list after deletion
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Download handler
  const handleDownload = async (fileUrl) => {
    const rawFileName = fileUrl.split("/").pop();
    const fileName = encodeURIComponent(rawFileName);

    // Set loading state for this specific file
    setDownloadLoading((prev) => ({ ...prev, [rawFileName]: true }));

    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/download/${fileName}`
      );

      // Create a temporary link element to trigger the download
      const downloadUrl = response.data.download_url;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", rawFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    } finally {
      // Clear loading state for this file
      setDownloadLoading((prev) => ({ ...prev, [rawFileName]: false }));
    }
  };

  return (
    <div className="file-upload-container">
      {/* Upload Box */}
      <div
        className={`upload-area ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16L12 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 11L12 8L15 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 16.7428C20 17.2635 19.7761 17.7631 19.3761 18.1184C18.9761 18.4737 18.4422 18.6363 17.9058 18.5637C17.4468 18.5026 17.0354 18.2499 16.7677 17.8683C16.5 17.4867 16.4 17.0181 16.4848 16.5547C16.5612 16.1385 16.7921 15.7559 17.1407 15.4772C17.4893 15.1984 17.9327 15.0414 18.3906 15.0361C18.8484 15.0309 19.2952 15.1776 19.6504 15.4487C20.0056 15.7198 20.2457 16.0973 20.332 16.5116C20.3644 16.6539 20.3812 16.7981 20.382 16.9428"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 20H8C6.89543 20 6 19.1046 6 18V6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
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
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div
          className={`status-message ${
            uploadStatus.success ? "success" : "error"
          }`}
        >
          {uploadStatus.success ? (
            <p>File uploaded successfully!</p>
          ) : (
            <p>{uploadStatus.message}</p>
          )}
        </div>
      )}

      {/* File List */}
      <div className="files-section">
        <h3>Your Files</h3>
        <div className="file-list">
          {files.length > 0 ? (
            files.map((fileUrl, index) => {
              const fileName = fileUrl.split("/").pop();
              return (
                <div key={index} className="file-item">
                  <div className="file-name">{fileName}</div>
                  <div className="file-actions">
                    <button
                      onClick={() => handleDownload(fileUrl)}
                      disabled={downloadLoading[fileName]}
                      className="action-button download"
                      title="Download"
                    >
                      {downloadLoading[fileName] ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 16L12 8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 13L12 16L9 13"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(fileUrl)}
                      className="action-button delete"
                      title="Delete"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 7H20"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 11V16"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 11V16"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 7L9 4H15L16 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-files">No files uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
