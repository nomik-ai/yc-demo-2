import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AppShell from '../../components/AppShell';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Table from '../../components/Table';

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  text_content: string;
  file_path: string;
  submitted_at: string;
  score: number | null;
  comment: string | null;
  graded_at: string | null;
}

interface AssignmentDetail {
  id: number;
  title: string;
  description: string;
  due_date: string;
  submissions: Submission[];
}

export default function TeacherSubmissionReview() {
  const { id, aid } = useParams<{ id: string; aid: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const fetchData = () => {
    if (!id || !aid) return;
    setLoading(true);
    api.get<AssignmentDetail>(`/classes/${id}/assignments/${aid}`)
      .then(setAssignment)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id, aid]);

  const handleGrade = async (submissionId: number) => {
    const scoreStr = grades[submissionId];
    if (scoreStr === undefined || scoreStr === '') return;

    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 0 || score > 100) return;

    setSaving((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await api.put(`/classes/${id}/assignments/${aid}/submissions/${submissionId}/grade`, { score });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade');
    } finally {
      setSaving((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  if (loading) {
    return (
      <AppShell title="…" navItems={[]}>
        <div className="skeleton" style={{ height: 200 }} />
      </AppShell>
    );
  }

  if (!assignment) {
    return (
      <AppShell title="Not Found" navItems={[{ label: 'Dashboard', icon: '📊', href: '/teacher/dashboard' }]}>
        <p>Assignment not found.</p>
      </AppShell>
    );
  }

  const graded = assignment.submissions.filter((s) => s.score != null).length;
  const ungraded = assignment.submissions.filter((s) => s.score == null).length;
  const avg =
    graded > 0
      ? Math.round(
          assignment.submissions
            .filter((s) => s.score != null)
            .reduce((sum, s) => sum + (s.score || 0), 0) / graded
        )
      : null;

  const gradeColor = (score: number | null) => {
    if (score == null) return undefined;
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  return (
    <AppShell
      title={assignment.title}
      backTo={`/teacher/classes/${id}`}
      navItems={[
        { label: 'Dashboard', icon: '📊', href: '/teacher/dashboard' },
      ]}
    >
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="stats-row">
        <StatCard value={String(assignment.submissions.length)} label="Total students" />
        <StatCard value={String(graded)} label="Graded" color="success" />
        <StatCard value={String(ungraded)} label="Awaiting" color="warning" />
        <StatCard value={avg != null ? `${avg}%` : '—'} label="Class average" />
      </div>

      <Table
        columns={[
          { key: 'student_name', label: 'Student' },
          {
            key: 'submitted_at',
            label: 'Submitted',
            render: (row) =>
              row.submitted_at
                ? new Date(row.submitted_at as string).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—',
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => {
              if (row.score != null) return <Badge variant="success">Graded</Badge>;
              if (row.submitted_at) return <Badge variant="warning">Pending</Badge>;
              return <Badge variant="danger">Not submitted</Badge>;
            },
          },
          {
            key: 'submission',
            label: 'Submission',
            render: (row) => {
              if (row.file_path) {
                return (
                  <a href={row.file_path as string} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-sm)' }}>
                    📎 {(row.file_path as string).split('/').pop()}
                  </a>
                );
              }
              if (row.text_content) return <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>Text entry</span>;
              return <span style={{ color: 'var(--color-gray-400)' }}>—</span>;
            },
          },
          {
            key: 'score',
            label: 'Score',
            render: (row) => {
              if (row.score != null) {
                return (
                  <span className="grade-score" style={{ color: `var(--color-${gradeColor(row.score as number)})` }}>
                    {row.score}/100
                  </span>
                );
              }
              if (!row.submitted_at) return <span style={{ color: 'var(--color-gray-400)' }}>—</span>;
              return (
                <input
                  className="grade-input"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="—"
                  value={grades[row.id as number] ?? ''}
                  onChange={(e) => setGrades((prev) => ({ ...prev, [row.id as number]: e.target.value }))}
                />
              );
            },
          },
          {
            key: 'action',
            label: '',
            render: (row) => {
              if (row.score != null) return <Button variant="ghost" size="sm" onClick={() => { /* inline edit */ }}>Edit</Button>;
              if (!row.submitted_at) return <span>—</span>;
              return (
                <Button
                  size="sm"
                  loading={saving[row.id as number]}
                  onClick={() => handleGrade(row.id as number)}
                >
                  Grade
                </Button>
              );
            },
          },
        ]}
        rows={assignment.submissions}
      />
    </AppShell>
  );
}
