import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <div className={`animate-page-enter ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
