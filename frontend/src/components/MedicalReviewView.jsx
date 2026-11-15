import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, FileText, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { generateICHNarrative } from '../utils/pvAutomation';

export default function MedicalReviewView({ c, setCase, caseNumber, isEditable, onBack, currentUser }) {
  const [causality, setCausality] = useState(c.analysis?.caseSummary?.causality || c.events?.[0]?.causality || 'Possible');
  const [listedness, setListedness] = useState(c.analysis?.caseSummary?.listedness || c.events?.[0]?.listedness || 'Unlisted');
  const [physicianComment, setPhysicianComment] = useState(c.analysis?.physicianComment || '');
  const [riskAction, setRiskAction] = useState(c.analysis?.riskAction || 'Routine Pharmacovigilance');
  const [saving, setSaving] = useState(false);
  const [routingPassword, setRoutingPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetAction, setTargetAction] = useState(''); // 'approve' | 'return_qc' | 'return_de'

  const primaryEvent = c.events?.[0] || {};
  const suspectProduct = c.products?.find(p => p.type === 'Suspect') || c.products?.[0] || {};

  const handleSaveAssessment = async (showSuccess = true) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updatedCase = {
        ...c,
        analysis: {
          ...c.analysis,
          physicianComment,
          riskAction,
          caseSummary: {
            ...c.analysis?.caseSummary,
            causality,
            listedness
          }
        }
      };

      if (updatedCase.events && updatedCase.events.length > 0) {
        updatedCase.events[0].causality = causality;
        updatedCase.events[0].listedness = listedness;
      }

      const res = await fetch(`${API_BASE_URL}/cases/${caseNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedCase)
      });

      if (res.ok) {
        const data = await res.json();
        setCase(data);
        if (showSuccess) alert('Medical safety assessment saved successfully.');
      }
    } catch (err) {
      console.error('Error saving medical assessment:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteRouting = async (e) => {
    e.preventDefault();
    if (!routingPassword) {
      alert('Password verification is mandatory for medical sign-off.');
      return;
    }

    let nextState = 'Regulatory Submission';
    let comment = `Medical Review Approved by Dr. ${currentUser?.name || currentUser?.username}. Causality: ${causality}, Listedness: ${listedness}, Risk Action: ${riskAction}`;

    if (targetAction === 'return_qc') {
      nextState = 'Quality Control';
      comment = `Returned from Medical Review to QC. Physician remarks: ${physicianComment || 'Clarification required.'}`;
    } else if (targetAction === 'return_de') {
      nextState = 'Data Entry';
      comment = `Returned from Medical Review to Data Entry. Physician remarks: ${physicianComment || 'Source data correction required.'}`;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Save changes first
      await handleSaveAssessment(false);

      // Route case
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
      alert(`Medical Review Action Complete: Case routed to ${nextState}.`);
      onBack();
    } catch (err) {
      alert('Routing Error: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        border: '1px solid rgba(124, 58, 237, 0.25)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HeartPulse size={24} style={{ color: '#7c3aed' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#6d28d9' }}>
              Physician Medical Safety Assessment (ICH E2A / E2D)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Evaluator: <strong>{currentUser?.name || currentUser?.username}</strong> (Medical Reviewer)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="role-badge" style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
            Current State: {c.workflowState}
          </span>
        </div>
      </div>

      {/* Grid: Event & Product under assessment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Primary Suspect Product</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
            {suspectProduct.tradeName || 'Unknown Product'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Generic: <strong>{suspectProduct.genericName || 'Unspecified'}</strong> | Formulation: {suspectProduct.formulation || 'Tablet'} | Dose: {suspectProduct.concentration || 'Unspecified'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Dechallenge: <strong>{suspectProduct.dechallenge || 'Not recorded'}</strong> | Rechallenge: <strong>{suspectProduct.rechallenge || 'Not recorded'}</strong>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Primary Adverse Event</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
            {primaryEvent.coding?.pt || primaryEvent.descriptionAsReported || 'Uncoded Event'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            SOC: <strong>{primaryEvent.coding?.soc || 'Uncoded SOC'}</strong> | Onset: {primaryEvent.onsetDateTime || 'Unknown'} | Outcome: <strong>{primaryEvent.outcome || 'Unknown'}</strong>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Seriousness: <strong style={{ color: Object.values(primaryEvent.seriousness || {}).some(Boolean) ? '#dc2626' : '#10b981' }}>
              {Object.values(primaryEvent.seriousness || {}).some(Boolean) ? 'SERIOUS' : 'NON-SERIOUS'}
            </strong> | Reporter Causality: <strong>{primaryEvent.reportedCausality || 'Unspecified'}</strong>
          </div>
        </div>
      </div>

      {/* Medical Assessment Form */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
          1. Causality & Expectedness Determination
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>WHO-UMC Causality Classification *</label>
            <select
              className="form-control"
              value={causality}
              onChange={(e) => setCausality(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="Certain">Certain (Plausible time, dechallenge/rechallenge positive, no other explanation)</option>
              <option value="Probable">Probable / Likely (Reasonable time relationship, dechallenge positive)</option>
              <option value="Possible">Possible (Reasonable time sequence, could be disease or drug)</option>
              <option value="Unlikely">Unlikely (Improbable time relationship, disease/other drugs plausible)</option>
              <option value="Conditional">Conditional / Unclassified (Further clinical data required)</option>
              <option value="Unassessable">Unassessable / Unclassifiable (Information contradictory or insufficient)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Listedness / Expectedness (vs. CCDS / SmPC) *</label>
            <select
              className="form-control"
              value={listedness}
              onChange={(e) => setListedness(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="Listed">Listed / Expected (Documented in Company Core Data Sheet / SmPC)</option>
              <option value="Unlisted">Unlisted / Unexpected (Not documented in CCDS / SmPC - SUSAR Trigger)</option>
              <option value="Unlabeled">Unlabeled (No reference safety information available)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Benefit-Risk Action Recommendation</label>
          <select
            className="form-control"
            value={riskAction}
            onChange={(e) => setRiskAction(e.target.value)}
          >
            <option value="Routine Pharmacovigilance">Routine Pharmacovigilance (Continue standard surveillance)</option>
            <option value="Potential Signal - Flag for Signal Review">Potential Safety Signal (Flag for Signal Detection & Aggregate Review)</option>
            <option value="Update Product Labeling / Warnings">Update Product Labeling (Recommend SmPC / Package Insert Revision)</option>
            <option value="Issue Dear Healthcare Provider (DHPC) Letter">Issue Dear HCP (DHPC) Safety Notice</option>
            <option value="Urgent Safety Restriction (USR)">Urgent Safety Restriction (Initiate Health Authority Risk Action)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Company Physician Medical Commentary / Assessment Narrative</label>
          <textarea
            className="form-control"
            rows="4"
            placeholder="Document clinical rationale, plausibility, alternative etiologies, and medical safety conclusion..."
            value={physicianComment}
            onChange={(e) => setPhysicianComment(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => handleSaveAssessment(true)} disabled={saving}>
            Save Medical Assessment
          </button>
        </div>
      </div>

      {/* Sign-off & Workflow Routing Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem',
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border-color)',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Physician Sign-Off & Workflow Progression</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Authorize medical review completion or return case with queries for clarification.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ color: '#d97706', borderColor: '#fcd34d' }}
            onClick={() => {
              setTargetAction('return_qc');
              setShowPasswordModal(true);
            }}
          >
            <RotateCcw size={15} /> Return to QC
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
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
              setTargetAction('approve');
              setShowPasswordModal(true);
            }}
          >
            <CheckCircle2 size={16} /> Approve Medical Review & Route to Submission
          </button>
        </div>
      </div>

      {/* Password Modal for 21 CFR Part 11 Electronic Signature */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>21 CFR Part 11 Electronic Signature</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={handleExecuteRouting} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {targetAction === 'approve'
                  ? 'I hereby confirm that I have conducted a thorough medical review of this safety report and approve it for Regulatory Submission.'
                  : `Please confirm routing this case back to ${targetAction === 'return_qc' ? 'Quality Control' : 'Data Entry'}.`}
              </div>

              <div className="form-group">
                <label>Verify Password to Sign-off *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your login password..."
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
