function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay d-flex flex-column align-items-center justify-content-center p-4 rounded shadow-sm bg-white">
      <div className="spinner-border text-primary mb-3" role="status"><span className="visually-hidden">Loading...</span></div>
      <div className="text-muted">{message}</div>
    </div>
  );
}

export default LoadingSpinner;
