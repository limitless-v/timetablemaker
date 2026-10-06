import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft } from 'lucide-react';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

function Constraints() {
  const [constraints, setConstraints] = useAppData('constraints');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [toast, setToast] = useState(null);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    setConstraints([{ id: constraints.length + 1, title: newTitle, description: newDescription, active: true }, ...constraints]);
    setNewTitle('');
    setNewDescription('');
    setToast('Constraint added');
  };

  const toggleActive = (item) => {
    setConstraints(constraints.map((constraint) => (constraint.id === item.id ? { ...constraint, active: !constraint.active } : constraint)));
    setToast('Constraint status updated');
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete ${item.title}?`)) {
      setConstraints(constraints.filter((constraint) => constraint.id !== item.id));
      setToast('Constraint deleted');
    }
  };

  return (
    <div className="constraints-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Constraint Management</h4>
          <p className="text-muted mb-0">Define availability, capacity, lab and class constraints for the timetable.</p>
        </div>
        <div className="card p-3 border-0 shadow-sm bg-white" style={{ minWidth: 320 }}>
          <h6 className="mb-3">Add New Constraint</h6>
          <div className="mb-3">
            <label className="form-label">Constraint Title</label>
            <input className="form-control" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Faculty Availability" />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows="3" placeholder="Enter details"></textarea>
          </div>
          <button className="btn btn-primary w-100" onClick={handleAdd}><Plus size={16} className="me-2" /> Add Constraint</button>
        </div>
      </div>
      <div className="row g-3">
        {constraints.map((item) => (
          <div className="col-md-6" key={item.id}>
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1">{item.title}</h5>
                    <p className="text-muted mb-0">{item.description}</p>
                  </div>
                  <span className={`badge bg-${item.active ? 'success' : 'secondary'}`}>{item.active ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => toggleActive(item)}><ToggleLeft size={16} className="me-1" />{item.active ? 'Disable' : 'Enable'}</button>
                  <button className="btn btn-sm btn-outline-secondary"><Pencil size={16} className="me-1" />Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)}><Trash2 size={16} className="me-1" />Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Constraints;
