// MentorStyles.js
export const btnBase = {
  padding: '8px 16px',
  border: 'none', // Fixes the thick outline
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  transition: 'background 0.2s',
};

export const btnPrimary = { ...btnBase, background: '#4f46e5', color: 'white' };
export const btnSecondary = { ...btnBase, background: '#e5e7eb', color: '#333' };
export const btnClaim = { ...btnBase, background: '#3b82f6', color: 'white' };
export const btnResolve = { ...btnBase, background: '#10b981', color: 'white' };

export const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};