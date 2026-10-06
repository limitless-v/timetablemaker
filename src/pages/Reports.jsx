import { useState } from 'react';
import { FileText, Printer, Download } from 'lucide-react';
import ToastMessage from '../components/ToastMessage.jsx';
import { getStoredTimetable } from '../services/timetableService.js';

const reports = [
  { title: 'Weekly Timetable Report', description: 'Summary of generated weekly schedules.' },
  { title: 'Faculty Workload Report', description: 'Faculty teaching and availability overview.' },
  { title: 'Room Utilization Report', description: 'Room occupancy and usage trends.' },
  { title: 'Subject Allocation Report', description: 'Subject mapping across classes and faculty.' },
  { title: 'Conflict Report', description: 'Detected scheduling conflicts and resolutions.' }
];

function exportReportFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function Reports() {
  const [toast, setToast] = useState(null);
  const performAction = (label) => {
    if (label === 'Print report') {
      window.print();
      setToast('Print dialog opened.');
    } else if (label === 'Export PDF' || label === 'Export Excel') {
      const timetable = getStoredTimetable();
      const payload = {
        generatedAt: new Date().toISOString(),
        timetableCount: timetable.length,
        entries: timetable
      };
      exportReportFile(`${label.toLowerCase().replace(/\s+/g, '-')}.json`, JSON.stringify(payload, null, 2));
      setToast(`${label} generated successfully.`);
    } else {
      setToast(`${label} completed.`);
    }
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="reports-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4>Reports & Export</h4>
          <p className="text-muted mb-0">View and demo-export academic timetable reports.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-primary" onClick={() => performAction('View report')}>View</button>
          <button className="btn btn-outline-secondary" onClick={() => performAction('Print report')}><Printer size={16} className="me-2" />Print</button>
          <button className="btn btn-outline-success" onClick={() => performAction('Export PDF')}><FileText size={16} className="me-2" />Export PDF</button>
          <button className="btn btn-outline-info" onClick={() => performAction('Export Excel')}><Download size={16} className="me-2" />Export Excel</button>
        </div>
      </div>
      <div className="row g-3">
        {reports.map((report) => (
          <div className="col-md-6" key={report.title}>
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5>{report.title}</h5>
                <p className="text-muted">{report.description}</p>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-sm btn-primary" onClick={() => performAction(`View ${report.title}`)}>View</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => performAction(`Export PDF ${report.title}`)}>PDF</button>
                  <button className="btn btn-sm btn-outline-success" onClick={() => performAction(`Export Excel ${report.title}`)}>Excel</button>
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

export default Reports;
