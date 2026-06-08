import React, { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, type = 'text', error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium text-red-500">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
