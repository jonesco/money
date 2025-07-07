import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ModalPortal({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement('div');
  }

  useEffect(() => {
    const modalRoot = document.body;
    modalRoot.appendChild(elRef.current!);
    return () => {
      modalRoot.removeChild(elRef.current!);
    };
  }, []);

  return createPortal(children, elRef.current);
} 