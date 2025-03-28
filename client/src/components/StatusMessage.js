import React from "react";

const StatusMessage = ({ status }) => {
  if (!status) return null;

  return (
    <div className={`status-message ${status.success ? "success" : "error"}`}>
      {status.success ? (
        <p>File uploaded successfully!</p>
      ) : (
        <p>{status.message}</p>
      )}
    </div>
  );
};

export default StatusMessage;
