'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Task, Job, Team, Project } from '@/types';

interface AdminStats { totalUsers: number; totalTeams: number; totalProjects: number; tasksByStatus: { status: string; count: string }[]; jobsByStatus: { status: string; count: string }[]; }
interface ManagerStats { myTeams: Team[]; myProjects: Project[]; tasksByStatus: { status: string; count: string }[]; }
interface UserStats { myTasks: Task[]; myJobs: Job[]; }

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminStats | ManagerStats | UserStats | null>(null);

  useEffect(() => {
    api<AdminStats | ManagerStats | UserStats>('/dashboard').then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Loading...</div>;

  if (user?.role === 'admin') {
    const d = data as AdminStats;
    return (
      <div>
        <Header title="Admin Dashboard" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={d.totalUsers} />
            <StatCard label="Total Teams" value={d.totalTeams} />
            <StatCard label="Total Projects" value={d.totalProjects} />
            <StatCard label="Total Tasks" value={d.tasksByStatus.reduce((s, t) => s + parseInt(t.count), 0)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-3">Tasks by Status</h3>
              <div className="space-y-2">{d.tasksByStatus.map(t => <div key={t.status} className="flex justify-between items-center"><Badge value={t.status} /><span className="font-medium">{t.count}</span></div>)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-3">Jobs by Status</h3>
              <div className="space-y-2">{d.jobsByStatus.map(j => <div key={j.status} className="flex justify-between items-center"><Badge value={j.status} /><span className="font-medium">{j.count}</span></div>)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'manager') {
    const d = data as ManagerStats;
    return (
      <div>
        <Header title="Manager Dashboard" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="My Teams" value={d.myTeams.length} />
            <StatCard label="My Projects" value={d.myProjects.length} />
            <StatCard label="Team Tasks" value={d.tasksByStatus.reduce((s, t) => s + parseInt(t.count), 0)} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Task Distribution</h3>
            <div className="space-y-2">{d.tasksByStatus.map(t => <div key={t.status} className="flex justify-between items-center"><Badge value={t.status} /><span className="font-medium">{t.count}</span></div>)}</div>
          </div>
        </div>
      </div>
    );
  }

  const d = data as UserStats;
  return (
    <div>
      <Header title="My Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="My Tasks" value={d.myTasks.length} />
          <StatCard label="My Jobs" value={d.myJobs.length} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Upcoming Tasks</h3>
          <div className="space-y-2">
            {d.myTasks.slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-gray-700">{t.title}</span>
                <div className="flex gap-2"><Badge value={t.priority} /><Badge value={t.status} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
