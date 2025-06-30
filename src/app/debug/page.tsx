'use client';

import { useEffect, useState } from 'react';

interface EnvInfo {
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey: string;
}

interface DbTest {
  message?: string;
  sql?: string;
  error?: string;
}

export default function DebugPage() {
  const [envInfo, setEnvInfo] = useState<EnvInfo>({
    supabaseUrl: 'Checking...',
    supabaseAnonKey: 'Checking...',
    serviceRoleKey: 'Checking...',
  });
  const [dbTest, setDbTest] = useState<DbTest>({});

  useEffect(() => {
    // Check environment variables
    setEnvInfo({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
    });

    // Test database connection
    fetch('/api/setup-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => setDbTest(data))
      .catch(err => setDbTest({ error: err.message }));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Production Debug Info</h1>
      
      <div className="grid gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
          <div className="space-y-2">
            <p><strong>Supabase URL:</strong> {envInfo.supabaseUrl}</p>
            <p><strong>Supabase Anon Key:</strong> {envInfo.supabaseAnonKey}</p>
            <p><strong>Service Role Key:</strong> {envInfo.serviceRoleKey}</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Database Test</h2>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
            {JSON.stringify(dbTest, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">CSS Test</h2>
          <div className="space-y-4">
            <div className="bg-blue-500 text-white p-4 rounded">
              This should be a blue box with white text
            </div>
            <div className="bg-red-500 text-white p-4 rounded">
              This should be a red box with white text
            </div>
            <div className="bg-green-500 text-white p-4 rounded">
              This should be a green box with white text
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Icon Test</h2>
          <div className="flex space-x-4">
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 