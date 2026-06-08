import React from 'react';

const PageWrapper = ({ children, className = '' }) => {
  return (
    <main className={`min-h-[calc(100vh-140px)] py-8 ${className}`}>
      {children}
    </main>
  );
};

export default PageWrapper;
