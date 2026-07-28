import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

interface GradeAssignment {
  assignmentId: number;
  title: string;
  dueDate: string;
  submittedAt: string | null;
  score: number | null;
  comment: string | null;
  gradedAt: string | null;
}

interface ClassGrades {
  classId: number;
  className: string;
  average: number | null;
  gradedCount: number;
  assignments: GradeAssignment[];
}

const gradeColor = (score: number | null) => {
  if (score == null) return undefined;
  if (score >= 85) return 'var(--color-success)';
  if (score >= 70) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

export default function StudentGrades() {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<ClassGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ClassGrades[]>('/grades')
      .then(setGrades)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const allGraded = grades.flatMap((g) => g.assignments.filter((a) => a.score != null));
  const overallAvg =
    allGraded.length > 0
      ? Math.round(allGraded.reduce((s, a) => s + (a.score || 0), 0) / allGraded.length)
      : null;

  return (
    <AppShell
      title="My Grades"
      navItems={[
        { label: 'My Classes', icon: '🏠', href: '/student/dashboard' },
        { label: 'My Grades', icon: '📊', href: '/student/grades' },
      ]}
    >
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn btn-ghost btn-sm" onClick={() => { setError(''); }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div>
          <div className="stats-row">
            {[1, 2, 3].map((i) => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="stats-row">
            <StatCard value={overallAvg != null ? `${overallAvg}%` : '—'} label="Overall Average" color="primary" />
            <StatCard value={String(allGraded.length)} label="Assignments Graded" />
            <StatCard
              value={String(grades.flatMap((g) => g.assignments.filter((a) => a.score == null)).length)}
              label="Pending Grades"
              color="warning"
            />
          </div>

          {grades.length === 0 ? (
            <div className="empty-state" style={{ border: '1px dashed var(--color-gray-200)', borderRadius: 'var(--radius-lg)' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No grades yet</div>
              <div className="empty-state-text">Your grades will appear here once your teacher grades your submissions.</div>
            </div>
          ) : (
            grades.map((g) => (
              <Card
                key={g.classId}
                title={g.className}
                headerRight={
                  <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xl)', color: 'var(--color-primary)' }}>
                    {g.average != null ? `${g.average}%` : '—'}
                  </span>
                }
                className="card-header"
              >
                {g.assignments.map((a) => (
                  <div key={a.assignmentId} className="grade-row">
                    <span>{a.title}</span>
                    {a.score != null ? (
                      <span className="grade-score" style={{ color: gradeColor(a.score) }}>
                        {a.score}/100
                      </span>
                    ) : a.submittedAt ? (
                      <span style={{ color: 'var(--color-gray-400)', fontSize: 'var(--text-sm)' }}>Pending</span>
                    ) : (
                      <span style={{ color: 'var(--color-gray-400)', fontSize: 'var(--text-sm)' }}>Not submitted</span>
                    )}
                  </div>
                ))}
              </Card>
            ))
          )}
        </>
      )}
    </AppShell>
  );
}
