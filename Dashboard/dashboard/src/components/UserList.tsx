"use client";

import { useApiQuery } from "@/lib/hooks/useApi";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserList() {
  const { data, isLoading, error } = useApiQuery<User[]>("users", "/users");

  if (isLoading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading users: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Users</h2>
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {data?.map((user) => (
            <li key={user.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">
                  {user.role}
                </span>
              </div>
            </li>
          ))}
          {data?.length === 0 && (
            <li className="px-6 py-4 text-center text-gray-500">
              No users found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
