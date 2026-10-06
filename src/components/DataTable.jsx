function DataTable({ columns, data, onEdit, onDelete, actions, editModalTarget }) {
  return (
    <div className="table-responsive shadow-sm rounded bg-white">
      <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((col) => (
              <th key={col.accessor}>{col.header}</th>
            ))}
            {actions && <th className="text-end">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4 text-muted">No records found</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id || row.code || row.number || row.studentId}>
                {columns.map((col) => (
                  <td key={col.accessor}>{col.cell ? col.cell(row) : row[col.accessor]}</td>
                ))}
                {actions && (
                  <td className="text-end">
                    {onEdit && (
                      <button type="button" className="btn btn-sm btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target={editModalTarget} onClick={() => onEdit(row)}>
                        Edit
                      </button>
                    )}
                    {onDelete && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
