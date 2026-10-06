import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

const roomTypes = ['All', 'Classroom', 'Computer Lab', 'Laboratory', 'Seminar Hall'];

function Rooms() {
  const [rooms, setRooms] = useAppData('rooms');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ number: '', name: '', building: '', type: 'Classroom', capacity: 30, availability: 'Mon-Fri', status: 'Available' });

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    const query = search.toLowerCase();
    const matchesSearch = room.number.toLowerCase().includes(query) || room.name.toLowerCase().includes(query);
    const matchesType = type === 'All' || room.type === type;
    return matchesSearch && matchesType;
  }), [rooms, search, type]);

  const openModal = (room = null) => {
    if (room) {
      setEditing(room);
      setFormData({ ...room });
    } else {
      setEditing(null);
      setFormData({ number: '', name: '', building: '', type: 'Classroom', capacity: 30, availability: 'Mon-Fri', status: 'Available' });
    }
  };

  const handleSave = () => {
    const record = { ...formData };
    if (editing) {
      setRooms(rooms.map((item) => (item.number === editing.number ? record : item)));
      setToast('Room updated successfully');
    } else {
      setRooms([record, ...rooms]);
      setToast('Room added successfully');
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      setRooms(rooms.filter((item) => item.number !== row.number));
      setToast('Room removed successfully');
    }
  };

  const columns = [
    { header: 'Room Number', accessor: 'number' },
    { header: 'Room Name', accessor: 'name' },
    { header: 'Building', accessor: 'building' },
    { header: 'Room Type', accessor: 'type' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Availability', accessor: 'availability' },
    { header: 'Status', accessor: 'status', cell: (row) => <span className={`badge bg-${row.status === 'Available' ? 'success' : 'secondary'}`}>{row.status}</span> }
  ];

  return (
    <div className="rooms-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Room Management</h4>
          <p className="text-muted mb-0">Manage classroom allocations, lab spaces, and seminar halls.</p>
        </div>
        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#roomModal" onClick={() => openModal()}>
          <Plus size={16} className="me-2" /> Add Room
        </button>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input className="form-control" type="search" placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            {roomTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={filteredRooms} onEdit={(row) => openModal(row)} onDelete={handleDelete} actions editModalTarget="#roomModal" />

      <div className="modal fade" id="roomModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editing ? 'Edit Room' : 'Add Room'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Room Number</label><input className="form-control" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Room Name</label><input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Building</label><input className="form-control" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Room Type</label><select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option>Classroom</option><option>Computer Lab</option><option>Laboratory</option><option>Seminar Hall</option></select></div>
                <div className="col-md-6"><label className="form-label">Capacity</label><input type="number" className="form-control" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} /></div>
                <div className="col-md-6"><label className="form-label">Availability</label><input className="form-control" value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Status</label><select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option>Available</option><option>Occupied</option></select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSave}>{editing ? 'Update Room' : 'Save Room'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Rooms;
