import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { X, Send, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CaseRoutingModal({ isOpen, onClose, caseNumber, currentWorkflowState, currentUser, onRouteSuccess }) {
  const [nextState, setNextState] = useState('');
  const [comment, setComment] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userRole = currentUser?.role || 'Admin';

  const getAvailableStates = () => {
    if (userRole === 'Admin') {
      return [
        { value: 'Case Triage', label: 'Case Triage (Intake)' },
        { value: 'Data Entry', label: 'Data Entry' },
        { value: 'Quality Control', label: 'Quality Control (QC)' },
        { value: 'Medical Review', label: 'Medical Review (MR)' },
        { value: 'Regulatory Submission', label: 'Regulatory Submission' },
        { value: 'Closed', label: 'Closed (Final Archival)' }
      ].filter(s => s.value !== currentWorkflowState);
    }
    if (userRole === 'Intake') {
      if (currentWorkflowState === 'Case Triage') {
        return [{ value: 'Data Entry', label: 'Data Entry (Send for Processing)' }];
      }
      return [];
    }
    if (userRole === 'Data Entry') {
      if (currentWorkflowState === 'Data Entry' || currentWorkflowState === 'Case Triage') {
        return [
          { value: 'Quality Control', label: 'Quality Control (Send for QC Review)' },
          { value: 'Medical Review', label: 'Medical Review (Send for Medical Assessment)' }
        ];
      }
      return [];
    }
    if (userRole === 'Quality Control') {
      if (currentWorkflowState === 'Quality Control') {
        return [
          { value: 'Regulatory Submission', label: 'Regulatory Submission (QC Approved)' },
          { value: 'Medical Review', label: 'Medical Review (Send to Physician)' },
          { value: 'Data Entry', label: 'Data Entry (Return for Correction)' }
        ];
      }
      return [];
    }
    if (userRole === 'Medical Review') {
      if (currentWorkflowState === 'Medical Review') {
        return [
          { value: 'Regulatory Submission', label: 'Regulatory Submission (Medical Approved)' },
          { value: 'Quality Control', label: 'Quality Control (Return to QC)' },
          { value: 'Data Entry', label: 'Data Entry (Return for Correction)' }
        ];
      }
      return [];
    }
    if (userRole === 'Submission') {
      if (currentWorkflowState === 'Regulatory Submission' || currentWorkflowState === 'Submission') {
        return [
          { value: 'Closed', label: 'Closed (Submit to Authority & Close)' },
          { value: 'Quality Control', label: 'Quality Control (Return for Revision)' }
        ];
      }
      return [];
    }
    return [];
  };

  const availableStates = getAvailableStates();

  const handleRoute = async (e) => {
    e.preventDefault();
    if (!nextState) {
      setError('Please select a target workflow state.');
      return;
    }
    if (!password) {
      setError('Password is required for routing validation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cases/${caseNumber}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nextState, comment, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Routing failed.');
      }

      onRouteSuccess(data);
      onClose();
      // Clear inputs
      setNextState('');
      setComment('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'An error occurred during routing.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} className="text-primary" />
            <h2 style={{ fontSize: '1.125rem' }}>Workflow Routing: {caseNumber}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleRoute} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', flex: 1, padding: '1rem 1.25rem' }}>
            {error && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Stage</label>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontWeight: '600',
                  color: 'var(--primary)'
                }}>
                  {currentWorkflowState}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Role</label>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}>
                  {userRole}
                </div>
              </div>
            </div>

            {availableStates.length === 0 ? (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: 'var(--color-danger)',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                display: 'flex',
                gap: '0.75rem'
              }}>
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Routing Restricted:</strong> As a <strong>{userRole}</strong> user, you cannot route this case while it is in the <strong>{currentWorkflowState}</strong> stage.
                  <div style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Only users assigned to the active workflow stage (or Administrators) have routing authority.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Target Workflow State *</label>
                  <select
                    value={nextState}
                    onChange={(e) => setNextState(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">-- Select Target Stage --</option>
                    {availableStates.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Routing Comments / Justification</label>
                  <textarea
                    placeholder="Enter justification or workflow comments..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control"
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label>Security Password Verification *</label>
                  <input
                    type="password"
                    placeholder="Verify password to confirm identity..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            {availableStates.length > 0 && (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={16} /> {loading ? 'Routing...' : 'Confirm & Route Case'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
