import React from "react";

const DeleteConfirmationDialog = ({
  dialogRef,
  deleteModal,
  onCancel,
  onConfirm,
}) => {
  return (
    <dialog ref={dialogRef} className="delete-dialog">
      <div className="dialog-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this file?</p>
        <p className="filename">{deleteModal.fileUrl?.split("/").pop()}</p>
        <div className="dialog-buttons">
          <button className="dialog-button cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="dialog-button delete"
            onClick={() => onConfirm(deleteModal.fileUrl)}
          >
            Delete
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteConfirmationDialog;
