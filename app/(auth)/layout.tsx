export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">SmartOps</h1>
          <p className="text-sm text-gray-500 mt-1">Team Task Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
