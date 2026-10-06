import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { useAppData } from '../hooks/useAppData.js';

const departments = ['All', 'Computer Applications', 'Computer Science', 'MCA', 'Mathematics'];

function ClassesPage() {
  const [classes, setClasses] = useAppData('classes');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', department: 'Computer Applications', semester: 'ODD', section: 'A', studentCount: 30, teacher: '' });
  const [toast, setToast] = useState(null);

  const filteredClasses = useMemo(() => classes.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || item.teacher.toLowerCase().includes(query);
    const matchesDepartment = department === 'All' || item.department === department;
    return matchesSearch && matchesDepartment;
  }), [classes, search, department]);

  const openModal = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData({ ...item });
    } else {
      setEditing(null);
      setFormData({ name: '', department: 'Computer Applications', semester: 'ODD', section: 'A', studentCount: 30, teacher: '' });
    }
  };

  const handleSave = () => {
    const record = { ...formData, id: editing?.id || classes.length + 1 };
    if (editing) {
      setClasses(classes.map((item) => (item.id === editing.id ? record : item)));
      setToast('Class updated successfully');
    } else {
      setClasses([record, ...classes]);
      setToast('Class added successfully');
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Remove ${row.name}?`)) {
      setClasses(classes.filter((item) => item.id !== row.id));
      setToast('Class removed successfully');
    }
  };

  const columns = [
    { header: 'Class Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Section', accessor: 'section' },
    { header: 'Student Count', accessor: 'studentCount' },
    { header: 'Class Teacher', accessor: 'teacher' }
  ];

  return (
    <div className="classes-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Class Management</h4>
          <p className="text-muted mb-0">Create and manage academic class groups for each department and semester.</p>
        </div>
        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#classModal" onClick={() => openModal()}>
          <Plus size={16} className="me-2" /> Add Class
        </button>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input className="form-control" type="search" placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={filteredClasses} onEdit={(row) => openModal(row)} onDelete={handleDelete} actions editModalTarget="#classModal" />
      <div className="modal fade" id="classModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editing ? 'Edit Class' : 'Add Class'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Class Name</label><input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="col-md-6"><label className="form-label">Department</label><select className="form-select" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}><option>Computer Applications</option><option>Computer Science</option><option>MCA</option><option>Mathematics</option></select></div>
                <div className="col-md-4"><label className="form-label">Semester</label><select className="form-select" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}><option>ODD</option><option>I</option><option>II</option><option>III</option><option>IV</option><option>V</option><option>VI</option></select></div>
                <div className="col-md-4"><label className="form-label">Section</label><input className="form-control" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} /></div>
                <div className="col-md-4"><label className="form-label">Student Count</label><input type="number" className="form-control" value={formData.studentCount} onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })} /></div>
                <div className="col-12"><label className="form-label">Class Teacher</label><input className="form-control" value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value })} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSave}>{editing ? 'Update Class' : 'Save Class'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ClassesPage;
