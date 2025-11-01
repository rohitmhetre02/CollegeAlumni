import React from 'react';

const EyeIcon = ({ open = false }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {open ? (
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="#334155"/>
    ) : (
      <>
        <path d="M3 3l18 18" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10.58 6.11A10.77 10.77 0 0 1 12 5c7 0 11 7 11 7a17.38 17.38 0 0 1-6 5.41" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M4.53 7.11A17.63 17.63 0 0 0 1 12s4 7 11 7a10.9 10.9 0 0 0 3.06-.44" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const PasswordToggle = ({ isVisible, onClick }) => (
  <button type="button" aria-label={isVisible ? 'Hide password' : 'Show password'} className="icon-toggle" onClick={onClick}>
    <EyeIcon open={isVisible} />
  </button>
);

export default PasswordToggle;


