import React from "react";
import FileItem from "./FileItem";

const FileList = ({
  files,
  searchQuery,
  downloadLoading,
  downloadProgress,
  onDownload,
  onDelete,
}) => {
  return (
    <div className="file-list">
      {files.length > 0 ? (
        files.map((fileUrl, index) => (
          <FileItem
            key={index}
            fileUrl={fileUrl}
            downloadLoading={downloadLoading}
            downloadProgress={downloadProgress}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))
      ) : (
        <p className="no-files">
          {searchQuery ? "No matching files found." : "No files uploaded yet."}
        </p>
      )}
    </div>
  );
};

export default FileList;
