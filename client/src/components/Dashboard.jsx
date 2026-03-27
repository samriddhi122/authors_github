import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [repos, setRepos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [creating, setCreating] = useState(false);

  // Commit State
  const [activeRepo, setActiveRepo] = useState(null);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [commitHistory, setCommitHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Branch State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedCommitId, setSelectedCommitId] = useState('');

  // Merge State
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [merging, setMerging] = useState(false);

  // Preference State
  const [theme, setTheme] = useState(localStorage.getItem('storyhub_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('storyhub_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await fetch('http://localhost:5000/repos', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRepos(data.repositories);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('http://localhost:5000/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description, visibility })
      });
      const data = await res.json();
      if (data.success) {
        setRepos([data.repository, ...repos]);
        setShowModal(false);
        setName('');
        setDescription('');
      } else {
        alert(data.error || 'Failed to create story');
      }
    } catch (err) {
      alert('Error creating story');
    } finally {
      setCreating(false);
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    setCommitting(true);
    try {
      const res = await fetch(`http://localhost:5000/repos/${activeRepo._id}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: commitMessage })
      });
      const data = await res.json();
      if (data.success) {
        setShowCommitModal(false);
        setCommitMessage('');
        alert('Commit created successfully! A snapshot has been saved to your Google Drive.');
      } else {
        alert(data.error || 'Failed to create commit');
      }
    } catch (err) {
      alert('Error creating commit');
    } finally {
      setCommitting(false);
    }
  };

  const loadHistory = async (repo) => {
    setActiveRepo(repo);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`http://localhost:5000/repos/${repo._id}/commits`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCommitHistory(data.commits);
      } else {
        alert(data.error || 'Failed to load history');
      }
    } catch (err) {
      alert('Error loading history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadBranches = async (repo) => {
    setActiveRepo(repo);
    setShowBranchModal(true);
    setLoadingBranches(true);
    try {
      const resB = await fetch(`http://localhost:5000/repos/${repo._id}/branches`, { credentials: 'include' });
      const dataB = await resB.json();
      if (dataB.success) setBranches(dataB.branches);
      
      const resC = await fetch(`http://localhost:5000/repos/${repo._id}/commits`, { credentials: 'include' });
      const dataC = await resC.json();
      if (dataC.success) {
        setCommitHistory(dataC.commits);
        if (dataC.commits.length > 0) setSelectedCommitId(dataC.commits[0]._id);
      }
    } catch (err) {
      alert('Error loading branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!selectedCommitId) return alert('You must select a base commit to branch from!');
    try {
      const res = await fetch(`http://localhost:5000/repos/${activeRepo._id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchName: newBranchName, baseCommitId: selectedCommitId })
      });
      const data = await res.json();
      if (data.success) {
        setBranches([...branches, data.branch]);
        setNewBranchName('');
        alert('Branch created successfully! A new working doc was generated.');
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Error creating branch'); }
  };

  const handleSwitchBranch = async (branchId) => {
    try {
      const res = await fetch(`http://localhost:5000/repos/${activeRepo._id}/switch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchId })
      });
      const data = await res.json();
      if (data.success) {
        setShowBranchModal(false);
        fetchRepos(); 
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Error switching branch'); }
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    if (mergeSource === mergeTarget) return alert('Source and Target cannot be the same!');
    if (!window.confirm(`Are you absolutely sure? This will safely overwrite the Timeline of your Target Branch with the Source Branch's Google Document!`)) return;
    setMerging(true);
    try {
      const res = await fetch(`http://localhost:5000/repos/${activeRepo._id}/branches/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourceBranchId: mergeSource, targetBranchId: mergeTarget })
      });
      const data = await res.json();
      if (data.success) {
        alert('Branches merged successfully! A Merge Commit snapshot was automatically taken!');
        setShowBranchModal(false);
        setMergeSource('');
        setMergeTarget('');
        fetchRepos();
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Merge error'); } finally { setMerging(false); }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="brand">StoryHub</div>
        <div className="profile-menu">
          <select 
            className="theme-select" 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">🔆 Light</option>
            <option value="dark">🌙 Dark</option>
            <option value="book">📚 Book</option>
            <option value="floral">🌸 Floral</option>
          </select>
          <img src={user.image} alt={user.displayName} className="avatar" />
          <span className="username">{user.displayName}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <header className="page-header">
          <h2>Your Stories</h2>
          <button className="btn-primary pulse-hover" onClick={() => setShowModal(true)}>
            + New Story
          </button>
        </header>

        {loading ? (
          <div className="loading">Loading stories...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : repos.length === 0 ? (
          <div className="empty-state">
            <p>You haven't written any stories yet.</p>
            <button className="btn-outline" onClick={() => setShowModal(true)}>Write your first story</button>
          </div>
        ) : (
          <div className="repo-grid">
            {repos.map((repo) => (
              <div key={repo._id} className="repo-card glass-card">
                <div className="card-header">
                  <h3>{repo.name}</h3>
                  <span className={`badge ${repo.visibility}`}>{repo.visibility}</span>
                </div>
                <p className="card-desc">{repo.description || 'No description provided.'}</p>
                <div className="card-footer">
                  <span className="date">Created {new Date(repo.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-outline btn-sm" 
                    onClick={() => loadBranches(repo)}
                  >
                    Branch
                  </button>
                  <button 
                    className="btn-outline btn-sm" 
                    onClick={() => loadHistory(repo)}
                  >
                    History
                  </button>
                  <button 
                    className="btn-outline btn-sm" 
                    onClick={() => { setActiveRepo(repo); setShowCommitModal(true); }}
                    disabled={!repo.currentDocId}
                  >
                    Commit
                  </button>
                  <a 
                    href={repo.currentDocId ? `https://docs.google.com/document/d/${repo.currentDocId}/edit` : `https://drive.google.com/drive/folders/${repo.driveFolderId}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-primary btn-sm docs-link-btn"
                    title={repo.currentDocId ? "Edit Story in Google Docs" : "Open Google Drive Folder"}
                  >
                    {repo.currentDocId ? "Edit ⇗" : "Folder ⇗"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal glass-card bounce-in">
            <div className="modal-header">
              <h2>Create New Story</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRepo} className="create-form">
              <div className="form-group">
                <label>Story Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. The Lord of the Rings" 
                  required 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="A brief summary of this repository..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">Public - Anyone can fork or read</option>
                  <option value="private">Private - Only you can access</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={creating}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommitModal && activeRepo && (
        <div className="modal-overlay">
          <div className="modal glass-card bounce-in">
            <div className="modal-header">
              <h2>Commit Snapshot</h2>
              <button className="close-btn" onClick={() => setShowCommitModal(false)}>×</button>
            </div>
            <p className="repo-context">Archiving current state of <strong>{activeRepo.name}</strong></p>
            <form onSubmit={handleCommit} className="create-form">
              <div className="form-group">
                <label>Commit Message</label>
                <input 
                  type="text" 
                  value={commitMessage} 
                  onChange={(e) => setCommitMessage(e.target.value)} 
                  placeholder="e.g. Finished Chapter 1" 
                  required 
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCommitModal(false)} disabled={committing}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={committing}>
                  {committing ? 'Committing...' : 'Save Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && activeRepo && (
        <div className="modal-overlay">
          <div className="modal glass-card bounce-in history-modal">
            <div className="modal-header">
              <h2>Commit History</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <p className="repo-context">History for <strong>{activeRepo.name}</strong></p>
            
            <div className="history-list">
              {loadingHistory ? (
                <p>Loading history...</p>
              ) : commitHistory.length === 0 ? (
                <p>No commits exist yet. Go write and make a commit!</p>
              ) : (
                commitHistory.map(commit => (
                  <div key={commit._id} className="commit-item">
                    <div className="commit-dot"></div>
                    <div className="commit-content">
                      <p className="commit-msg">{commit.message}</p>
                      <p className="commit-meta">{new Date(commit.createdAt).toLocaleString()}</p>
                      <a 
                        href={`https://docs.google.com/document/d/${commit.docId}/view`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-outline btn-xs"
                      >
                        View Snapshot
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showBranchModal && activeRepo && (
        <div className="modal-overlay">
          <div className="modal glass-card bounce-in">
            <div className="modal-header">
              <h2>Branches for {activeRepo.name}</h2>
              <button className="close-btn" onClick={() => setShowBranchModal(false)}>×</button>
            </div>

            <div className="branch-list" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Switch Branch</h3>
              {loadingBranches ? <p>Loading...</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {branches.map(b => (
                     <li key={b._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 0', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                      <span>
                        <strong style={{ color: 'white' }}>{b.name}</strong> 
                        {b.currentDocId === activeRepo.currentDocId && <span className="badge public" style={{marginLeft:'0.5rem'}}>Active</span>}
                      </span>
                      <button 
                        className="btn-primary btn-xs" 
                        onClick={() => handleSwitchBranch(b._id)}
                        disabled={b.currentDocId === activeRepo.currentDocId}
                      >
                        Switch Checkout
                      </button>
                    </li>
                  ))}
                  {branches.length === 0 && <p>No branches initialized.</p>}
                </ul>
              )}
            </div>

            <form onSubmit={handleCreateBranch} className="create-form" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Create New Branch</h3>
              <div className="form-group">
                <label>Branch Name</label>
                <input type="text" value={newBranchName} onChange={(e)=>setNewBranchName(e.target.value)} required placeholder="e.g. alternate-ending" />
              </div>
              <div className="form-group">
                <label>Fork from Commit (Snapshot)</label>
                <select value={selectedCommitId} onChange={(e)=>setSelectedCommitId(e.target.value)} required>
                  <option value="" disabled>Select a base commit...</option>
                  {commitHistory.length === 0 ? <option disabled>No commits available to branch from!</option> : null}
                  {commitHistory.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.message} ({new Date(c.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={commitHistory.length === 0} style={{ width: '100%' }}>Create Branch</button>
            </form>

            <form onSubmit={handleMerge} className="create-form" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Automated Story Merge</h3>
              <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label>Source Branch (Feature)</label>
                  <select value={mergeSource} onChange={(e)=>setMergeSource(e.target.value)} required>
                    <option value="" disabled>Select branch...</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>➡️</div>
                <div style={{ flex: 1 }}>
                  <label>Target Branch (Main)</label>
                  <select value={mergeTarget} onChange={(e)=>setMergeTarget(e.target.value)} required>
                    <option value="" disabled>Merge into...</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={merging || (mergeSource === mergeTarget && mergeSource !== '')} style={{ width: '100%', background: 'linear-gradient(to right, #10b981, #059669)', border: 'none' }}>
                {merging ? 'Executing Merge...' : '⚡ Merge Branches'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
