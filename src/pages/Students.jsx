import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

const departments = ['All', 'Computer Applications', 'Computer Science', 'MCA', 'Mathematics'];

function Students() {
  const [students, setStudents] = useAppData('students');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', department: 'Computer Applications', semester: 'ODD', className: '', email: '', status: 'Active' });
  const [toast, setToast] = useState(null);

  const filteredStudents = useMemo(() => students.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
    const matchesDepartment = department === 'All' || item.department === department;
    return matchesSearch && matchesDepartment;
  }), [students, search, department]);

  const openModal = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData({ ...item });
    } else {
      setEditing(null);
      setFormData({ id: '', name: '', department: 'Computer Applications', semester: 'ODD', className: '', email: '', status: 'Active' });
    }
  };

  const handleSave = () => {
    const record = { ...formData };
    if (editing) {
      setStudents(students.map((item) => (item.id === editing.id ? record : item)));
      setToast('Student updated successfully');
    } else {
      setStudents([record, ...students]);
      setToast('Student added successfully');
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      setStudents(students.filter((item) => item.id !== row.id));
      setToast('Student removed successfully');
    }
  };

  const columns = [
    { header: 'Student ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Class', accessor: 'className' },
    { header: 'Email', accessor: 'email' },
    { header: 'Status', accessor: 'status', cell: (row) => <span className={`badge bg-${row.status === 'Active' ? 'success' : 'secondary'}`}>{row.status}</span> }
  ];

  return (
    <div className="students-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Student Management</h4>
          <p className="text-muted mb-0">Manage student records and class assignments.</p>
        </div>
        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#studentModal" onClick={() => openModal()}>
          <Plus size={16} className="me-2" /> Add Student
        </button>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input className="form-control" type="search" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={filteredStudents} onEdit={(row) => openModal(row)} onDelete={handleDelete} actions editModalTarget="#studentModal" />

      <div className="modal fade" id="studentModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editing ? 'Edit Student' : 'Add Student'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Student ID</label><input className="form-control" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Name</label><input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Department</label><select className="form-select" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}><option>Computer Applications</option><option>Computer Science</option><option>MCA</option><option>Mathematics</option></select></div>
                <div className="col-md-6"><label className="form-label">Semester</label><select className="form-select" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}><option>ODD</option><option>I</option><option>II</option><option>III</option><option>IV</option><option>V</option><option>VI</option></select></div>
                <div className="col-md-6"><label className="form-label">Class</label><input className="form-control" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Status</label><select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option>Active</option><option>Inactive</option></select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSave}>{editing ? 'Update Student' : 'Save Student'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Students;
