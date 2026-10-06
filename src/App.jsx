import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Faculty from './pages/Faculty.jsx';
import Subjects from './pages/Subjects.jsx';
import Rooms from './pages/Rooms.jsx';
import ClassesPage from './pages/Classes.jsx';
import TimeSlots from './pages/TimeSlots.jsx';
import Constraints from './pages/Constraints.jsx';
import GenerateTimetable from './pages/GenerateTimetable.jsx';
import Timetable from './pages/Timetable.jsx';
import Conflicts from './pages/Conflicts.jsx';
import Reports from './pages/Reports.jsx';
import Students from './pages/Students.jsx';
import Settings from './pages/Settings.jsx';
import ImportTimetable from './pages/ImportTimetable.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="time-slots" element={<TimeSlots />} />
          <Route path="constraints" element={<Constraints />} />
          <Route path="generate-timetable" element={<GenerateTimetable />} />
          <Route path="import-timetable" element={<ImportTimetable />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="conflicts" element={<Conflicts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="students" element={<Students />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
