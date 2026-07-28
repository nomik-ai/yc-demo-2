import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import FormGroup from '../../components/FormGroup';

interface Submission {
  id: number;
  text_content: string;
  file_path: string;
  submitted_at: string;
  score: number | null;
  comment: string | null;
  graded_at: string | null;
}

interface StudentAssignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  submissions: Submission[];
}

export default function StudentAssignmentView() {
  const { id, aid } = useParams<{ id: string; aid: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    if (!id || !aid) return;
    setLoading(true);
    api.get<StudentAssignment>(`/classes/${id}/assignments/${aid}`)
      .then(setAssignment)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id, aid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text);
      if (file) formData.append('file', file);

      await api.post(`/classes/${id}/assignments/${aid}/submissions`, formData);
      setSuccess('Submitted successfully!');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
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
      <AppShell title="Not Found" navItems={[{ label: 'My Classes', icon: '🏠', href: '/student/dashboard' }]}>
        <p style={{ color: 'var(--color-gray-500)' }}>{error || 'Assignment not found.'}</p>
      </AppShell>
    );
  }

  const latestSubmission = assignment.submissions[0];
  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <AppShell
      title={assignment.title}
      backTo={`/student/classes/${id}`}
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

      {success && (
        <div
          className="error-banner"
          style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
        >
          {success}
          <button className="btn btn-ghost btn-sm" onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Assignment Detail */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3>{assignment.title}</h3>
            <p style={{ color: 'var(--color-gray-500)', marginTop: 4 }}>
              Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at 11:59 PM
            </p>
          </div>
          {isOverdue && !latestSubmission ? (
            <Badge variant="danger">Overdue</Badge>
          ) : daysLeft <= 3 && !latestSubmission ? (
            <Badge variant="warning">Due in {daysLeft} days</Badge>
          ) : latestSubmission?.score != null ? (
            <Badge variant="success">Graded</Badge>
          ) : latestSubmission ? (
            <Badge variant="neutral">Submitted</Badge>
          ) : null}
        </div>
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--color-gray-50)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-gray-700)',
            lineHeight: 1.7,
          }}
        >
          {assignment.description || 'No description provided.'}
        </div>
      </Card>

      {/* Previous submissions / grade */}
      {latestSubmission && (
        <Card title={latestSubmission.score != null ? 'Graded' : 'Your Submission'} className="card-header" headerRight={undefined}>
          <div style={{ marginTop: 0 }}>
            {latestSubmission.text_content && (
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>Your Answer</label>
                <div
                  style={{
                    padding: 12,
                    background: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {latestSubmission.text_content}
                </div>
              </div>
            )}
            {latestSubmission.file_path && (
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>Attached File</label>
                <a href={latestSubmission.file_path} target="_blank" rel="noopener noreferrer">
                  📎 {latestSubmission.file_path.split('/').pop()}
                </a>
              </div>
            )}
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>
              Submitted {new Date(latestSubmission.submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
            {latestSubmission.score != null && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--color-success-light)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-success)' }}>
                  Score: {latestSubmission.score}/100
                </span>
                {latestSubmission.comment && (
                  <p style={{ fontSize: 'var(--text-sm)', marginTop: 4, color: 'var(--color-gray-600)' }}>{latestSubmission.comment}</p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Submission form */}
      {latestSubmission?.score == null && (
        <Card title={latestSubmission ? 'Resubmit' : 'Your Submission'} className="card-header" headerRight={undefined}>
          <form onSubmit={handleSubmit}>
            <FormGroup label="Your Answer / Notes">
              <textarea
                className="form-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your answer or paste your work here…"
                style={{ minHeight: 150 }}
              />
            </FormGroup>
            <FormGroup label="Attach File" hint="PDF, TXT, or ZIP up to 10MB">
              <input className="form-input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </FormGroup>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" size="lg" loading={submitting} disabled={!text.trim() && !file}>
                {latestSubmission ? 'Resubmit' : 'Submit Assignment'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </AppShell>
  );
}
