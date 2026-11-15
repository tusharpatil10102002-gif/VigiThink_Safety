import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertTriangle, Play, Check } from 'lucide-react';

export default function Dashboard({ onSelectCase, currentUser }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
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
      console.error('Error fetching dashboard cases:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading dashboard analytics...</div>;
  }

  // Calculate statistics
  const totalCases = cases.length;
  
  const isUserResponsibleForState = (state) => {
    if (!currentUser) return true; // Fallback
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Intake' && state === 'Case Triage') return true;
    if (currentUser.role === 'Data Entry' && state === 'Data Entry') return true;
    if (currentUser.role === 'Quality Control' && state === 'Quality Control') return true;
    if (currentUser.role === 'Medical Review' && state === 'Medical Review') return true;
    if (currentUser.role === 'Submission' && state === 'Regulatory Submission') return true;
    return false;
  };
  
  const myPendingCount = cases.filter(c => isUserResponsibleForState(c.workflowState) && c.workflowState !== 'Closed').length;

  const triageCount = cases.filter(c => c.workflowState === 'Case Triage').length;
  const dataEntryCount = cases.filter(c => c.workflowState === 'Data Entry').length;
  const qcCount = cases.filter(c => c.workflowState === 'Quality Control').length;
  const mrCount = cases.filter(c => c.workflowState === 'Medical Review').length;
  const submissionCount = cases.filter(c => c.workflowState === 'Submission').length;
  const closedCount = cases.filter(c => c.workflowState === 'Closed').length;

  const urgentCases = cases.filter(c => {
    if (c.workflowState === 'Closed') return false;
    const hoursLeft = (new Date(c.deadline) - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 72; // Less than 3 days
  });

  const overdueCases = cases.filter(c => {
    if (c.workflowState === 'Closed') return false;
    return new Date(c.deadline) < Date.now();
  });

  // Calculate state percentages
  const getPercentage = (count) => {
    if (totalCases === 0) return 0;
    return Math.round((count / totalCases) * 100);
  };

  // Helper to format remaining time
  const getRemainingTime = (deadlineStr) => {
    const diff = new Date(deadlineStr) - Date.now();
    if (diff < 0) {
      return { text: 'OVERDUE', color: 'red' };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days === 0 && hours <= 72) {
      return { text: `${hours}h ${minutes}m remaining`, color: 'red' };
    }
    if (days < 5) {
      return { text: `${days}d ${hours}h remaining`, color: 'yellow' };
    }
    return { text: `${days}d ${hours}h remaining`, color: 'green' };
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            System Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time Pharmacovigilance safety cases workflow and compliance tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="kpi-info">
            <h3>Total Booked Cases</h3>
            <div className="kpi-val">{totalCases}</div>
          </div>
          <div className="kpi-icon" style={{ color: 'var(--primary)' }}>
            <Shield size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="kpi-info">
            <h3>My Action Pending</h3>
            <div className="kpi-val">{myPendingCount}</div>
          </div>
          <div className="kpi-icon" style={{ color: 'var(--color-warning)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="kpi-info">
            <h3>Overdue Cases</h3>
            <div className="kpi-val">{overdueCases.length}</div>
          </div>
          <div className="kpi-icon" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="kpi-info">
            <h3>Completed Submissions</h3>
            <div className="kpi-val">{closedCount}</div>
          </div>
          <div className="kpi-icon" style={{ color: 'var(--color-success)' }}>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
        {/* Workflow State Chart */}
        <div className="table-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>
            Workflow Stage Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Case Triage', count: triageCount, color: 'var(--color-success)' },
              { label: 'Data Entry', count: dataEntryCount, color: 'var(--primary)' },
              { label: 'Quality Control (QC)', count: qcCount, color: 'var(--color-warning)' },
              { label: 'Medical Review (MR)', count: mrCount, color: 'var(--color-info)' },
              { label: 'Regulatory Submission', count: submissionCount, color: 'var(--accent-teal)' },
              { label: 'Archived / Closed', count: closedCount, color: 'var(--text-muted)' }
            ].map(stage => (
              <div key={stage.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: '500' }}>{stage.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {stage.count} cases ({getPercentage(stage.count)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${getPercentage(stage.count)}%`,
                    height: '100%',
                    backgroundColor: stage.color,
                    borderRadius: '9999px',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Timeline Monitor */}
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="table-header-bar">
            <h3 className="table-title">Critical Compliance Timers</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: '600' }}>
              Requires Immediate Action
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Suspect Drug</th>
                  <th>Workflow State</th>
                  <th>Regulatory Deadline</th>
                </tr>
              </thead>
              <tbody>
                {cases.filter(c => c.workflowState !== 'Closed' && isUserResponsibleForState(c.workflowState)).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      All cases completed and archived. Excellent compliance!
                    </td>
                  </tr>
                ) : (
                  cases
                    .filter(c => c.workflowState !== 'Closed' && isUserResponsibleForState(c.workflowState))
                    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                    .slice(0, 5)
                    .map(c => {
                      const timer = getRemainingTime(c.deadline);
                      const codedEvent = c.events[0]?.coding?.pt || c.events[0]?.descriptionAsReported || 'Unknown';
                      return (
                        <tr key={c.caseNumber}>
                          <td>
                            <span className="case-link" onClick={() => onSelectCase(c.caseNumber)}>
                              {c.caseNumber}
                            </span>
                          </td>
                          <td>
                            <strong>{c.products[0]?.tradeName || 'Unknown'}</strong>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{codedEvent}</div>
                          </td>
                          <td>
                            <span className={`role-badge role-${c.workflowState.toLowerCase().replace(' ', '')}`}>
                              {c.workflowState}
                            </span>
                          </td>
                          <td>
                            <div className="timer-item" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                              <span className={`timer-indicator ${timer.color}`} />
                              <span style={{
                                color: timer.color === 'red' ? 'var(--color-danger)' : timer.color === 'yellow' ? 'var(--color-warning)' : 'var(--color-success)'
                              }}>
                                {timer.text}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
