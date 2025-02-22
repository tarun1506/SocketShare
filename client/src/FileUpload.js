import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:5000";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

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
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.response?.data?.error || "Upload failed",
      });
    }
    setLoading(false);
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
      <h1 className="text-center mb-4 fw-bold">
        Google Drive Clone - File Upload
      </h1>

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
              <a
                key={index}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                {fileUrl.split("/").pop()}
                <span className="badge bg-secondary">View</span>
              </a>
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
