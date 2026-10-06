import { useState } from 'react';
import { loadAppState, saveAppState } from '../services/storageService.js';

function Settings() {
  const [appState] = useState(() => loadAppState());
  const [profile, setProfile] = useState(() => appState.profile || {});
  const [preferences, setPreferences] = useState(() => appState.settings || {});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const current = loadAppState();
    const next = { ...current, profile, settings: preferences };
    saveAppState(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <div className="row g-4">
        <div className="col-xl-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5>Profile</h5>
              <div className="row g-3 mt-3">
                <div className="col-12"><label className="form-label">Full Name</label><input className="form-control" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></div>
                <div className="col-12"><label className="form-label">Email</label><input className="form-control" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
                <div className="col-12"><label className="form-label">Department</label><input className="form-control" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5>System Preferences</h5>
              <div className="row g-3 mt-3">
                <div className="col-12"><label className="form-label">Academic Year</label><select className="form-select" value={preferences.academicYear} onChange={(e) => setPreferences({ ...preferences, academicYear: e.target.value })}><option>2026-2027</option><option>2025-2026</option></select></div>
                <div className="col-12"><label className="form-label">Default Time Slots</label><textarea className="form-control" rows="3" value={preferences.defaultSlots} onChange={(e) => setPreferences({ ...preferences, defaultSlots: e.target.value })} /></div>
                <div className="col-12"><label className="form-label">Notification Preferences</label><div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={preferences.notifications} onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })} /><label className="form-check-label">Enable notifications</label></div></div>
                <div className="col-12"><label className="form-label">Theme</label><select className="form-select" value={preferences.theme} onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}><option>Light</option><option>Dark</option></select></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 d-flex justify-content-end">
        <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
      </div>
      {saved && <div className="alert alert-success mt-3">Settings saved successfully.</div>}
    </div>
  );
}

export default Settings;
