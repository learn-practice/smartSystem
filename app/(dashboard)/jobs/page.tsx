'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Job, User, Team } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/lib/authContext';

const EMPTY = { title: '', description: '', assigned_to: '', team_id: '', deadline: '', status: 'open' };

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<typeof EMPTY & { id?: string }>(EMPTY);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api<{ jobs: Job[] }>(`/jobs?${params}`);
      setJobs(data.jobs);
    } catch (err) {
      console.error(err);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user?.role !== 'user') {
      Promise.all([api<User[]>('/users'), api<Team[]>('/teams')])
        .then(([u, t]) => { setUsers(u); setTeams(t); })
        .catch(console.error);
    }
  }, [user]);

  const [error, setError] = useState('');

  const save = async () => {
    try {
      if (modal === 'create') await api('/jobs', { method: 'POST', body: JSON.stringify(selected) });
      else await api(`/jobs/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) });
      setModal(null); setSelected(EMPTY); load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    try {
      await api(`/jobs/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSelected(p => ({ ...p, [key]: e.target.value }));

  const canEdit = user?.role !== 'user';

  const columns = [
    { key: 'title', header: 'Job Title' },
    { key: 'status', header: 'Status', render: (j: Job) => <Badge value={j.status} /> },
    { key: 'assigned_to_name', header: 'Assigned To', render: (j: Job) => <span>{j.assigned_to_name || '—'}</span> },
    { key: 'team_name', header: 'Team', render: (j: Job) => <span>{j.team_name || '—'}</span> },
    { key: 'deadline', header: 'Deadline', render: (j: Job) => <span>{j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}</span> },
    ...(canEdit ? [{
      key: 'actions', header: 'Actions', render: (j: Job) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
            setSelected({ id: j.id, title: j.title, description: j.description || '', assigned_to: j.assigned_to || '', team_id: j.team_id || '', deadline: j.deadline?.split('T')[0] || '', status: j.status });
            setModal('edit');
          }}>Edit</Button>
          {user?.role === 'admin' && <Button size="sm" variant="danger" onClick={() => remove(j.id)}>Delete</Button>}
        </div>
      )
    }] : []),
  ];

  return (
    <div>
      <Header title="Jobs" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <Input placeholder="Search jobs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-48" />
            <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              options={[{ value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'closed', label: 'Closed' }]} />
          </div>
          {canEdit && <Button onClick={() => { setSelected(EMPTY); setModal('create'); }}>+ New Job</Button>}
        </div>
        <Table columns={columns} data={jobs} keyField="id" />
        <Pagination page={page} total={jobs.length} limit={10} onChange={setPage} />
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Job' : 'Edit Job'} onClose={() => { setModal(null); setError(''); }}>
          <div className="space-y-3">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Input label="Job Title" value={selected.title} onChange={set('title')} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                rows={3} value={selected.description} onChange={e => setSelected(p => ({ ...p, description: e.target.value }))} />
            </div>
            <Select label="Status" value={selected.status} onChange={set('status')}
              options={[{ value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'closed', label: 'Closed' }]} />
            <Select label="Assign To" value={selected.assigned_to} onChange={set('assigned_to')}
              options={users.map(u => ({ value: u.id, label: u.name }))} />
            <Select label="Team" value={selected.team_id} onChange={set('team_id')}
              options={teams.map(t => ({ value: t.id, label: t.name }))} />
            <Input label="Deadline" type="date" value={selected.deadline} onChange={set('deadline')} />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setModal(null); setError(''); }}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
