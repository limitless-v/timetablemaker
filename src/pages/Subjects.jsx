import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

const departments = ['All', 'Computer Applications', 'Computer Science', 'MCA', 'Mathematics'];
const sessionTypes = ['Theory', 'Lab', 'Tutorial', 'Project', 'Activity'];

function Subjects() {
  const [data, setData] = useAppData('subjects');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', department: 'Computer Applications', semester: 'I', credits: 3, sessionType: 'Theory', faculty: '' });

  const filteredData = useMemo(() => data.filter((row) => {
    const searchValue = search.toLowerCase();
    const matchesSearch = row.name.toLowerCase().includes(searchValue) || row.code.toLowerCase().includes(searchValue);
    const matchesDepartment = department === 'All' || row.department === department;
    return matchesSearch && matchesDepartment;
  }), [data, search, department]);

  const openModal = (subject = null) => {
    if (subject) {
      setEditing(subject);
      setFormData({ ...subject });
    } else {
      setEditing(null);
      setFormData({ code: '', name: '', department: 'Computer Applications', semester: 'I', credits: 3, sessionType: 'Theory', faculty: '' });
    }
  };

  const handleSave = () => {
    const record = { ...formData };
    if (editing) {
      setData(data.map((row) => (row.code === editing.code ? record : row)));
      setToast('Subject updated');
    } else {
      setData([record, ...data]);
      setToast('Subject added');
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      setData(data.filter((item) => item.code !== row.code));
      setToast('Subject removed');
    }
  };

  const columns = [
    { header: 'Subject Code', accessor: 'code' },
    { header: 'Subject Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Credits', accessor: 'credits' },
    { header: 'Session Type', accessor: 'sessionType' },
    { header: 'Faculty', accessor: 'faculty' }
  ];

  return (
    <div className="subjects-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Subject Management</h4>
          <p className="text-muted mb-0">Add subjects, assign faculty, and manage academic sessions.</p>
        </div>
        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#subjectModal" onClick={() => openModal()}>
          <Plus size={16} className="me-2" /> Add Subject
        </button>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input className="form-control" type="search" placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={filteredData} onEdit={(row) => openModal(row)} onDelete={handleDelete} actions editModalTarget="#subjectModal" />

      <div className="modal fade" id="subjectModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editing ? 'Edit Subject' : 'Add Subject'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Subject Code</label><input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Subject Name</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Department</label><select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="form-select"><option>Computer Applications</option><option>Computer Science</option><option>MCA</option><option>Mathematics</option></select></div>
                <div className="col-md-6"><label className="form-label">Semester</label><select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="form-select"><option>I</option><option>II</option><option>III</option><option>IV</option><option>V</option><option>VI</option></select></div>
                <div className="col-md-6"><label className="form-label">Credits</label><input type="number" min="1" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })} className="form-control" /></div>
                <div className="col-md-6"><label className="form-label">Session Type</label><select value={formData.sessionType} onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })} className="form-select">{sessionTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
                <div className="col-12"><label className="form-label">Assigned Faculty</label><input value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} className="form-control" placeholder="Use faculty names listed in Faculty Management" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSave}>{editing ? 'Update Subject' : 'Save Subject'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Subjects;
