'use client';

import PullToRefresh from './PullToRefresh';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const handleRefresh = () => {
    // Custom refresh that doesn't trigger password prompts
    window.location.reload();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
} 