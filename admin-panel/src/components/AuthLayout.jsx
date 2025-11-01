import React from 'react';
import '../styles/auth.css';

const AuthLayout = ({ title, subtitle, children, footer, leftTitle = 'Practice', leftSubtitle = 'easy to complex problems', withHeader = false }) => {
  return (
    <div className={`auth-wrapper ${withHeader ? 'with-header' : ''}`}>
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="brand">unstop</div>
            <div className="hero">
              <div className="hero-figure" />
              <div className="hero-text">
                <div className="hero-title">{leftTitle}</div>
                <div className="hero-subtitle">{leftSubtitle}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form">
            <h2 className="auth-title">{title}</h2>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            {children}
            {footer && <div className="auth-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

