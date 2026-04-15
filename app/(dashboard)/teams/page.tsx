'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Team, User } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';

const EMPTY = { name: '', description: '', manager_id: '', member_ids: [] as string[] };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<typeof EMPTY & { id?: string }>(EMPTY);

  const load = useCallback(async () => {
    const [t, u] = await Promise.all([api<Team[]>('/teams'), api<User[]>('/users')]);
    setTeams(t); setUsers(u);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (modal === 'create') await api('/teams', { method: 'POST', body: JSON.stringify(selected) });
    else await api(`/teams/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) });
    setModal(null); setSelected(EMPTY); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    await api(`/teams/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleMember = (id: string) =>
    setSelected(p => ({
      ...p,
      member_ids: p.member_ids.includes(id) ? p.member_ids.filter(m => m !== id) : [...p.member_ids, id],
    }));

  const columns = [
    { key: 'name', header: 'Team Name' },
    { key: 'manager_name', header: 'Manager', render: (t: Team) => <span>{t.manager_name || '—'}</span> },
    { key: 'members', header: 'Members', render: (t: Team) => <span>{t.members.length} members</span> },
    {
      key: 'actions', header: 'Actions', render: (t: Team) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
            setSelected({ id: t.id, name: t.name, description: t.description || '', manager_id: t.manager_id || '', member_ids: t.members.map(m => m.id) });
            setModal('edit');
          }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(t.id)}>Delete</Button>
        </div>
      )
    },
  ];

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  return (
    <div>
      <Header title="Teams" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => { setSelected(EMPTY); setModal('create'); }}>+ New Team</Button>
        </div>
        <Table columns={columns} data={teams} keyField="id" />
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Team' : 'Edit Team'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Team Name" value={selected.name} onChange={e => setSelected(p => ({ ...p, name: e.target.value }))} required />
            <Input label="Description" value={selected.description} onChange={e => setSelected(p => ({ ...p, description: e.target.value }))} />
            <Select label="Manager" value={selected.manager_id} onChange={e => setSelected(p => ({ ...p, manager_id: e.target.value }))}
              options={managers.map(u => ({ value: u.id, label: u.name }))} />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Members</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {users.filter(u => u.role === 'user').map(u => (
                  <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input type="checkbox" checked={selected.member_ids.includes(u.id)} onChange={() => toggleMember(u.id)} />
                    {u.name}
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
