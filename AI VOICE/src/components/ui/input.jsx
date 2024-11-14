import React from 'react';

export function Input({ id, placeholder, onChange }) {
  return (
    <input
      id={id}
      className="px-4 py-2 border rounded"
      placeholder={placeholder}
      onChange={onChange}
    />
  );
}
