'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <Input label="Full Name" value={form.name} onChange={set('name')} required />
      <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
      <Input label="Password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
      <Select label="Role" value={form.role} onChange={set('role')}
        options={[{ value: 'user', label: 'User' }, { value: 'manager', label: 'Manager' }, { value: 'admin', label: 'Admin' }]} />
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
      <p className="text-sm text-center text-gray-500">
        Have an account? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
