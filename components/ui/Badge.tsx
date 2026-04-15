const colorMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
};

export const Badge = ({ value }: { value: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorMap[value] ?? 'bg-gray-100 text-gray-700'}`}>
    {value.replace('_', ' ')}
  </span>
);
