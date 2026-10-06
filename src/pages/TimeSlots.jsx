import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

function TimeSlots() {
  const [slots, setSlots] = useAppData('timeSlots');
  const [newSlot, setNewSlot] = useState('');
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [toast, setToast] = useState(null);

  const handleAdd = () => {
    if (!newSlot.trim()) return;
    const item = { id: slots.length + 1, slot: newSlot, enabled: true };
    setSlots([item, ...slots]);
    setNewSlot('');
    setToast('Time slot added');
  };

  const handleToggle = (item) => {
    setSlots(slots.map((slot) => (slot.id === item.id ? { ...slot, enabled: !slot.enabled } : slot)));
    setToast('Slot status updated');
  };

  const startEdit = (item) => {
    setEditing(item);
    setEditText(item.slot);
  };

  const handleUpdate = () => {
    setSlots(slots.map((slot) => (slot.id === editing.id ? { ...slot, slot: editText } : slot)));
    setEditing(null);
    setToast('Slot updated');
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete ${item.slot}?`)) {
      setSlots(slots.filter((slot) => slot.id !== item.id));
      setToast('Slot removed');
    }
  };

  return (
    <div className="timeslots-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Time Slot Management</h4>
          <p className="text-muted mb-0">Configure weekly lecture timings and enable or disable slots.</p>
        </div>
        <div className="input-group w-100 w-md-auto">
          <input className="form-control" placeholder="Add new slot" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} />
          <button className="btn btn-primary" type="button" onClick={handleAdd}><Plus size={16} /></button>
        </div>
      </div>
      <div className="row g-3">
        {slots.map((slot) => (
          <div className="col-sm-6 col-xl-4" key={slot.id}>
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center justify-content-between gap-3">
                <div>
                  <h6 className="mb-1">{slot.slot}</h6>
                  <span className={`badge bg-${slot.enabled ? 'success' : 'secondary'}`}>{slot.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-outline-primary btn-sm" onClick={() => startEdit(slot)}><Pencil size={16} /></button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(slot)}><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleToggle(slot)}>{slot.enabled ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Time Slot</h5>
                <button type="button" className="btn-close" onClick={() => setEditing(null)}></button>
              </div>
              <div className="modal-body">
                <input className="form-control" value={editText} onChange={(e) => setEditText(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleUpdate}>Update Slot</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TimeSlots;
