'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', roles: ['admin', 'manager', 'user'] },
  { href: '/employees', label: 'Employees', roles: ['admin'] },
  { href: '/teams', label: 'Teams', roles: ['admin', 'manager'] },
  { href: '/projects', label: 'Projects', roles: ['admin', 'manager', 'user'] },
  { href: '/tasks', label: 'Tasks', roles: ['admin', 'manager', 'user'] },
  { href: '/jobs', label: 'Jobs', roles: ['admin', 'manager', 'user'] },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-indigo-400">SmartOps</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role} · {user?.name}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filtered.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors
              ${pathname.startsWith(item.href)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
