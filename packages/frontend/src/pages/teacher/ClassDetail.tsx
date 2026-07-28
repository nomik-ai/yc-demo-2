import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AppShell from '../../components/AppShell';
import TabBar from '../../components/TabBar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormGroup from '../../components/FormGroup';
import Table from '../../components/Table';
import EmptyState from '../../components/EmptyState';

interface Student {
  id: number;
  name: string;
  email: string;
  joined_at: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: string;
  submission_count: number;
  total_students: number;
}

interface ClassDetail {
  id: number;
  name: string;
  description: string;
  students: Student[];
  assignments: Assignment[];
}

export default function TeacherClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('assignments');

  // Modals
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  const [asgnTitle, setAsgnTitle] = useState('');
  const [asgnDesc, setAsgnDesc] = useState('');
  const [asgnDue, setAsgnDue] = useState('');
  const [creatingAsgn, setCreatingAsgn] = useState(false);

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    api.get<ClassDetail>(`/classes/${id}`)
      .then(setCls)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    setAddingStudent(true);
    try {
      await api.post(`/classes/${id}/students`, { email: studentEmail });
      setShowAddStudent(false);
      setStudentEmail('');
      fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgnTitle.trim() || !asgnDue) return;
    setCreatingAsgn(true);
    try {
      await api.post(`/classes/${id}/assignments`, { title: asgnTitle, description: asgnDesc, dueDate: asgnDue });
      setShowCreateAssignment(false);
      setAsgnTitle('');
      setAsgnDesc('');
      setAsgnDue('');
      fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setCreatingAsgn(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    try {
      await api.delete(`/classes/${id}/students/${studentId}`);
      fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
    }
  };

  if (loading) {
    return (
      <AppShell title="…" navItems={[]}>
        <div className="skeleton" style={{ height: 200 }} />
      </AppShell>
    );
  }

  if (!cls) {
    return (
      <AppShell title="Class Not Found" navItems={[{ label: 'Dashboard', icon: '📊', href: '/teacher/dashboard' }]}>
        <EmptyState icon="🔍" title="Class not found" text="This class may have been deleted." action={<Button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</Button>} />
      </AppShell>
    );
  }

  const tabs = [
    { label: 'Assignments', id: 'assignments' },
    { label: `Roster (${cls.students.length})`, id: 'roster' },
  ];

  const getAssignmentStatus = (a: Assignment) => {
    if (a.submission_count === 0) return { label: 'No submissions', variant: 'neutral' as const };
    const ungraded = a.total_students - (a.submission_count); // approximate
    if (a.submission_count > 0) return { label: `${a.submission_count} submitted`, variant: 'warning' as const };
    return { label: 'Upcoming', variant: 'neutral' as const };
  };

  return (
    <AppShell
      title={cls.name}
      backTo="/teacher/dashboard"
      navItems={[
        { label: 'Dashboard', icon: '📊', href: '/teacher/dashboard' },
      ]}
      actions={
        <>
          <Button variant="secondary" onClick={() => setShowAddStudent(true)}>+ Add Student</Button>
          <Button onClick={() => setShowCreateAssignment(true)}>+ New Assignment</Button>
        </>
      }
    >
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'assignments' && (
        <>
          {cls.assignments.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No assignments yet"
              text="Create your first assignment and it will appear here."
              action={<Button onClick={() => setShowCreateAssignment(true)}>Create Assignment</Button>}
            />
          ) : (
            <div className="assignment-list">
              {cls.assignments.map((a) => {
                const status = getAssignmentStatus(a);
                return (
                  <div key={a.id} className="assignment-card">
                    <div className="assignment-info">
                      <div className="assignment-title">{a.title}</div>
                      <div className="assignment-meta">
                        <span>Due: {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>{a.total_students} assigned</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Button size="sm" onClick={() => navigate(`/teacher/classes/${id}/assignments/${a.id}/review`)}>Review →</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'roster' && (
        <>
          {cls.students.length === 0 ? (
            <EmptyState
              icon="👤"
              title="No students enrolled"
              text="Add students by email to get started."
              action={<Button onClick={() => setShowAddStudent(true)}>Add Student</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                {
                  key: 'joined_at',
                  label: 'Joined',
                  render: (row) => new Date(row.joined_at as string).toLocaleDateString(),
                },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveStudent(row.id as number)}>
                      Remove
                    </Button>
                  ),
                },
              ]}
              rows={cls.students}
            />
          )}
        </>
      )}

      {/* Add Student Modal */}
      <Modal
        title="Add Student"
        subtitle={cls.name}
        open={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddStudent(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} loading={addingStudent}>Add Student</Button>
          </>
        }
      >
        <FormGroup label="Student Email">
          <input className="form-input" type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@example.com" />
        </FormGroup>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        title="Create Assignment"
        subtitle={cls.name}
        open={showCreateAssignment}
        onClose={() => setShowCreateAssignment(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateAssignment(false)}>Cancel</Button>
            <Button onClick={handleCreateAssignment} loading={creatingAsgn}>Create & Publish</Button>
          </>
        }
      >
        <FormGroup label="Title">
          <input className="form-input" value={asgnTitle} onChange={(e) => setAsgnTitle(e.target.value)} placeholder="e.g. Homework 4: Taylor Series" />
        </FormGroup>
        <FormGroup label="Description">
          <textarea className="form-textarea" value={asgnDesc} onChange={(e) => setAsgnDesc(e.target.value)} placeholder="Instructions, links, or notes for students…" style={{ minHeight: 120 }} />
        </FormGroup>
        <div style={{ display: 'flex', gap: 16 }}>
          <FormGroup label="Due Date">
            <input className="form-input" type="date" value={asgnDue} onChange={(e) => setAsgnDue(e.target.value)} />
          </FormGroup>
          <FormGroup label="Max Score">
            <input className="form-input" type="number" defaultValue={100} min={1} />
          </FormGroup>
        </div>
      </Modal>
    </AppShell>
  );
}
