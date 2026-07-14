import { useEffect, useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = () => {
      fetch(`${API_URL}/auth/user`, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": API_URL,
          "Access-Control-Allow-Credentials": "true",
        },
        method: "GET",
        credentials: "include", // IMPORTANT: This sends the session cookie
      })
        .then(res => {
          if (res.status === 200) return res.json();
          throw new Error("authentication has been failed!");
        })
        .then(res => {
          setUser(res);
        })
        .catch(err => {
          console.log("Not logged in");
        });
    };
    getUser();
  }, []);

  const handleLogin = () => {
    window.open(`${API_URL}/auth/google`, '_self');
  };

  const handleLogout = () => {
    window.open(`${API_URL}/auth/logout`, '_self');
  };

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Writer's Platform</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            A specialized open-source platform for writers. Login to start writing.
          </p>
          <button className="btn" onClick={handleLogin}>
            Sign in with Google
          </button>
        </div>
      )}
    </>
  );
}

export default App
