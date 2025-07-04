'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4" style={{ paddingTop: '112px' }}>
      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
      <div className="max-w-md w-full">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <div className="text-right mt-2">
                <button
                  type="button"
                  className="text-sm text-black hover:underline focus:outline-none"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50 font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-black hover:text-gray-800">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 