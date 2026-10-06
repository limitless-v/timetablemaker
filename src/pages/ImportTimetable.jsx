import { useState } from 'react';
import { UploadCloud, ScanText, CheckCircle2, Pencil, Trash2, Plus } from 'lucide-react';
import { loadAppState, saveAppState } from '../services/storageService.js';
import { createVersionRecord, persistVersions } from '../services/timetableVersionService.js';
import { parseTimetableImage } from '../services/imageParserService.js';
import { detectConflicts } from '../services/conflictService.js';

const fallbackRows = [
  { id: 'fallback-1', day: 'Monday', time: '09:00 AM – 09:55 AM', subject: 'AI & ML', faculty: 'Ms. Ambily Sajeev', room: 'N 101' },
  { id: 'fallback-2', day: 'Monday', time: '10:00 AM – 10:55 AM', subject: 'Operating Research', faculty: 'Ms. Rekha PR', room: 'N 102' }
];

function loadOCRScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('OCR is only available in the browser.'));
    if (window.Tesseract) return resolve(window.Tesseract);

    const existing = document.querySelector('script[data-classmate-ocr="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract), { once: true });
      existing.addEventListener('error', () => reject(new Error('OCR script failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.dataset.classmateOcr = 'true';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('OCR script failed to load.'));
    document.head.appendChild(script);
  });
}

function ImportTimetable() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrRows, setOcrRows] = useState(fallbackRows);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setStatus(`Selected ${file.name}.`);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleOcr = async () => {
    setError('');
    setStatus('Running OCR extraction...');

    try {
      if (!previewUrl) {
        setStatus('Please select an image before running OCR.');
        setError('No image has been uploaded yet.');
        return;
      }

      const Tesseract = await loadOCRScript();
      const result = await Tesseract.recognize(previewUrl, 'eng');
      const extracted = result?.data?.text || '';
      const rows = parseTimetableImage(extracted);
      setOcrRows(rows.length > 0 ? rows : fallbackRows);
      setRawText(extracted || 'OCR extracted text is empty.');
      setStatus('OCR completed. Review the extracted timetable before import.');
    } catch (ocrError) {
      setOcrRows(fallbackRows);
      setRawText('OCR was not available. Manual review required.');
      setError(ocrError instanceof Error ? ocrError.message : 'Unable to extract timetable data.');
      setStatus('OCR could not complete. Review placeholder rows manually.');
    }
  };

  const updateRow = (id, field, value) => {
    setOcrRows((currentRows) => currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setOcrRows((currentRows) => [...currentRows, { id: `new-${Date.now()}`, day: 'Monday', time: '09:00 - 09:55', subject: 'New Subject', faculty: 'New Faculty', room: 'N101' }]);
  };

  const deleteRow = (id) => {
    setOcrRows((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const importRows = () => {
    const appState = loadAppState();
    const entries = ocrRows.map((row) => ({
      id: row.id,
      day: row.day,
      startTime: row.time.split('-')[0].trim(),
      endTime: row.time.split('-')[1]?.trim() || '09:55',
      subject: row.subject,
      faculty: row.faculty,
      room: row.room,
      source: 'ocr-import'
    }));

    const version = createVersionRecord({
      name: `Imported timetable - ${selectedFile?.name || 'manual'}`,
      entries,
      source: 'image-upload',
      status: 'draft'
    });

    const validation = detectConflicts(entries, appState);
    const nextVersions = persistVersions([...(appState.versions || []), version]);
    saveAppState({
      ...appState,
      versions: nextVersions,
      importedTimetables: [...(appState.importedTimetables || []), version],
      generatedTimetable: entries,
      lastGeneratedClass: appState.lastGeneratedClass || 'Imported schedule'
    });

    setStatus(validation.valid ? 'Imported timetable saved and validated without hard conflicts.' : `Imported timetable saved with ${validation.hardConflicts.length} hard conflict(s) for repair.`);
  };

  return (
    <div className="import-page container-fluid py-4">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-1">Import Timetable</h4>
          <p className="text-muted mb-3">Upload an image, review OCR output, edit values, and confirm the import.</p>

          <div className="row g-4">
            <div className="col-lg-5">
              <label className="form-label">Timetable image</label>
              <div className="border rounded-3 p-3 text-center bg-light">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="img-fluid rounded" style={{ maxHeight: 320, objectFit: 'contain' }} />
                ) : (
                  <div className="py-5 text-muted">
                    <UploadCloud size={32} className="d-block mx-auto mb-3" />
                    <span>Drag and drop or browse for PNG, JPG, JPEG, or WEBP.</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/png,image/jpg,image/jpeg,image/webp" className="form-control mt-3" onChange={handleFileSelect} />
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={handleOcr}><ScanText size={16} className="me-2" />OCR Extract</button>
                <button className="btn btn-outline-success" onClick={importRows}><CheckCircle2 size={16} className="me-2" />Import</button>
              </div>
              {error && <div className="alert alert-warning mt-3 mb-0">{error}</div>}
              {status && <div className="alert alert-info mt-3 mb-0">{status}</div>}
            </div>

            <div className="col-lg-7">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">OCR Review</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={addRow}><Plus size={16} className="me-2" />Add Row</button>
              </div>
              <p className="text-muted small">Do not trust OCR blindly. Verify day, time, subject, faculty, and room before import.</p>
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr><th>Day</th><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th><th className="text-end">Actions</th></tr>
                  </thead>
                  <tbody>
                    {ocrRows.map((row) => (
                      <tr key={row.id}>
                        <td><input className="form-control form-control-sm" value={row.day} onChange={(event) => updateRow(row.id, 'day', event.target.value)} /></td>
                        <td><input className="form-control form-control-sm" value={row.time} onChange={(event) => updateRow(row.id, 'time', event.target.value)} /></td>
                        <td><input className="form-control form-control-sm" value={row.subject} onChange={(event) => updateRow(row.id, 'subject', event.target.value)} /></td>
                        <td><input className="form-control form-control-sm" value={row.faculty} onChange={(event) => updateRow(row.id, 'faculty', event.target.value)} /></td>
                        <td><input className="form-control form-control-sm" value={row.room} onChange={(event) => updateRow(row.id, 'room', event.target.value)} /></td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => updateRow(row.id, 'faculty', 'Review required')}><Pencil size={14} /></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRow(row.id)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rawText && (
                <div className="mt-3 border rounded bg-light p-3 small text-muted">
                  <strong>Extracted text:</strong>
                  <pre className="mb-0 mt-2" style={{ whiteSpace: 'pre-wrap' }}>{rawText}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportTimetable;
