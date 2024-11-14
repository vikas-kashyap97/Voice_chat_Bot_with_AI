import React from 'react';

export function Button({ className, children, onClick }) {
  return (
    <button className={`px-4 py-2 rounded ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
