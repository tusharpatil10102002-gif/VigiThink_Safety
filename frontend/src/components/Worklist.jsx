import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, FolderOpen, AlertCircle, FileText, CheckCircle2, ChevronRight, Lock, Unlock, Download, Layers } from 'lucide-react';

export default function Worklist({ currentUser, onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('queue'); // queue, my_cases, all_open, action_items
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Error fetching worklist cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCase = async (caseNumber) => {
    try {
      const token = localStorage.getItem('token');
      const resCase = await fetch(`${API_BASE_URL}/cases/${caseNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resCase.ok) return;
      const c = await resCase.json();

      c.owner = currentUser.username;
      
      const resUpdate = await fetch(`${API_BASE_URL}/cases/${caseNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(c)
      });

      if (resUpdate.ok) {
        fetchCases();
        alert(`Case ${caseNumber} accepted into your personal queue.`);
      }
    } catch (err) {
      console.error('Error accepting case:', err);
    }
  };

  // Role workflow mapping helper
  const isUserResponsibleForState = (state) => {
    if (!currentUser) return true;
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Intake' && state === 'Case Triage') return true;
    if (currentUser.role === 'Data Entry' && state === 'Data Entry') return true;
    if (currentUser.role === 'Quality Control' && state === 'Quality Control') return true;
    if (currentUser.role === 'Medical Review' && state === 'Medical Review') return true;
    if (currentUser.role === 'Submission' && (state === 'Submission' || state === 'Regulatory Submission')) return true;
    return false;
  };

  const getRoleQueueTitle = () => {
    if (!currentUser) return 'Role Queue';
    switch (currentUser.role) {
      case 'Data Entry': return 'Data Entry Queue';
      case 'Quality Control': return 'QC Review Queue';
      case 'Medical Review': return 'Medical Review Queue';
      case 'Intake': return 'Triage Intake Queue';
      case 'Submission': return 'Regulatory Submission Queue';
      default: return 'All Workflow Queues';
    }
  };

  // Filter cases based on role and tab
  const getFilteredCases = () => {
    let result = [...cases];

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.caseNumber.toLowerCase().includes(q) ||
        (c.products?.[0]?.tradeName || '').toLowerCase().includes(q) ||
        (c.events?.[0]?.descriptionAsReported || '').toLowerCase().includes(q) ||
        (c.workflowState || '').toLowerCase().includes(q)
      );
    }

    if (activeSubTab === 'queue') {
      // Cases in user's role queue that are not closed
      result = result.filter(c => isUserResponsibleForState(c.workflowState) && c.workflowState !== 'Closed');
    } else if (activeSubTab === 'my_cases') {
      // Cases specifically assigned/owned by the user
      result = result.filter(c => (c.owner === currentUser.username || c.assignedUser === currentUser.username) && c.workflowState !== 'Closed');
    } else if (activeSubTab === 'all_open') {
      // All open cases across system
      result = result.filter(c => c.workflowState !== 'Closed');
      if (stageFilter !== 'ALL') {
        result = result.filter(c => c.workflowState === stageFilter);
      }
    } else if (activeSubTab === 'action_items') {
      // Return cases with open action items
      result = result.filter(c => c.workflowState !== 'Closed' && c.activities?.actionItems?.some(item => !item.completed));
    }

    return result;
  };

  const exportToCSV = () => {
    const data = getFilteredCases();
    if (!data || data.length === 0) return alert('No cases to export');
    
    const headers = ['Case Number', 'Workflow State', 'Priority', 'Report Type', 'Country', 'Receipt Date', 'Products', 'Events'];
    
    const csvRows = data.map(c => {
      const prods = (c.products || []).map(p => p.tradeName).join('; ');
      const evs = (c.events || []).map(e => e.descriptionAsReported).join('; ');
      return [
        c.caseNumber,
        c.workflowState,
        c.priority,
        c.general?.reportType || '',
        c.general?.country || '',
        c.companyReceivedDate || '',
        `"${prods}"`,
        `"${evs}"`
      ].join(',');
    });
    
    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vigithink_Worklist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filtered = getFilteredCases();

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Worklist Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Active cases categorized by role, workflow state, and assigned ownership.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="role-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            Role: <strong>{currentUser?.role}</strong>
          </span>
        </div>
      </div>

      {/* Worklist Sub tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', pb: '1px' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`tab-btn ${activeSubTab === 'queue' ? 'active' : ''}`}
            style={{ borderBottom: 'none' }}
          >
            <AlertCircle size={16} /> {getRoleQueueTitle()} ({cases.filter(c => isUserResponsibleForState(c.workflowState) && c.workflowState !== 'Closed').length})
          </button>
          <button
            onClick={() => setActiveSubTab('my_cases')}
            className={`tab-btn ${activeSubTab === 'my_cases' ? 'active' : ''}`}
            style={{ borderBottom: 'none' }}
          >
            <FolderOpen size={16} /> My Assigned Cases ({cases.filter(c => (c.owner === currentUser?.username || c.assignedUser === currentUser?.username) && c.workflowState !== 'Closed').length})
          </button>
          <button
            onClick={() => setActiveSubTab('all_open')}
            className={`tab-btn ${activeSubTab === 'all_open' ? 'active' : ''}`}
            style={{ borderBottom: 'none' }}
          >
            <Layers size={16} /> All Open Cases ({cases.filter(c => c.workflowState !== 'Closed').length})
          </button>
          <button
            onClick={() => setActiveSubTab('action_items')}
            className={`tab-btn ${activeSubTab === 'action_items' ? 'active' : ''}`}
            style={{ borderBottom: 'none' }}
          >
            <FileText size={16} /> Action Items
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ width: '220px' }}>
            <input
              type="text"
              placeholder="Search worklist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.8rem' }}
            />
            <Search className="search-icon-inside" />
          </div>
          <button className="btn btn-secondary" onClick={exportToCSV} title="Export current view to CSV" style={{ fontSize: '0.8rem' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Admin / Stage Filter for All Open Cases */}
      {activeSubTab === 'all_open' && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>Stage Filter:</span>
          {['ALL', 'Case Triage', 'Data Entry', 'Quality Control', 'Medical Review', 'Regulatory Submission'].map(stage => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid',
                cursor: 'pointer',
                backgroundColor: stageFilter === stage ? '#2563eb' : '#ffffff',
                color: stageFilter === stage ? '#ffffff' : 'var(--text-secondary)',
                borderColor: stageFilter === stage ? '#2563eb' : 'var(--border-color)',
                fontWeight: stageFilter === stage ? 600 : 400
              }}
            >
              {stage}
            </button>
          ))}
        </div>
      )}

      {/* Table grid */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Retrieving queue information...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No cases match the selected filter.
          </div>
        ) : (
          <table className="pv-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Workflow State</th>
                <th>Suspect Product</th>
                <th>Adverse Event (PT)</th>
                <th>Seriousness</th>
                <th>Assigned Owner</th>
                <th>Status / Access</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isMyResponsible = isUserResponsibleForState(c.workflowState);
                const isLocked = c.lockState === 'Locked';

                return (
                  <tr key={c.caseNumber}>
                    <td>
                      <span className="case-link" onClick={() => onSelectCase(c.caseNumber)}>
                        {c.caseNumber}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge role-${(c.workflowState || '').toLowerCase().replace(' ', '')}`}>
                        {c.workflowState}
                      </span>
                    </td>
                    <td>{c.products?.[0]?.tradeName || 'Unknown Product'}</td>
                    <td>{c.events?.[0]?.coding?.pt || c.events?.[0]?.descriptionAsReported || 'Uncoded Event'}</td>
                    <td>
                      {Object.values(c.events?.[0]?.seriousness || {}).some(Boolean) ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Serious</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Non-Serious</span>
                      )}
                    </td>
                    <td>@{c.owner || 'Unassigned'}</td>
                    <td>
                      {isMyResponsible ? (
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={13} /> Active Edit
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Lock size={13} /> Read Only
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => onSelectCase(c.caseNumber)}
                        >
                          Open <ChevronRight size={13} />
                        </button>
                        {isMyResponsible && c.owner !== currentUser?.username && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#2563eb' }}
                            onClick={() => handleAcceptCase(c.caseNumber)}
                            title="Accept ownership"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
