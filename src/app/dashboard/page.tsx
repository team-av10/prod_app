'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Image
                src="/av10-logo.png"
                alt="AV10 Logo"
                width={120}
                height={40}
                className="mr-4"
              />
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="bg-gray-50 rounded-4xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">User ID:</span> {user.uid}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email Verified:</span>{' '}
                {user.emailVerified ? 'Yes' : 'No'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Account Created:</span>{' '}
                {user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-emerald-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">Welcome!</h3>
              <p className="text-emerald-600">
                This is your personal dashboard. You can add more features and content here.
              </p>
            </div>
            <div className="bg-cyan-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-cyan-800 mb-2">Getting Started</h3>
              <p className="text-cyan-600">
                Explore the features and customize your experience.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Need Help?</h3>
              <p className="text-blue-600">
                Contact support if you have any questions or need assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 