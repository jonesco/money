'use client';

import { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  threshold?: number;
}

export default function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we're at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY - startY.current);
      
      // Only allow pulling down
      if (pullDistance > 0) {
        e.preventDefault();
        setPullDistance(pullDistance);
        setIsPulling(pullDistance > 10);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging.current && isPulling) {
        if (pullDistance >= threshold) {
          // Trigger refresh
          setIsRefreshing(true);
          
          // Temporarily hide all form inputs to prevent password autofill
          const inputs = document.querySelectorAll('input, textarea');
          const originalStyles: string[] = [];
          
          inputs.forEach((input, index) => {
            originalStyles[index] = (input as HTMLElement).style.display;
            (input as HTMLElement).style.display = 'none';
          });
          
          // Execute refresh
          if (onRefresh) {
            onRefresh();
          } else {
            // Default behavior: reload the page
            window.location.reload();
          }
          
          // Restore input visibility after a short delay
          setTimeout(() => {
            inputs.forEach((input, index) => {
              (input as HTMLElement).style.display = originalStyles[index] || '';
            });
          }, 100);
        }
      }
      
      // Reset state
      isDragging.current = false;
      setIsPulling(false);
      setPullDistance(0);
      
      // Reset refreshing state after a delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, onRefresh, pullDistance, isPulling]);

  return (
    <div className="relative">
      {/* Pull indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-blue-500 text-white py-3 transition-all duration-200"
          style={{
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
            opacity: Math.min(pullDistance / threshold, 1)
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="font-medium">Refreshing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${pullDistance >= threshold ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="font-medium">
                {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance * 0.3, 20)}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>
    </div>
  );
} 