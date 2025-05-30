'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="bg-black border-b border-purple-900 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-2xl font-bold text-purple-400 tracking-wider">
        JONE$CO
      </Link>
      <div className="flex gap-4 items-center">
        <Link
          href="/dashboard"
          className={`hover:text-purple-300 ${pathname === '/dashboard' ? 'text-purple-400 font-bold' : 'text-white'}`}
          title="Dashboard"
        >
          Dashboard
        </Link>
        {!session && (
          <>
            <Link
              href="/login"
              className={`hover:text-purple-300 ${pathname === '/login' ? 'text-purple-400 font-bold' : 'text-white'}`}
              title="Login"
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`hover:text-purple-300 ${pathname === '/register' ? 'text-purple-400 font-bold' : 'text-white'}`}
              title="Register"
            >
              Register
            </Link>
          </>
        )}
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-white hover:text-purple-300"
            title="Logout"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}