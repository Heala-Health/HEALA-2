
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  return (
    <img 
      src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
      alt="Heala" 
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
};
