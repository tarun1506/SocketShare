import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./styles.css";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    fileUrl: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dialogRef = useRef(null);

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/files`);
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  // Debounced search function
  const searchFiles = useCallback(async (query) => {
    if (query.trim() === "") {
      fetchFiles();
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axiosInstance.get(`${BASE_URL}/search`, {
        params: { query },
      });
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error searching files:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout for the search
    searchTimeoutRef.current = setTimeout(() => {
      searchFiles(query);
    }, 500); // 500ms debounce time
  };

  useEffect(() => {
    fetchFiles();

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setUploadProgress(0);
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
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      if (simulatedProgress < 90) {
        const increment = Math.max(
          1,
          Math.floor((90 - simulatedProgress) / 10)
        );
        simulatedProgress += increment;
        setUploadProgress(simulatedProgress);
      }
    }, 200);

    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const actualProgress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            if (actualProgress > simulatedProgress) {
              setUploadProgress(actualProgress);
            }
          },
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadStatus({ success: true, url: response.data.file_url });
      fetchFiles();
      setFile(null);

      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgress(0);
      }, TIMEOUT_DURATION);
    } catch (error) {
      clearInterval(progressInterval);

      setUploadStatus({
        success: false,
        message: error.response?.data?.error || "Upload failed",
      });
      setUploadProgress(0);
    }
    setLoading(false);
  };

  const handleDelete = async (fileUrl) => {
    const rawFileName = fileUrl.split("/").pop();
    const fileName = encodeURIComponent(rawFileName);
    try {
      await axiosInstance.delete(`${BASE_URL}/delete/${fileName}`);
      fetchFiles();
      setDeleteModal({ show: false, fileUrl: null });
      if (dialogRef.current) {
        dialogRef.current.close();
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const confirmDelete = (fileUrl) => {
    setDeleteModal({ show: true, fileUrl });
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, fileUrl: null });
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  const handleDownload = async (fileUrl) => {
    const rawFileName = fileUrl.split("/").pop();
    const fileName = encodeURIComponent(rawFileName);

    setDownloadLoading((prev) => ({ ...prev, [rawFileName]: true }));
    setDownloadProgress((prev) => ({ ...prev, [rawFileName]: 0 }));

    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/download/${fileName}`
      );

      const downloadUrl = response.data.download_url;

      const downloadResponse = await axiosInstance.get(downloadUrl, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setDownloadProgress((prev) => ({
            ...prev,
            [rawFileName]: percentCompleted,
          }));
        },
      });

      const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", rawFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    } finally {
      setTimeout(() => {
        setDownloadLoading((prev) => ({ ...prev, [rawFileName]: false }));
        setDownloadProgress((prev) => ({ ...prev, [rawFileName]: 0 }));
      }, 500);
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

        {/* Upload Progress Bar */}
        {loading && (
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            >
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          </div>
        )}
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

      {/* File List with Search */}
      <div className="files-section">
        <div className="files-header">
          <h3>Files</h3>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchLoading && (
              <div className="search-loading">
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>
        <div className="file-list">
          {files.length > 0 ? (
            files.map((fileUrl, index) => {
              const fileName = fileUrl.split("/").pop();
              const isDownloading = downloadLoading[fileName];
              const downloadPercent = downloadProgress[fileName] || 0;

              return (
                <div key={index} className="file-item">
                  <div className="file-name">{fileName}</div>
                  <div className="file-actions">
                    <button
                      onClick={() => handleDownload(fileUrl)}
                      disabled={isDownloading}
                      className={`action-button download ${
                        isDownloading ? "downloading" : ""
                      }`}
                      title="Download"
                      style={
                        isDownloading
                          ? {
                              background: `conic-gradient(#4caf50 ${downloadPercent}%, transparent ${downloadPercent}%)`,
                            }
                          : {}
                      }
                    >
                      <div className="button-content">
                        {isDownloading ? (
                          <>
                            <span className="download-percent">
                              {downloadPercent}%
                            </span>
                          </>
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
                      </div>
                    </button>
                    <button
                      onClick={() => confirmDelete(fileUrl)}
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
            <p className="no-files">
              {searchQuery
                ? "No matching files found."
                : "No files uploaded yet."}
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <dialog ref={dialogRef} className="delete-dialog">
        <div className="dialog-content">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this file?</p>
          <p className="filename">{deleteModal.fileUrl?.split("/").pop()}</p>
          <div className="dialog-buttons">
            <button className="dialog-button cancel" onClick={cancelDelete}>
              Cancel
            </button>
            <button
              className="dialog-button delete"
              onClick={() => handleDelete(deleteModal.fileUrl)}
            >
              Delete
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default FileUpload;
