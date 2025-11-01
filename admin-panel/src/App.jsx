import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import StudentsDirectory from './pages/StudentsDirectory';
import AlumniDirectory from './pages/AlumniDirectory';
import FacultyList from './pages/FacultyList';
import JobsList from './pages/JobsList';
import MentorshipsList from './pages/MentorshipsList';
import NewsList from './pages/NewsList';
import EventsList from './pages/EventsList';
import MyActivity from './pages/MyActivity';
import Topbar from './components/Topbar';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <TopbarWrapper />
        <Routes>
          {/* Admin/Coordinator Login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentsDirectory /></ProtectedRoute>} />
          <Route path="/admin/alumni" element={<ProtectedRoute allowedRoles={['admin']}><AlumniDirectory /></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyList /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute allowedRoles={['admin']}><JobsList /></ProtectedRoute>} />
          <Route path="/admin/mentorships" element={<ProtectedRoute allowedRoles={['admin']}><MentorshipsList /></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute allowedRoles={['admin']}><NewsList /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><EventsList /></ProtectedRoute>} />
          <Route path="/admin/my-activity" element={<ProtectedRoute allowedRoles={['admin']}><MyActivity /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin','coordinator']}><Profile /></ProtectedRoute>} />
          
          {/* Coordinator Routes */}
          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/coordinator/students" element={<ProtectedRoute allowedRoles={['coordinator']}><StudentsDirectory /></ProtectedRoute>} />
          <Route path="/coordinator/alumni" element={<ProtectedRoute allowedRoles={['coordinator']}><AlumniDirectory /></ProtectedRoute>} />
          <Route path="/coordinator/faculty" element={<ProtectedRoute allowedRoles={['coordinator']}><FacultyList /></ProtectedRoute>} />
          <Route path="/coordinator/jobs" element={<ProtectedRoute allowedRoles={['coordinator']}><JobsList /></ProtectedRoute>} />
          <Route path="/coordinator/mentorships" element={<ProtectedRoute allowedRoles={['coordinator']}><MentorshipsList /></ProtectedRoute>} />
          <Route path="/coordinator/news" element={<ProtectedRoute allowedRoles={['coordinator']}><NewsList /></ProtectedRoute>} />
          <Route path="/coordinator/events" element={<ProtectedRoute allowedRoles={['coordinator']}><EventsList /></ProtectedRoute>} />
          <Route path="/coordinator/my-activity" element={<ProtectedRoute allowedRoles={['coordinator']}><MyActivity /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin','coordinator']}><Profile /></ProtectedRoute>} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

const TopbarWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <Topbar />;
};
