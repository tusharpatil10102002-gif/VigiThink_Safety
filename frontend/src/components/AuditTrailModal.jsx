import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { X, History } from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose, caseNumber }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && caseNumber) {
      fetchAudits();
    }
  }, [isOpen, caseNumber]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cases/${caseNumber}/audits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (err) {
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} className="text-secondary" />
            <h2>Case Revision History - Audit Logs ({caseNumber})</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading audit trails...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Revision #</th>
                    <th>Date / Time (UTC)</th>
                    <th>Field / Action</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>User</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No revision audits found for this case.
                      </td>
                    </tr>
                  ) : (
                    audits.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary)',
                            borderRadius: '4px',
                            fontWeight: '500',
                            fontSize: '0.75rem'
                          }}>
                            {item.field}
                          </span>
                        </td>
                        <td style={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: varColor(item.oldValue)
                        }}>
                          {item.oldValue || <span style={{ color: 'var(--text-muted)' }}>&lt;empty&gt;</span>}
                        </td>
                        <td style={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: varColor(item.newValue),
                          fontWeight: '500'
                        }}>
                          {item.newValue || <span style={{ color: 'var(--text-muted)' }}>&lt;empty&gt;</span>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{item.userName}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({item.user})</span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {item.reason || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function varColor(val) {
  if (val === 'Locked') return 'var(--color-danger)';
  if (val === 'Unlocked') return 'var(--color-success)';
  return 'inherit';
}
