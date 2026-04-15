'use client';
interface HeaderProps { title: string; }

export const Header = ({ title }: HeaderProps) => (
  <header className="bg-white border-b border-gray-200 px-6 py-4">
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
  </header>
);
