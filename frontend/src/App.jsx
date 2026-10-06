import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import Blog from './pages/Blog';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ContactUs from './pages/ContactUs';
import Dashboard from './pages/dashboard/Dashboard';
import SetupInterview from './pages/interview/SetupInterview';
import InterviewSession from './pages/interview/InterviewSession';
import InterviewRoom from './pages/interview/InterviewRoom';
import FeedbackReport from './pages/interview/FeedbackReport';
import Profile from './pages/profile/Profile';

// New Dashboard Feature Pages (Mockups)
import ResumeBuilder from './pages/dashboard/ResumeBuilder';
import AiMentor from './pages/dashboard/AiMentor';
import Settings from './pages/dashboard/Settings';
import HistoryReports from './pages/dashboard/HistoryReports';
import AdminPanel from './pages/dashboard/AdminPanel';
import Notifications from './pages/dashboard/Notifications';
import VideoAnalysis from './pages/dashboard/VideoAnalysis';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/blog" element={<Blog />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<ContactUs />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="setup" element={<SetupInterview />} />
          <Route path="report/:id" element={<FeedbackReport />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminPanel />} />
          
          {/* Dashboard Feature Pages */}
          <Route path="resume-builder" element={<ResumeBuilder />} />
          <Route path="ai-mentor" element={<AiMentor />} />
          <Route path="history" element={<HistoryReports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="video-analysis" element={<VideoAnalysis />} />
          
          {/* Re-using public pages inside Dashboard Layout */}
          <Route path="quiz" element={<Quiz />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="blog" element={<Blog />} />
        </Route>

        {/* Full Screen Interview Room (legacy backend-driven) */}
        <Route 
          path="/interview/:id" 
          element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} 
        />
        
        {/* New frontend-only interview session */}
        <Route 
          path="/interview/session" 
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<InterviewSession />} />
        </Route>
        
        {/* Redirect /interview → /dashboard/setup for convenience */}
        <Route path="/interview" element={<ProtectedRoute><Navigate to="/dashboard/setup" replace /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
