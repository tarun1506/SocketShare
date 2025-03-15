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

      // Set a timeout to clear the upload status after 30 seconds
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
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
      {/* Upload Box */}
      <div
        className="card shadow-sm p-4 text-center"
        style={{ maxWidth: "500px", width: "100%" }}
      >
        <h4 className="fw-bold mb-3">Upload a File</h4>
        <input
          type="file"
          className="form-control mb-3"
          onChange={handleFileChange}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="btn btn-primary w-100"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div
          className={`alert mt-3 ${
            uploadStatus.success ? "alert-success" : "alert-danger"
          } text-center`}
          style={{ maxWidth: "500px", width: "100%" }}
        >
          {uploadStatus.success ? (
            <p>
              File uploaded!{" "}
              <a
                href={uploadStatus.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View file
              </a>
            </p>
          ) : (
            <p>{uploadStatus.message}</p>
          )}
        </div>
      )}

      {/* File List */}
      <div
        className="mt-5 text-center"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <h3 className="fw-semibold mb-3">Uploaded Files</h3>
        <div className="list-group shadow-sm">
          {files.length > 0 ? (
            files.map((fileUrl, index) => (
              <div
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{fileUrl.split("/").pop()}</span>
                <div>
                  <button
                    onClick={() => handleDownload(fileUrl)}
                    disabled={downloadLoading[fileUrl.split("/").pop()]}
                    className="btn btn-sm btn-primary me-2"
                  >
                    {downloadLoading[fileUrl.split("/").pop()]
                      ? "Downloading..."
                      : "Download"}
                  </button>
                  <button
                    onClick={() => handleDelete(fileUrl)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No files uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
