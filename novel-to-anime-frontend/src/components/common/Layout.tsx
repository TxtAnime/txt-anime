import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '16px' }}>🎬</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Novel to Anime</span>
            </Link>
            
            {!isHomePage && (
              <Link
                to="/"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#6b7280', textDecoration: 'none', borderRadius: '8px' }}
              >
                <span style={{ fontSize: '16px' }}>🏠</span>
                <span>Home</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main style={{ padding: '24px 0' }}>
        {children}
      </main>
      
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', marginTop: '64px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            © 2024 Novel to Anime • Powered by AI
          </div>
        </div>
      </footer>
    </div>
  );
};