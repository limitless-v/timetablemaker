function EmptyState({ title = 'No Data Available', description = 'Use the controls above to add or search records.', action }) {
  return (
    <div className="empty-state border rounded p-5 text-center bg-white shadow-sm">
      <h4 className="mb-2 text-dark">{title}</h4>
      <p className="text-muted mb-4">{description}</p>
      {action}
    </div>
  );
}

export default EmptyState;
