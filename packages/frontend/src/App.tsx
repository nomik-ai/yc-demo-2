import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClassDetail from './pages/teacher/ClassDetail';
import SubmissionReview from './pages/teacher/SubmissionReview';
import StudentDashboard from './pages/student/Dashboard';
import StudentClassDetail from './pages/student/ClassDetail';
import AssignmentView from './pages/student/AssignmentView';
import StudentGrades from './pages/student/Grades';
import type { ReactNode } from 'react';

function ProtectedRoute({ children, role }: { children: ReactNode; role: 'teacher' | 'student' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute role="teacher"><AppShell><TeacherDashboard /></AppShell></ProtectedRoute>} />
        <Route path="/teacher/classes/:id" element={<ProtectedRoute role="teacher"><AppShell><TeacherClassDetail /></AppShell></ProtectedRoute>} />
        <Route path="/teacher/submissions/:submissionId" element={<ProtectedRoute role="teacher"><AppShell><SubmissionReview /></AppShell></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute role="student"><AppShell><StudentDashboard /></AppShell></ProtectedRoute>} />
        <Route path="/student/classes/:id" element={<ProtectedRoute role="student"><AppShell><StudentClassDetail /></AppShell></ProtectedRoute>} />
        <Route path="/student/assignments/:assignmentId" element={<ProtectedRoute role="student"><AppShell><AssignmentView /></AppShell></ProtectedRoute>} />
        <Route path="/student/grades" element={<ProtectedRoute role="student"><AppShell><StudentGrades /></AppShell></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
