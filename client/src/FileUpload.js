import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./styles.css";

// Import Components
import StatusMessage from "./components/StatusMessage";
import UploadArea from "./components/UploadArea";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";
import DeleteConfirmationDialog from "./components/DeleteConfirmationDialog";
import ImagePreview from "./components/ImagePreview";

const BASE_URL = process.env.REACT_APP_BASE_URL ?? "http://127.0.0.1:3000";
const TIMEOUT_DURATION = 3000;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Main FileUpload Component
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
  const [previewImage, setPreviewImage] = useState(null);

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
  const handleSearchChange = (query) => {
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

  const handlePreview = (fileUrl) => {
    console.log("Previewing image:", fileUrl);
    setPreviewImage(fileUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="file-upload-container">
      {/* Upload Box */}
      <UploadArea
        file={file}
        setFile={setFile}
        dragActive={dragActive}
        setDragActive={setDragActive}
        handleUpload={handleUpload}
        loading={loading}
        uploadProgress={uploadProgress}
      />

      {/* Upload Status */}
      <StatusMessage status={uploadStatus} />

      {/* File List with Search */}
      <div className="files-section">
        <div className="files-header">
          <h3>Files</h3>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            searchLoading={searchLoading}
          />
        </div>
        <FileList
          files={files}
          searchQuery={searchQuery}
          downloadLoading={downloadLoading}
          downloadProgress={downloadProgress}
          onDownload={handleDownload}
          onDelete={confirmDelete}
          onPreview={handlePreview}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        dialogRef={dialogRef}
        deleteModal={deleteModal}
        onCancel={cancelDelete}
        onConfirm={handleDelete}
      />

      {/* Image Preview */}
      {previewImage && (
        <ImagePreview imageUrl={previewImage} onClose={closePreview} />
      )}
    </div>
  );
};

export default FileUpload;
