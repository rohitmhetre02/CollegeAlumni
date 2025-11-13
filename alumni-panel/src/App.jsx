import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './components/AdminLogin';
import Jobs from './pages/Jobs';
import Events from './pages/Events';
import Mentorships from './pages/Mentorships';
import StudentDashboard from './pages/StudentDashboard';
import AlumniDashboard from './pages/AlumniDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AlumniDirectory from './pages/AlumniDirectory';
import StudentDirectory from './pages/StudentDirectory';
import JobsWithSidebar from './pages/JobsWithSidebar';
import EventsWithSidebar from './pages/EventsWithSidebar';
import MentorshipsWithSidebar from './pages/MentorshipsWithSidebar';
import MentorProfile from './pages/MentorProfile';
import MentorDashboard from './pages/MentorDashboard';
import MentorOnboarding from './pages/MentorOnboarding';
import FacultyWithSidebar from './pages/FacultyWithSidebar';
import NewsWithSidebar from './pages/NewsWithSidebar';
import MyActivityDashboard from './pages/MyActivityDashboard';
import ActivityDetail from './pages/ActivityDetail';
import StudentDetail from './pages/StudentDetail';
import AlumniDetail from './pages/AlumniDetail';
import FacultyDetail from './pages/FacultyDetail';
import JobDetail from './pages/JobDetail';
import EventDetail from './pages/EventDetail';
import NewsDetail from './pages/NewsDetail';
import Topbar from './components/Topbar';
import Profile from './pages/Profile';
import ChatDrawer from './components/ChatDrawer';
import Gallery from './pages/Gallery';
import Messages from './pages/Messages';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  // Block all access for pending/rejected students and alumni (except dashboard and profile)
  const isBlocked = (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected') && 
                   (user.role === 'student' || user.role === 'alumni');
  const isDashboard = location.pathname === '/student/dashboard' || location.pathname === '/alumni/dashboard';
  const isProfile = location.pathname === '/profile';
  
  // Allow dashboard and profile access even when blocked
  if (isBlocked && !isDashboard && !isProfile) {
    // Redirect to their dashboard if trying to access blocked features
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" />;
    } else if (user.role === 'alumni') {
      return <Navigate to="/alumni/dashboard" />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          {/* Topbar visible only when authenticated */}
          <TopbarWrapper />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin/Coordinator Login */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Alumni Routes */}
            <Route
              path="/alumni/dashboard"
              element={
                <ProtectedRoute allowedRoles={['alumni']}>
                  <AlumniDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Coordinator Routes */}
            <Route
              path="/coordinator/dashboard"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Shared Routes */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/mentorships" element={<Mentorships />} />
            
            {/* Directory Routes */}
            <Route
              path="/alumni"
              element={
                <ProtectedRoute>
                  <AlumniDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <StudentDirectory />
                </ProtectedRoute>
              }
            />
            
            {/* Feature Routes with Sidebar */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute>
                  <FacultyWithSidebar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <NewsWithSidebar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-activity"
              element={
                <ProtectedRoute>
                  <MyActivityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs-directory"
              element={
                <ProtectedRoute>
                  <JobsWithSidebar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events-directory"
              element={
                <ProtectedRoute>
                  <EventsWithSidebar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentorships-directory"
              element={
                <ProtectedRoute>
                  <MentorshipsWithSidebar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <Gallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
                <Route
                  path="/mentor/onboarding"
                  element={
                    <ProtectedRoute allowedRoles={['alumni']}>
                      <MentorOnboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mentor/:mentorId/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['alumni']}>
                      <MentorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mentor/:mentorId"
                  element={
                    <ProtectedRoute>
                      <MentorProfile />
                    </ProtectedRoute>
                  }
                />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Detail Pages */}
            <Route
              path="/activity/:id"
              element={
                <ProtectedRoute>
                  <ActivityDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:id"
              element={
                <ProtectedRoute>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumnus/:id"
              element={
                <ProtectedRoute>
                  <AlumniDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/:id"
              element={
                <ProtectedRoute>
                  <FacultyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job/:id"
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:id"
              element={
                <ProtectedRoute>
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news/:id"
              element={
                <ProtectedRoute>
                  <NewsDetail />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;

// Renders Topbar only if user is authenticated
const TopbarWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <Topbar />;
};
