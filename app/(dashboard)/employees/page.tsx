'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';

const EMPTY = { name: '', email: '', password: '', role: 'user' };

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<typeof EMPTY & { id?: string }>(EMPTY);

  const load = useCallback(async () => {
    const data = await api<User[]>('/users');
    setUsers(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (modal === 'create') await api('/users', { method: 'POST', body: JSON.stringify(selected) });
    else await api(`/users/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) });
    setModal(null); setSelected(EMPTY); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this employee?')) return;
    await api(`/users/${id}`, { method: 'DELETE' });
    load();
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSelected(p => ({ ...p, [key]: e.target.value }));

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u: User) => <Badge value={u.role} /> },
    { key: 'created_at', header: 'Joined', render: (u: User) => <span>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span> },
    {
      key: 'actions', header: 'Actions', render: (u: User) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
            setSelected({ id: u.id, name: u.name, email: u.email, password: '', role: u.role });
            setModal('edit');
          }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(u.id)}>Delete</Button>
        </div>
      )
    },
  ];

  return (
    <div>
      <Header title="Employees" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setSelected(EMPTY); setModal('create'); }}>+ Add Employee</Button>
        </div>
        <Table columns={columns} data={filtered} keyField="id" />
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Add Employee' : 'Edit Employee'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Full Name" value={selected.name} onChange={set('name')} required />
            <Input label="Email" type="email" value={selected.email} onChange={set('email')} required />
            {modal === 'create' && <Input label="Password" type="password" value={selected.password} onChange={set('password')} required />}
            <Select label="Role" value={selected.role} onChange={set('role')}
              options={[{ value: 'user', label: 'User' }, { value: 'manager', label: 'Manager' }, { value: 'admin', label: 'Admin' }]} />
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
