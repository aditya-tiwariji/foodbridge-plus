import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md border border-slate-100 p-6 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
