'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { Task } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';

const EMPTY: Partial<Task> = { title: '', description: '', priority: 'medium', status: 'pending', deadline: '', assigned_to: '', project_id: '' };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Partial<Task>>(EMPTY);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const data = await api<{ tasks: Task[]; total: number }>(`/tasks?${params}`);
      setTasks(data.tasks);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api<{ projects: { id: string; name: string }[] }>('/projects').then(d => setProjects(d.projects)).catch(console.error);
    if (user?.role !== 'user') {
      api<{ id: string; name: string }[]>('/users').then(setUsers).catch(console.error);
    }
  }, [user]);

  const [error, setError] = useState('');

  const save = async () => {
    try {
      if (modal === 'create') await api('/tasks', { method: 'POST', body: JSON.stringify(selected) });
      else await api(`/tasks/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) });
      setModal(null); setSelected(EMPTY); load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setSelected(p => ({ ...p, [key]: e.target.value }));

  const canEdit = user?.role !== 'user';

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'project_name', header: 'Project', render: (t: Task) => <span>{t.project_name || '—'}</span> },
    { key: 'priority', header: 'Priority', render: (t: Task) => <Badge value={t.priority} /> },
    { key: 'status', header: 'Status', render: (t: Task) => <Badge value={t.status} /> },
    { key: 'assigned_to_name', header: 'Assigned To', render: (t: Task) => <span>{t.assigned_to_name || '—'}</span> },
    { key: 'deadline', header: 'Deadline', render: (t: Task) => <span>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</span> },
    {
      key: 'actions', header: 'Actions', render: (t: Task) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setSelected(t); setModal('edit'); }}>Edit</Button>
          {canEdit && <Button size="sm" variant="danger" onClick={() => remove(t.id)}>Delete</Button>}
        </div>
      )
    },
  ];

  return (
    <div>
      <Header title="Tasks" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Search tasks..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-48" />
            <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              options={[{ value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }]} />
            <Select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          </div>
          {canEdit && <Button onClick={() => { setSelected(EMPTY); setModal('create'); }}>+ New Task</Button>}
        </div>
        <Table columns={columns} data={tasks} keyField="id" />
        <Pagination page={page} total={total} limit={10} onChange={setPage} />
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Task' : 'Edit Task'} onClose={() => { setModal(null); setError(''); }}>
          <div className="space-y-3">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {canEdit ? (
              <>
                <Input label="Title" value={selected.title || ''} onChange={set('title')} required />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    rows={3} value={selected.description || ''} onChange={set('description')} />
                </div>
                <Select label="Priority" value={selected.priority || 'medium'} onChange={set('priority')}
                  options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
                <Select label="Status" value={selected.status || 'pending'} onChange={set('status')}
                  options={[{ value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }]} />
                <Input label="Deadline" type="date" value={selected.deadline?.split('T')[0] || ''} onChange={set('deadline')} />
                <Select label="Assign To" value={selected.assigned_to || ''} onChange={set('assigned_to')}
                  options={users.map(u => ({ value: u.id, label: u.name }))} />
                <Select label="Project" value={selected.project_id || ''} onChange={set('project_id')}
                  options={projects.map(p => ({ value: p.id, label: p.name }))} />
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Title</p>
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">{selected.title}</p>
                </div>
                {selected.project_name && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Project</p>
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">{selected.project_name}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Priority</p>
                    <Badge value={selected.priority || ''} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Deadline</p>
                    <p className="text-sm text-gray-600">{selected.deadline ? new Date(selected.deadline).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                <Select label="Status" value={selected.status || 'pending'} onChange={set('status')}
                  options={[{ value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }]} />
              </>
            )}
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
