function ToastMessage({ message, variant = 'success', onClose }) {
  return (
    <div className={`toast align-items-center text-bg-${variant} show position-fixed bottom-0 end-0 m-3`} role="alert">
      <div className="d-flex">
        <div className="toast-body">{message}</div>
        <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={onClose}></button>
      </div>
    </div>
  );
}

export default ToastMessage;
