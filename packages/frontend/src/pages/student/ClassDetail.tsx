import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

interface ClassAssignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: string;
  has_submitted: number | null;
  score: number | null;
}

interface StudentClassDetail {
  id: number;
  name: string;
  description: string;
  teacher: { id: number; name: string };
  assignments: ClassAssignment[];
}

export default function StudentClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cls, setCls] = useState<StudentClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get<StudentClassDetail>(`/classes/${id}`)
      .then(setCls)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="…" navItems={[]}>
        <div className="skeleton" style={{ height: 200 }} />
      </AppShell>
    );
  }

  if (!cls) {
    return (
      <AppShell title="Class Not Found" navItems={[{ label: 'My Classes', icon: '🏠', href: '/student/dashboard' }]}>
        <p style={{ color: 'var(--color-gray-500)' }}>{error || 'Class not found.'}</p>
      </AppShell>
    );
  }

  const getStatusBadge = (a: ClassAssignment) => {
    if (a.score != null) return <Badge variant="success">Graded: {a.score}/100</Badge>;
    if (a.has_submitted) return <Badge variant="neutral">Submitted</Badge>;
    const due = new Date(a.due_date);
    if (due < new Date()) return <Badge variant="danger">Overdue</Badge>;
    const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) return <Badge variant="warning">Due in {daysLeft}d</Badge>;
    return <Badge variant="neutral">Upcoming</Badge>;
  };

  return (
    <AppShell
      title={cls.name}
      backTo="/student/dashboard"
      navItems={[
        { label: 'My Classes', icon: '🏠', href: '/student/dashboard' },
        { label: 'My Grades', icon: '📊', href: '/student/grades' },
      ]}
    >
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <Card title={cls.teacher.name} className="card-header" headerRight={undefined}>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-sm)' }}>Teacher</p>
      </Card>

      <h3 style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>Assignments</h3>

      {cls.assignments.length === 0 ? (
        <div className="empty-state" style={{ border: '1px dashed var(--color-gray-200)', borderRadius: 'var(--radius-lg)' }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No assignments yet</div>
          <div className="empty-state-text">Your teacher hasn't posted any assignments.</div>
        </div>
      ) : (
        <div className="assignment-list">
          {cls.assignments.map((a) => (
            <div key={a.id} className="assignment-card">
              <div className="assignment-info">
                <div className="assignment-title">{a.title}</div>
                <div className="assignment-meta">
                  <span>Due: {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {getStatusBadge(a)}
                <Button size="sm" onClick={() => navigate(`/student/classes/${id}/assignments/${a.id}`)}>
                  {a.has_submitted ? 'View →' : 'Open →'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
