import React from "react";

const FileItem = ({
  fileUrl,
  downloadLoading,
  downloadProgress,
  onDownload,
  onDelete,
}) => {
  const fileName = fileUrl.split("/").pop();
  const isDownloading = downloadLoading[fileName];
  const downloadPercent = downloadProgress[fileName] || 0;

  return (
    <div className="file-item">
      <div className="file-name">{fileName}</div>
      <div className="file-actions">
        <button
          onClick={() => onDownload(fileUrl)}
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
              <span className="download-percent">{downloadPercent}%</span>
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
          onClick={() => onDelete(fileUrl)}
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
};

export default FileItem;
