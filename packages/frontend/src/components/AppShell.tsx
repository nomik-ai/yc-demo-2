import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} className="font-bold text-lg">
            📚 Classroom
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">{user?.name} ({user?.role})</span>
            <button onClick={logout} className="text-sm bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
