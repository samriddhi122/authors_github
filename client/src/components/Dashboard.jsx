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

  // Community State
  const [currentView, setCurrentView] = useState('workspace');
  const [publicRepos, setPublicRepos] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Pull Request State
  const [showPrModal, setShowPrModal] = useState(false);
  const [prs, setPrs] = useState({ incoming: [], outgoing: [] });
  const [newPrTitle, setNewPrTitle] = useState('');
  const [newPrDesc, setNewPrDesc] = useState('');
  const [prSourceBranchId, setPrSourceBranchId] = useState('');

  // Preference State
  const [theme, setTheme] = useState(localStorage.getItem('storyhub_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('storyhub_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchRepos();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/repos/notifications/pulls', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) { console.error('Error fetching notifications'); }
  };

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

  const fetchCommunityRepos = async () => {
    try {
      const res = await fetch('http://localhost:5000/repos/public', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPublicRepos(data.repositories);
    } catch (err) { console.error('Error fetching community repos', err); }
  };

  const handleFork = async (repoId) => {
    if (!window.confirm('Fork this story into your own workspace? This isolates a new physical copy in your Google Drive!')) return;
    try {
      const res = await fetch(`http://localhost:5000/repos/${repoId}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        alert('Successfully forked the storyline to your Workspace!');
        fetchRepos();
        setCurrentView('workspace');
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Failed to fork repository'); }
  };

  const loadPrs = async (repo) => {
    setActiveRepo(repo);
    try {
      const res = await fetch(`http://localhost:5000/repos/${repo._id}/pulls`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPrs({ incoming: data.incoming, outgoing: data.outgoing });
        setShowPrModal(true);
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Error loading Pull Requests'); }
  };

  const handleAcceptPr = async (prId) => {
    if (!window.confirm("Merge this author's story branch securely into your Google Document timeline natively?")) return;
    try {
      const res = await fetch(`http://localhost:5000/repos/${activeRepo._id}/pulls/${prId}/merge`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        alert('PR successfully merged! Your active document has successfully inherited their exact codebase edits!');
        setShowPrModal(false);
        fetchRepos();
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Error merging PR dynamically!'); }
  };

  const handleAcceptGlobalPr = async (pr) => {
    if (!window.confirm("Merge this author's story branch securely into your Google Document timeline natively?")) return;
    try {
      const res = await fetch(`http://localhost:5000/repos/${pr.targetRepoId._id}/pulls/${pr._id}/merge`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        alert('PR successfully merged! Your workspace has successfully inherited their exact codebase edits!');
        fetchNotifications();
        fetchRepos();
        if (showPrModal) setShowPrModal(false);
      } else {
        alert(data.error);
      }
    } catch (err) { alert('Error merging global PR!'); }
  };

  const handleSubmitPr = async (e) => {
    e.preventDefault();
    if (!newPrTitle || !prSourceBranchId) return alert('Title and Source Branch required');
    try {
      const res = await fetch(`http://localhost:5000/repos/${activeRepo.forkedFrom}/pulls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          sourceRepoId: activeRepo._id, 
          sourceBranchId: prSourceBranchId, 
          title: newPrTitle, 
          description: newPrDesc 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pull Request submitted successfully to original author!');
        setShowPrModal(false);
        setNewPrTitle('');
        setNewPrDesc('');
      } else {
        alert(data.error);
      }
    } catch (err) { alert('PR Submission Error'); }
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
        <div className="view-tabs" style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid var(--border)', marginBottom: '2rem' }}>
          <button 
            onClick={() => setCurrentView('workspace')} 
            style={{ background: 'transparent', color: currentView === 'workspace' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', padding: '0.5rem 0', borderBottom: currentView === 'workspace' ? '2px solid var(--primary)' : 'none', marginBottom: '-2px' }}>
            My Workspace
          </button>
          <button 
            onClick={() => { setCurrentView('explore'); fetchCommunityRepos(); }} 
            style={{ background: 'transparent', color: currentView === 'explore' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', padding: '0.5rem 0', borderBottom: currentView === 'explore' ? '2px solid var(--primary)' : 'none', marginBottom: '-2px' }}>
            Explore Community
          </button>
          <button 
            onClick={() => { setCurrentView('notifications'); fetchNotifications(); }} 
            style={{ position: 'relative', background: 'transparent', color: currentView === 'notifications' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', padding: '0.5rem 0', borderBottom: currentView === 'notifications' ? '2px solid var(--primary)' : 'none', marginBottom: '-2px' }}>
            Notifications
            {notifications.length > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-15px', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{notifications.length}</span>}
          </button>
        </div>

        {currentView === 'workspace' && (
          <>
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
                        style={{marginTop: '0.5rem'}}
                      >
                        {repo.currentDocId ? "Edit ⇗" : "Folder ⇗"}
                      </a>
                    </div>
                    <div className="card-actions" style={{ marginTop: '0', paddingTop: '0.5rem', borderTop: 'none' }}>
                      <button 
                        className="btn-outline btn-sm" 
                        onClick={() => { loadBranches(repo); loadPrs(repo); }}
                        style={{ width: '100%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))', borderColor: 'var(--primary)' }}
                      >
                        {repo.forkedFrom ? 'Submit Pull Request 🚀' : 'Review Pull Requests 🚀'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentView === 'explore' && (
          <>
            <div className="page-header">
              <h2>Community Discoveries</h2>
            </div>
            
            <div className="repo-grid">
              {publicRepos.length === 0 ? (
                <div className="empty-state">
                  <p>No public stories have been published yet.</p>
                </div>
              ) : (
                publicRepos.map(repo => (
                  <div key={repo._id} className="glass-card repo-card">
                    <div className="card-header">
                      <h3>{repo.name} {repo.forkedFrom && <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>(Forked)</span>}</h3>
                      <span className="badge public">Public</span>
                    </div>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: '500', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={repo.ownerId?.image} alt={repo.ownerId?.displayName} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      {repo.ownerId?.displayName || 'Unknown Author'}
                    </p>
                    <p className="card-desc">{repo.description}</p>
                    
                    <div className="card-actions" style={{ borderTop: 'none', paddingTop: 0, display: 'flex', gap: '0.5rem' }}>
                      <a 
                        href={`https://docs.google.com/document/d/${repo.currentDocId}/view`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-outline btn-sm"
                        style={{flex: 1, textAlign: 'center', textDecoration: 'none', background: 'var(--surface)'}}
                      >
                        📖 Read Story ⇗
                      </a>
                      
                      {/* {repo.ownerId?._id !== user._id && ( */}
                        <button className="btn-primary" onClick={() => handleFork(repo._id)} style={{ flex: 1, background: 'linear-gradient(to right, #8b5cf6, #d946ef)', border: 'none' }}>
                          🍴 Fork Story
                        </button>
                      {/* )} */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {currentView === 'notifications' && (
          <>
            <div className="page-header">
              <h2>Pending Approvals</h2>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>You caught up on everything! No pending pull requests.</p>
              </div>
            ) : (
              <div className="repo-grid">
                {notifications.map(pr => (
                  <div key={pr._id} className="glass-card repo-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="card-header">
                      <h3>{pr.title}</h3>
                      <span className="badge public">PR</span>
                    </div>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: '500', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={pr.sourceRepoId?.ownerId?.image} alt={pr.sourceRepoId?.ownerId?.displayName} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      {pr.sourceRepoId?.ownerId?.displayName || 'Unknown Author'} wants to merge into <strong>{pr.targetRepoId?.name}</strong>
                    </p>
                    <p className="card-desc" style={{ fontStyle: 'italic' }}>"{pr.description}"</p>
                    
                    <div className="card-actions" style={{ borderTop: 'none', paddingTop: 0, display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => handleAcceptGlobalPr(pr)} style={{ width: '100%', background: 'linear-gradient(to right, #10b981, #059669)', border: 'none' }}>
                         Check & Merge File Natively
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Repo Modal */}
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

      {/* Pull Request Modal */}
      {showPrModal && activeRepo && (
        <div className="modal-overlay">
          <div className="modal glass-card bounce-in">
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <h2>{activeRepo.forkedFrom ? 'Submit Pull Request' : 'Review Pull Requests'}</h2>
              <button className="close-btn" onClick={() => setShowPrModal(false)}>&times;</button>
            </div>

            {activeRepo.forkedFrom ? (
              <form onSubmit={handleSubmitPr} className="create-form">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Propose merging your story changes back into the original author's repository.
                </p>
                <div className="form-group">
                  <label>Which of your branches do you want to submit?</label>
                  <select value={prSourceBranchId} onChange={(e) => setPrSourceBranchId(e.target.value)} required>
                    <option value="" disabled>Select branch...</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pull Request Title</label>
                  <input type="text" value={newPrTitle} onChange={(e) => setNewPrTitle(e.target.value)} required placeholder="e.g. Added a plot twist to Chapter 3" />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea value={newPrDesc} onChange={(e) => setNewPrDesc(e.target.value)} rows="3" placeholder="Describe what you altered..." />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Submit Pull Request ✨</button>
              </form>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Incoming PRs (Pending Review)</h3>
                
                {prs.incoming.filter(pr => pr.status === 'open').length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No pending pull requests yet.</p>
                ) : (
                  <div className="history-list" style={{ maxHeight: '300px' }}>
                    {prs.incoming.filter(pr => pr.status === 'open').map(pr => (
                      <div key={pr._id} className="commit-item" style={{ alignItems: 'flex-start', paddingBottom: '1rem' }}>
                        <div className="commit-content" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                          <h4 className="commit-msg">{pr.title}</h4>
                          <p className="commit-meta" style={{ marginBottom: '0.5rem' }}>From: <strong>{pr.sourceRepoId?.ownerId?.displayName || 'Unknown Author'}</strong></p>
                          <p className="commit-meta" style={{ marginBottom: '1rem', fontStyle: 'italic' }}>{pr.description}</p>
                          <button className="btn-primary btn-sm" onClick={() => handleAcceptPr(pr._id)} style={{ background: '#10b981', border: 'none', width: '100%' }}>Accept & Merge Native Doc</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
