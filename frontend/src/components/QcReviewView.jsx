import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { CheckSquare, AlertTriangle, CheckCircle2, RotateCcw, Send, FileText, Bot, ShieldCheck, Download } from 'lucide-react';
import { runPVValidationBot, generateFollowUpQueryLetter } from '../utils/pvAutomation';
import { generateCIOMSPDF } from '../utils/generateCIOMS';

export default function QcReviewView({ c, setCase, caseNumber, isEditable, onBack, currentUser }) {
  const [qcSubTab, setQcSubTab] = useState('validation'); // validation, checklist, findings, query_letter
  const [findings, setFindings] = useState([]);
  const [errCategory, setErrCategory] = useState('Missing Information');
  const [errSeverity, setErrSeverity] = useState('Minor');
  const [correctionRequired, setCorrectionRequired] = useState('');
  const [findingComment, setFindingComment] = useState('');
  const [routingPassword, setRoutingPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetAction, setTargetAction] = useState('approve_mr'); // 'approve_mr' | 'return_de' | 'approve_sub'
  const [routingComments, setRoutingComments] = useState('');

  // Run Auto-Validation Bot
  const validationResult = runPVValidationBot(c);

  const handleAddFinding = () => {
    if (!correctionRequired) {
      alert('Please enter correction details.');
      return;
    }
    const newFinding = {
      id: Date.now(),
      category: errCategory,
      severity: errSeverity,
      correction: correctionRequired,
      comments: findingComment
    };
    setFindings([...findings, newFinding]);
    setCorrectionRequired('');
    setFindingComment('');
    alert('QC Finding logged successfully.');
  };

  const handleExecuteRouting = async (e) => {
    e.preventDefault();
    if (!routingPassword) {
      alert('Password verification is required for QC sign-off.');
      return;
    }

    let nextState = 'Medical Review';
    let comment = `QC Review Approved by ${currentUser?.name || currentUser?.username} (Validation Score: ${validationResult.score}%). Ready for Medical Review.`;

    if (targetAction === 'return_de') {
      nextState = 'Data Entry';
      const findingsSummary = findings.map(f => `[${f.severity}] ${f.category}: ${f.correction}`).join('; ');
      comment = `QC Returned to Data Entry for correction. Discrepancies: ${findingsSummary || routingComments || 'Please rectify flagged fields.'}`;
    } else if (targetAction === 'approve_sub') {
      nextState = 'Regulatory Submission';
      comment = `QC Approved directly to Submission by ${currentUser?.name || currentUser?.username}.`;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cases/${caseNumber}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nextState,
          comment,
          password: routingPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Routing failed');
      }

      setShowPasswordModal(false);
      setRoutingPassword('');
      alert(`QC Action Complete: Case successfully routed to ${nextState}.`);
      onBack();
    } catch (err) {
      alert('QC Routing Error: ' + err.message);
    }
  };

  const followUpLetter = generateFollowUpQueryLetter(c);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* QC Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        backgroundColor: 'rgba(5, 150, 105, 0.08)',
        border: '1px solid rgba(5, 150, 105, 0.25)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckSquare size={24} style={{ color: '#059669' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#047857' }}>
              Quality Control (QC) Safety Review & Rule Engine
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Assigned QC Specialist: <strong>{currentUser?.name || currentUser?.username}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Auto-Validation Compliance</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: validationResult.score >= 80 ? '#059669' : '#dc2626' }}>
              {validationResult.score}% {validationResult.score >= 80 ? '✓ PASSED' : '✗ DEFICIENT'}
            </div>
          </div>
        </div>
      </div>

      {/* QC Subtabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
        {[
          { id: 'validation', label: '1. AI Pre-QC Validation Bot' },
          { id: 'findings', label: `2. QC Findings Log (${findings.length})` },
          { id: 'query_letter', label: '3. Follow-up Query Letter' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setQcSubTab(tab.id)}
            className={`tab-btn ${qcSubTab === tab.id ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderBottom: 'none' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= 1. AI PRE-QC VALIDATION BOT ================= */}
      {qcSubTab === 'validation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Critical Blockers */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', backgroundColor: validationResult.critical.length > 0 ? 'rgba(239, 68, 68, 0.04)' : '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: validationResult.critical.length > 0 ? '#dc2626' : '#059669' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: validationResult.critical.length > 0 ? '#dc2626' : '#059669' }}>
                Critical Regulatory Requirements ({validationResult.critical.length})
              </h4>
            </div>

            {validationResult.critical.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> All mandatory ICSR regulatory criteria are met. No fatal blocking errors detected.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validationResult.critical.map((msg, i) => (
                  <div key={i} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warnings & Best Practice Advice */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, marginBottom: '0.75rem', color: '#d97706' }}>
              Data Quality & Completeness Warnings ({validationResult.warnings.length})
            </h4>

            {validationResult.warnings.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> Data quality is pristine. No warnings logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validationResult.warnings.map((msg, i) => (
                  <div key={i} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Passed Checks */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, marginBottom: '0.75rem', color: '#059669' }}>
              Passed Verification Rules ({validationResult.passed.length})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {validationResult.passed.map((msg, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. QC FINDINGS LOG ================= */}
      {qcSubTab === 'findings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, marginBottom: '1rem', color: 'var(--primary)' }}>
              Log QC Discrepancy / Query to Data Entry
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={errCategory} onChange={(e) => setErrCategory(e.target.value)}>
                  <option value="Missing Information">Missing Information</option>
                  <option value="Incorrect Coding">Incorrect MedDRA/WHO Coding</option>
                  <option value="Wrong Seriousness">Wrong Seriousness</option>
                  <option value="Wrong Dates / Chronology">Wrong Dates / Chronology</option>
                  <option value="Narrative Incomplete">Narrative Incomplete</option>
                  <option value="Other">Other Discrepancy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Severity</label>
                <select className="form-control" value={errSeverity} onChange={(e) => setErrSeverity(e.target.value)}>
                  <option value="Critical">Critical (Rejects case)</option>
                  <option value="Major">Major (Requires correction)</option>
                  <option value="Minor">Minor (Warning only)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Correction Required *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Specify exact field and correction needed..."
                  value={correctionRequired}
                  onChange={(e) => setCorrectionRequired(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Reviewer Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional explanation for the Data Entry associate..."
                value={findingComment}
                onChange={(e) => setFindingComment(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleAddFinding}>
              Log QC Finding
            </button>
          </div>

          <div className="table-container" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, marginBottom: '0.75rem', color: 'var(--primary)' }}>
              Logged Findings for this Case ({findings.length})
            </h4>

            {findings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No findings logged yet. If any data entry errors exist, log them above before returning to DE.
              </div>
            ) : (
              <table className="pv-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Correction Required</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map(f => (
                    <tr key={f.id}>
                      <td><strong>{f.category}</strong></td>
                      <td>
                        <span className={`role-badge ${f.severity === 'Critical' ? 'role-mr' : 'role-qc'}`}>
                          {f.severity}
                        </span>
                      </td>
                      <td>{f.correction}</td>
                      <td>{f.comments || '-'}</td>
                      <td>
                        <button className="quick-btn" style={{ color: '#dc2626' }} onClick={() => setFindings(findings.filter(item => item.id !== f.id))}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= 3. FOLLOW-UP QUERY LETTER ================= */}
      {qcSubTab === 'query_letter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                Auto-Generated Physician Follow-Up Request (Argus / ICH E2C)
              </h4>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(followUpLetter);
                  alert('Follow-Up Query letter copied to clipboard!');
                }}
              >
                Copy Letter
              </button>
            </div>

            <textarea
              className="form-control"
              rows="12"
              style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5' }}
              value={followUpLetter}
              readOnly
            />
          </div>
        </div>
      )}

      {/* QC Sign-off & Workflow Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem',
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => generateCIOMSPDF(c)}>
            <Download size={14} /> Download CIOMS
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => {
              setTargetAction('return_de');
              setShowPasswordModal(true);
            }}
          >
            <RotateCcw size={15} /> Return to Data Entry
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ backgroundColor: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}
            onClick={() => {
              if (validationResult.critical.length > 0) {
                const override = window.confirm(`There are ${validationResult.critical.length} critical validation error(s). Regulatory approval may be rejected. Are you sure you wish to proceed?`);
                if (!override) return;
              }
              setTargetAction('approve_mr');
              setShowPasswordModal(true);
            }}
          >
            <CheckCircle2 size={16} /> Approve QC & Route to Medical Review
          </button>
        </div>
      </div>

      {/* Password Modal for 21 CFR Part 11 Electronic Signature */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>21 CFR Part 11 QC Verification</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={handleExecuteRouting} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {targetAction === 'approve_mr'
                  ? 'Confirm that you have completed quality verification on this case and approve it for Medical Review.'
                  : 'Confirm routing this case back to Data Entry with logged findings.'}
              </div>

              <div className="form-group">
                <label>Verify Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter login password..."
                  value={routingPassword}
                  onChange={(e) => setRoutingPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Send size={15} /> Confirm & Sign-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
