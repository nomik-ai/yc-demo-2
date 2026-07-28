import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import AppShell from '../../components/AppShell';

interface ClassItem {
  id: number; name: string; description: string;
  student_count: number; assignment_count: number;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchClasses = () => {
    setLoading(true);
    api.get<ClassItem[]>('/classes')
      .then(setClasses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchClasses(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/classes', { name: newName, description: newDesc });
      setShowCreate(false); setNewName(''); setNewDesc('');
      fetchClasses();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create class'); }
    finally { setCreating(false); }
  };

  const totalStudents = classes.reduce((s, c) => s + (c.student_count || 0), 0);
  const totalAssignments = classes.reduce((s, c) => s + (c.assignment_count || 0), 0);

  return (
    <AppShell title="Dashboard" navItems={[
      { label: 'Dashboard', icon: '📊', href: '/teacher/dashboard' },
      { label: 'My Classes', icon: '👥', href: '/teacher/classes/0' },
    ]} actions={<Button onClick={() => setShowCreate(true)}>+ New Class</Button>}>
      {error && (<div className="error-banner">{error}<button className="btn btn-ghost btn-sm" onClick={() => { setError(''); fetchClasses(); }}>Retry</button></div>)}
      <div className="stats-row">
        <StatCard value={String(classes.length)} label="Active Classes" color="primary" />
        <StatCard value={String(totalAssignments)} label="Assignments" color="success" />
        <StatCard value="—" label="Pending Review" color="warning" />
        <StatCard value={String(totalStudents)} label="Students" color="info" />
      </div>
      <h3 style={{ marginBottom: 'var(--space-4)' }}>Your Classes</h3>
      {loading ? (<div className="dashboard-grid">{[1,2,3].map(i => (<div key={i} className="card" style={{height:100}}><div className="skeleton" style={{height:20,width:'60%',marginBottom:12}}/><div className="skeleton" style={{height:14,width:'40%'}}/></div>))}</div>) : (
        <div className="dashboard-grid">
          {classes.map(c => (<div key={c.id} className="class-card" onClick={() => navigate(`/teacher/classes/${c.id}`)}><div className="class-card-name">{c.name}</div><div className="class-card-meta"><span>{c.student_count||0} students</span><span>{c.assignment_count||0} assignments</span></div></div>))}
          <div className="class-card" style={{border:'2px dashed var(--color-gray-300)',display:'flex',alignItems:'center',justifyContent:'center',minHeight:120}} onClick={() => setShowCreate(true)}><span style={{color:'var(--color-gray-400)',fontSize:32}}>+</span></div>
        </div>
      )}
      <Modal title="Create Class" open={showCreate} onClose={() => setShowCreate(false)} footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} loading={creating}>Create Class</Button></>}>
        <FormGroup label="Class Name"><input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Mathematics 101"/></FormGroup>
        <FormGroup label="Description (optional)"><textarea className="form-textarea" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description…"/></FormGroup>
      </Modal>
    </AppShell>
  );
}
