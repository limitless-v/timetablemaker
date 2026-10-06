import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

const departments = ['All', 'Computer Applications', 'Computer Science', 'MCA', 'Mathematics'];

function Faculty() {
  const [data, setData] = useAppData('faculty');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', department: 'Computer Science', designation: '', availability: '', subjects: '' });
  const [editing, setEditing] = useState(null);

  const filteredData = useMemo(() => data.filter((row) => {
    const searchValue = search.toLowerCase();
    const matchesSearch = row.name.toLowerCase().includes(searchValue) || (row.email || '').toLowerCase().includes(searchValue);
    const matchesDepartment = department === 'All' || row.department === department;
    return matchesSearch && matchesDepartment;
  }), [data, search, department]);

  const openModal = (faculty = null) => {
    if (faculty) {
      setEditing(faculty);
      setFormData({
        name: faculty.name,
        email: faculty.email,
        phone: faculty.phone || '',
        department: faculty.department,
        designation: faculty.designation,
        availability: faculty.availability,
        subjects: faculty.subjects.join(', ')
      });
    } else {
      setEditing(null);
      setFormData({ name: '', email: '', phone: '', department: 'Computer Science', designation: '', availability: '', subjects: '' });
    }
  };

  const handleSave = () => {
    const record = {
      id: editing?.id || data.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      designation: formData.designation,
      availability: formData.availability,
      subjects: formData.subjects.split(',').map((item) => item.trim()),
      status: 'Active'
    };

    if (editing) {
      setData(data.map((row) => (row.id === editing.id ? record : row)));
      setToast('Faculty updated successfully');
    } else {
      setData([record, ...data]);
      setToast('Faculty added successfully');
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      setData(data.filter((item) => item.id !== row.id));
      setToast('Faculty removed');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Faculty Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Subjects', accessor: 'subjects', cell: (row) => row.subjects.join(', ') },
    { header: 'Availability', accessor: 'availability' },
    { header: 'Status', accessor: 'status', cell: (row) => <span className={`badge bg-${row.status === 'Active' ? 'success' : 'secondary'}`}>{row.status}</span> }
  ];

  return (
    <div className="faculty-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Faculty Management</h4>
          <p className="text-muted mb-0">Manage faculty records, availability, and assignments.</p>
        </div>
        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#facultyModal" onClick={() => openModal()}>
          <Plus size={16} className="me-2" /> Add Faculty
        </button>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input className="form-control" type="search" placeholder="Search faculty..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={filteredData} onEdit={(row) => openModal(row)} onDelete={handleDelete} actions editModalTarget="#facultyModal" />

      <div className="modal fade" id="facultyModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editing ? 'Edit Faculty' : 'Add Faculty'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Faculty Name</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Phone</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Department</label><select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="form-select"><option>Computer Applications</option><option>Computer Science</option><option>MCA</option><option>Mathematics</option></select></div>
                <div className="col-md-6"><label className="form-label">Designation</label><input value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Available Time</label><input value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })} className="form-control" placeholder="Mon-Fri 09:00-16:00" /></div>
                <div className="col-12"><label className="form-label">Subjects</label><input value={formData.subjects} onChange={(e) => setFormData({ ...formData, subjects: e.target.value })} className="form-control" placeholder="Comma separated subjects" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSave}>{editing ? 'Update Faculty' : 'Save Faculty'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Faculty;
