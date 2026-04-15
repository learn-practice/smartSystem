'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Project, Team } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/lib/authContext';

const EMPTY = { name: '', description: '', deadline: '', status: 'active', team_ids: [] as string[] };

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<typeof EMPTY & { id?: string }>(EMPTY);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (search) params.set('search', search);
    const data = await api<{ projects: Project[] }>(`/projects?${params}`);
    setProjects(data.projects);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api<Team[]>('/teams').then(setTeams); }, []);

  const save = async () => {
    if (modal === 'create') await api('/projects', { method: 'POST', body: JSON.stringify(selected) });
    else await api(`/projects/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) });
    setModal(null); setSelected(EMPTY); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await api(`/projects/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleTeam = (id: string) =>
    setSelected(p => ({
      ...p,
      team_ids: p.team_ids.includes(id) ? p.team_ids.filter(t => t !== id) : [...p.team_ids, id],
    }));

  const canEdit = user?.role !== 'user';

  const columns = [
    { key: 'name', header: 'Project' },
    { key: 'status', header: 'Status', render: (p: Project) => <Badge value={p.status} /> },
    { key: 'teams', header: 'Teams', render: (p: Project) => <span>{p.teams.length} teams</span> },
    { key: 'deadline', header: 'Deadline', render: (p: Project) => <span>{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</span> },
    ...(canEdit ? [{
      key: 'actions', header: 'Actions', render: (p: Project) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
            setSelected({ id: p.id, name: p.name, description: p.description || '', deadline: p.deadline?.split('T')[0] || '', status: p.status, team_ids: p.teams.map(t => t.id) });
            setModal('edit');
          }}>Edit</Button>
          {user?.role === 'admin' && <Button size="sm" variant="danger" onClick={() => remove(p.id)}>Delete</Button>}
        </div>
      )
    }] : []),
  ];

  return (
    <div>
      <Header title="Projects" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Input placeholder="Search projects..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-64" />
          {canEdit && <Button onClick={() => { setSelected(EMPTY); setModal('create'); }}>+ New Project</Button>}
        </div>
        <Table columns={columns} data={projects} keyField="id" />
        <Pagination page={page} total={projects.length} limit={10} onChange={setPage} />
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Project' : 'Edit Project'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Project Name" value={selected.name} onChange={e => setSelected(p => ({ ...p, name: e.target.value }))} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                rows={3} value={selected.description} onChange={e => setSelected(p => ({ ...p, description: e.target.value }))} />
            </div>
            <Select label="Status" value={selected.status} onChange={e => setSelected(p => ({ ...p, status: e.target.value }))}
              options={[{ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'on_hold', label: 'On Hold' }]} />
            <Input label="Deadline" type="date" value={selected.deadline} onChange={e => setSelected(p => ({ ...p, deadline: e.target.value }))} />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Assign Teams</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {teams.map(t => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input type="checkbox" checked={selected.team_ids.includes(t.id)} onChange={() => toggleTeam(t.id)} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
