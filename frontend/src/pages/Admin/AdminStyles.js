// AdminStyles.js

// This base style removes that clunky default browser border
export const btnBase = {
  padding: '6px 12px',
  border: 'none', 
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'opacity 0.2s',
};

export const btnPrimary = {
  ...btnBase,
  background: '#4f46e5',
  color: 'white',
};

export const btnDanger = {
  ...btnBase,
  background: '#ef4444',
  color: 'white',
};

export const btnSecondary = {
  ...btnBase,
  background: '#e5e7eb',
  color: '#333',
};

export const cardStyle = {
  background: 'white',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};