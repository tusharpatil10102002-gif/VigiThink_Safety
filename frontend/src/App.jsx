import { API_BASE_URL } from './config';
import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, Briefcase, PlusCircle, Search, Settings, LogOut, Terminal, History, ArrowRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Worklist from './components/Worklist';
import CaseBookIn from './components/CaseBookIn';
import CaseForm from './components/CaseForm';
import AdminConsole from './components/AdminConsole';
import AuditTrailModal from './components/AuditTrailModal';
import CaseRoutingModal from './components/CaseRoutingModal';
import ReportsView from './components/ReportsView';

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token') || localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  
  // Navigation / Views state
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, worklist, bookin, admin, search
  const [selectedCaseNumber, setSelectedCaseNumber] = useState(null);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Quick Launch & Search State
  const [quickLaunchNum, setQuickLaunchNum] = useState('');
  const [allCases, setAllCases] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Audit / Routing Global Modals
  const [routingOpen, setRoutingOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchAllCases();
    }
  }, [token]);

  useEffect(() => {
    const handleSessionExpired = () => {
      alert("You have been logged out because your account was accessed from another device or tab.");
      handleLogout(false);
    };
    window.addEventListener('session-expired', handleSessionExpired);

    const originalFetch = window.fetch;
    window.fetch = async function () {
      const response = await originalFetch.apply(this, arguments);
      if (response.status === 401 && (!arguments[0] || !arguments[0].toString().includes('/auth/login'))) {
        const cloned = response.clone();
        try {
          const data = await cloned.json();
          if (data.message === 'Session Expired (Logged in from another device)') {
            window.dispatchEvent(new Event('session-expired'));
          } else {
            handleLogout(false);
          }
        } catch(e) {
          handleLogout(false);
        }
      }
      return response;
    };

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
      window.fetch = originalFetch;
    };
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllCases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllCases(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const userToAuth = (username || '').trim();
    const passToAuth = password;

    // Zero-out sensitive password from component state immediately
    setUsername('');
    setPassword('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToAuth, password: passToAuth })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // 21 CFR Part 11: Store session token in sessionStorage & localStorage
      sessionStorage.setItem('token', data.token);
      localStorage.setItem('token', data.token);

      setToken(data.token);
      setCurrentUser(data.user);
      setCurrentView('dashboard');
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password. Please verify your credentials.');
    }
  };

  const handleLogout = async (callApi = true) => {
    if (callApi && token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
    // Fully clear browser session storage to prevent credential or token retention
    sessionStorage.clear();
    localStorage.clear();
    setToken(null);
    setCurrentUser(null);
    setSelectedCaseNumber(null);
    setCurrentView('dashboard');
    setUsername('');
    setPassword('');
  };

  const handleQuickLaunch = () => {
    if (!quickLaunchNum) return;
    const cleanNum = quickLaunchNum.trim().toUpperCase();
    const caseExists = allCases.some(c => c.caseNumber.toUpperCase() === cleanNum);
    if (caseExists) {
      setSelectedCaseNumber(cleanNum);
      setQuickLaunchNum('');
    } else {
      alert(`Case ID "${cleanNum}" not found in database.`);
    }
  };

  // Login page layout
  if (!token || !currentUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'radial-gradient(circle at center, #1e293b, #0f172a)'
      }}>
        <div className="table-container" style={{ width: '400px', padding: '2rem', boxShadow: 'var(--shadow-premium)', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src="1.png" alt="Vigithink Safety Logo" style={{ height: '56px', margin: '0 auto 0.75rem auto', display: 'block', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem' }}>Vigithink Safety</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              Pharmacovigilance Enterprise Portal
            </p>
          </div>

          {loginError && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              marginBottom: '1rem',
              lineHeight: '1.4'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Authorized Username / Email</label>
              <input
                type="text"
                placeholder="Enter authorized username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-control"
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Sign In to Safety DB <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            🔒 <strong>Restricted Enterprise Safety System</strong><br/>
            Authorized pharmacovigilance personnel only. All access, queries, and modifications are audited under 21 CFR Part 11.
          </div>
        </div>
      </div>
    );
  }

  // Active Case object if selected
  const activeCaseObject = allCases.find(c => c.caseNumber === selectedCaseNumber);

  return (
    <div className="app-container">
      {/* Header bar */}
      <header className="app-header">
        <div className="app-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <img src="2.png" alt="Logo" style={{ height: '32px', backgroundColor: '#ffffff', padding: '2px', borderRadius: '4px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = '1.png'; }} />
          <span className="app-title">Vigithink Safety</span>
        </div>

        {/* Quick launch (Page 3) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="search-input-wrapper" style={{ width: '200px' }}>
            <input
              type="text"
              placeholder="Quick Case Launch..."
              value={quickLaunchNum}
              onChange={(e) => setQuickLaunchNum(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickLaunch()}
              style={{ padding: '0.375rem 1rem 0.375rem 2rem', fontSize: '0.8rem' }}
            />
            <Search className="search-icon-inside" style={{ width: '14px', height: '14px' }} />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }} onClick={handleQuickLaunch}>
            Open
          </button>
        </div>

        {/* User profile details */}
        <div className="user-profile">
          <span style={{ color: 'var(--text-secondary)' }}>Welcome, <strong>{currentUser.name}</strong></span>
          <span className={`role-badge role-${currentUser.role.toLowerCase().replace(' ', '')}`}>
            {currentUser.role}
          </span>
          <button className="quick-btn" onClick={handleLogout} title="Log Out" style={{ color: 'var(--color-danger)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="sidebar-title">Safety Navigation</span>
            <div className="sidebar-menu">
              <div
                className={`nav-item ${currentView === 'dashboard' && !selectedCaseNumber ? 'active' : ''}`}
                onClick={() => { setSelectedCaseNumber(null); setCurrentView('dashboard'); }}
              >
                <LayoutDashboard size={16} /> Dashboard Portal
              </div>
              
              <div
                className={`nav-item ${currentView === 'worklist' && !selectedCaseNumber ? 'active' : ''}`}
                onClick={() => { setSelectedCaseNumber(null); setCurrentView('worklist'); }}
              >
                <Briefcase size={16} /> Worklist Queue
              </div>

              {(currentUser.role === 'Admin' || currentUser.role === 'Intake') && (
                <div
                  className={`nav-item ${currentView === 'bookin' && !selectedCaseNumber ? 'active' : ''}`}
                  onClick={() => { setSelectedCaseNumber(null); setCurrentView('bookin'); }}
                >
                  <PlusCircle size={16} /> Initial Case Entry
                </div>
              )}

              <div
                className={`nav-item ${currentView === 'search' && !selectedCaseNumber ? 'active' : ''}`}
                onClick={() => { setSelectedCaseNumber(null); setCurrentView('search'); }}
              >
                <Search size={16} /> Open Case Search
              </div>

              <div
                className={`nav-item ${currentView === 'reports' && !selectedCaseNumber ? 'active' : ''}`}
                onClick={() => { setSelectedCaseNumber(null); setCurrentView('reports'); }}
              >
                <Terminal size={16} /> Database Reports
              </div>
            </div>
          </div>

          {/* Context workflow tools for active Case */}
          {selectedCaseNumber && activeCaseObject && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--border-color)', pt: '1rem', marginTop: '0.5rem' }}>
              <span className="sidebar-title" style={{ marginTop: '0.5rem' }}>Case Utilities ({selectedCaseNumber})</span>
              <div className="sidebar-menu">
                <div className="nav-item" onClick={() => setRoutingOpen(true)}>
                  <Settings size={16} /> Route / Routing
                </div>
                <div className="nav-item" onClick={() => setAuditOpen(true)}>
                  <History size={16} /> Case Revisions
                </div>
              </div>
            </div>
          )}

          {/* Admin options */}
          {currentUser.role === 'Admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--border-color)', pt: '1rem', marginTop: 'auto' }}>
              <span className="sidebar-title">Admin Console</span>
              <div className="sidebar-menu">
                <div
                  className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => { setSelectedCaseNumber(null); setCurrentView('admin'); }}
                >
                  <Terminal size={16} /> Configure System
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Content pane */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          {selectedCaseNumber ? (
            <CaseForm
              caseNumber={selectedCaseNumber}
              onBack={() => { setSelectedCaseNumber(null); fetchAllCases(); }}
              currentUser={currentUser}
            />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <Dashboard currentUser={currentUser} onSelectCase={(num) => setSelectedCaseNumber(num)} />
              )}
              {currentView === 'worklist' && (
                <Worklist currentUser={currentUser} onSelectCase={(num) => setSelectedCaseNumber(num)} />
              )}
              {currentView === 'bookin' && (
                <CaseBookIn onBookInSuccess={(num) => {
                  setSelectedCaseNumber(num);
                  fetchAllCases();
                }} />
              )}
              {currentView === 'admin' && <AdminConsole />}
              {currentView === 'search' && (
                <div className="page-container">
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                      Open Case Search
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Query all individual case safety report records using specific parameters (Page 14 & 15).
                    </p>
                  </div>

                  <div className="table-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="search-input-wrapper" style={{ flex: 1 }}>
                        <input
                          type="text"
                          placeholder="Search by Case Number, Product name, Event term, or Country..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                        />
                        <Search className="search-icon-inside" />
                      </div>
                    </div>

                    <table className="pv-table">
                      <thead>
                        <tr>
                          <th>Case ID</th>
                          <th>Receipt Date</th>
                          <th>Report Type</th>
                          <th>Suspect Drug</th>
                          <th>Adverse Event</th>
                          <th>Workflow State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCases
                          .filter(c => {
                            if (!searchFilter) return true;
                            const filterVal = searchFilter.toLowerCase();
                            return (
                              c.caseNumber.toLowerCase().includes(filterVal) ||
                              c.products[0]?.tradeName.toLowerCase().includes(filterVal) ||
                              c.events[0]?.descriptionAsReported.toLowerCase().includes(filterVal) ||
                              c.general.country.toLowerCase().includes(filterVal)
                            );
                          })
                          .map(c => (
                            <tr key={c.caseNumber}>
                              <td>
                                <span className="case-link" onClick={() => setSelectedCaseNumber(c.caseNumber)}>
                                  {c.caseNumber}
                                </span>
                              </td>
                              <td>{c.general.initialReceiptDate}</td>
                              <td>{c.general.reportType}</td>
                              <td>{c.products[0]?.tradeName}</td>
                              <td>{c.events[0]?.descriptionAsReported}</td>
                              <td>
                                <span className={`role-badge role-${c.workflowState.toLowerCase().replace(' ', '')}`}>
                                  {c.workflowState}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {currentView === 'reports' && (
                <ReportsView />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals for active case */}
      {selectedCaseNumber && activeCaseObject && (
        <>
          <CaseRoutingModal
            isOpen={routingOpen}
            onClose={() => setRoutingOpen(false)}
            caseNumber={selectedCaseNumber}
            currentWorkflowState={activeCaseObject.workflowState}
            currentUser={currentUser}
            onRouteSuccess={(updatedCase) => {
              fetchAllCases();
              setSelectedCaseNumber(updatedCase.caseNumber);
              alert('Workflow routing complete.');
            }}
          />
          <AuditTrailModal
            isOpen={auditOpen}
            onClose={() => setAuditOpen(false)}
            caseNumber={selectedCaseNumber}
          />
        </>
      )}
    </div>
  );
}
