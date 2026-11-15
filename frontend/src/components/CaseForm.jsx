import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import DictionaryBrowserModal from './DictionaryBrowserModal';
import AuditTrailModal from './AuditTrailModal';
import CaseRoutingModal from './CaseRoutingModal';
import { Save, Lock, Unlock, FileCheck, ArrowLeft, Plus, Trash2, Search, AlertCircle, FileText, Printer, XCircle, Briefcase, FolderOpen, FileCode, HeartPulse, CheckSquare, Send, CheckCircle, RefreshCw, AlertOctagon, Archive, ShieldAlert, Layers, History, User, Clock, Eye, EyeOff } from 'lucide-react';
import { COUNTRIES } from '../utils/countries';
import MedDRABrowser from './MedDRABrowser';
import WHODrugBrowser from './WHODrugBrowser';
import { generateCIOMSPDF } from '../utils/generateCIOMS';
import QcReviewView from './QcReviewView';
import MedicalReviewView from './MedicalReviewView';
import { generateICHNarrative, calculateSUSARStatus, calculateDemographics, suggestMedDRATerm, suggestWHODrug } from '../utils/pvAutomation';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const TrafficLight = ({ activeColor }) => (
  <div style={{
    display: 'inline-flex',
    flexDirection: 'row',
    gap: '3px',
    backgroundColor: '#0f172a',
    padding: '3px 4px',
    borderRadius: '10px',
    alignItems: 'center',
    border: '1px solid #334155',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)'
  }}>
    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: activeColor === 'red' ? '#ef4444' : '#334155', boxShadow: activeColor === 'red' ? '0 0 8px #ef4444' : 'none', transition: 'all 0.2s ease' }} />
    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: activeColor === 'yellow' ? '#f59e0b' : '#334155', boxShadow: activeColor === 'yellow' ? '0 0 8px #f59e0b' : 'none', transition: 'all 0.2s ease' }} />
    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: activeColor === 'green' ? '#10b981' : '#334155', boxShadow: activeColor === 'green' ? '0 0 8px #10b981' : 'none', transition: 'all 0.2s ease' }} />
  </div>
);

export default function CaseForm({ caseNumber, onBack, currentUser }) {
  const [c, setCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [dictModalOpen, setDictModalOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [routingModalOpen, setRoutingModalOpen] = useState(false);
  const [dictType, setDictType] = useState('meddra');
  const [dictTargetIdx, setDictTargetIdx] = useState(null);

  // Modals state
  const [meddraOpen, setMeddraOpen] = useState(false);
  const [meddraTarget, setMeddraTarget] = useState(null); // 'event' or 'history'
  const [meddraTargetIdx, setMeddraTargetIdx] = useState(null);
  
  const [whoOpen, setWhoOpen] = useState(false);
  const [whoTargetIdx, setWhoTargetIdx] = useState(null);

  // Blinding unblinding options (Page 57)
  const [blindingStatus, setBlindingStatus] = useState('Blinded');

  // Upgraded Argus Safety subtab and cycle index states
  const [activeReporterIdx, setActiveReporterIdx] = useState(0);
  const [activeProductIdx, setActiveProductIdx] = useState(0);
  const [patientParentTab, setPatientParentTab] = useState('patient');
  const [eventSubTab, setEventSubTab] = useState('info');
  const [analysisSubTab, setAnalysisSubTab] = useState('case');
  const [activitySubTab, setActivitySubTab] = useState('log');
  const [selectedLetterTemplate, setSelectedLetterTemplate] = useState('pregnancy');
  const [generatedLetterText, setGeneratedLetterText] = useState('');
  const [previewTab, setPreviewTab] = useState('medical_pdf'); // for attachment viewer preview
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // Auto-Save Effect
  useEffect(() => {
    if (!c || loading || c.lockState === 'Locked') return;

    setAutoSaveStatus('Saving...');
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 5000);

    return () => {
      clearTimeout(timer);
      setAutoSaveStatus(''); // Reset if they keep typing
    };
  }, [c]);

  const handleAutoSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const updatedCase = { ...c };
      if (updatedCase.general?.studyInfo) {
        updatedCase.general.studyInfo.blindingStatus = blindingStatus;
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
        setAutoSaveStatus('All changes saved');
      } else {
        setAutoSaveStatus('Auto-save failed');
      }
    } catch (err) {
      setAutoSaveStatus('Auto-save failed');
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [caseNumber]);

  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cases/${caseNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCase(data);
        if (data.general.studyInfo?.blindingStatus) {
          setBlindingStatus(data.general.studyInfo.blindingStatus);
        }
      }
    } catch (err) {
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (showMsg = true) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Update blinding status if altered
      const updatedCase = { ...c };
      if (updatedCase.general?.studyInfo) {
        updatedCase.general.studyInfo.blindingStatus = blindingStatus;
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
        if (showMsg) alert('Case saved successfully. Audit logs updated.');
      }
    } catch (err) {
      console.error('Error saving case:', err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Lock state
  const handleLockToggle = async () => {
    const isLocked = c.lockState === 'Locked';
    const nextState = isLocked ? 'Unlocked' : 'Locked';
    
    if (nextState === 'Locked') {
      const proceed = window.confirm('Locking the case prevents further edits. Do you wish to lock this case?');
      if (!proceed) return;
    }

    const updatedCase = { ...c, lockState: nextState };
    setCase(updatedCase);
    // Trigger save automatically
    setTimeout(() => handleSave(false), 100);
  };

  // Study selection simulation (Page 27)
  const handleStudySelect = () => {
    const selectedStudy = {
      projectId: 'Cure All Study',
      studyId: '3010',
      centerId: 'CT-99',
      studyPhase: 'Phase III',
      studyName: 'Cure All vs. Bpfix',
      studyType: 'Double Blinded'
    };

    const updatedCase = { ...c };
    updatedCase.general.studyInfo = selectedStudy;
    
    // Add product associated with study to Product tab
    const alreadyExists = updatedCase.products.some(p => p.tradeName === 'Cure All ORAL');
    if (!alreadyExists) {
      updatedCase.products.push({
        id: generateId(),
        tradeName: 'Cure All ORAL',
        genericName: 'NITROPRUSSIDE',
        drugCode: '002581',
        formulation: 'Slow Release Tablet',
        concentration: '50 mg',
        manufacturer: 'Safe Labs',
        type: 'Suspect',
        dosageRegimens: []
      });
    }

    setCase(updatedCase);
    alert('Study selected. "Cure All ORAL" has been auto-populated as a Suspect Drug.');
  };

  // Auto-Narrative Generator (ICH E2D Compliant)
  const generateNarrative = () => {
    const { narrative, abbreviated } = generateICHNarrative(c);
    
    setCase({
      ...c,
      analysis: {
        ...c.analysis,
        narrative,
        abbreviatedNarrative: abbreviated,
        medicalNarrative: c.analysis?.medicalNarrative || `Automated ICH review: ${abbreviated}`
      }
    });
    alert("⚡ ICH E2D Clinical Narrative & Abbreviated Narrative successfully generated from case data!");
  };

  // Helper for adding/deleting rows
  const addReporter = () => {
    const updated = { ...c };
    updated.general.reporterInfo.push({ name: '', occupation: 'Pharmacist', primary: false, email: '' });
    setCase(updated);
  };

  const deleteReporter = (idx) => {
    const updated = { ...c };
    updated.general.reporterInfo.splice(idx, 1);
    setCase(updated);
  };

  const addMedicalHistory = () => {
    const updated = { ...c };
    updated.patient.medicalHistory.push({ condition: '', pt: '', soc: '', start: '', stop: '', ongoing: false });
    setCase(updated);
  };

  const deleteMedicalHistory = (idx) => {
    const updated = { ...c };
    updated.patient.medicalHistory.splice(idx, 1);
    setCase(updated);
  };

  const addProduct = () => {
    const updated = { ...c };
    updated.products.push({
      id: generateId(),
      tradeName: '',
      genericName: '',
      drugCode: '',
      formulation: 'Tablet',
      concentration: '',
      manufacturer: '',
      type: 'Concomitant',
      dosageRegimens: []
    });
    setCase(updated);
  };

  const deleteProduct = (idx) => {
    if (c.products.length <= 1) {
      alert('Case must contain at least one product.');
      return;
    }
    const updated = { ...c };
    updated.products.splice(idx, 1);
    setCase(updated);
  };

  const addEvent = () => {
    const updated = { ...c };
    updated.events.push({
      id: generateId(),
      descriptionAsReported: '',
      descriptionToBeCoded: '',
      onsetDateTime: '',
      seriousness: { death: false, hospitalized: false, lifeThreatening: false, disability: false, congenitalAnomaly: false, medicallySignificant: false },
      coding: { soc: '', soc_code: '', hlgt: '', hlgt_code: '', hlt: '', hlt_code: '', pt: '', pt_code: '', llt: '', llt_code: '' },
      causality: 'Possible',
      listedness: 'Unlabeled'
    });
    setCase(updated);
  };

  const deleteEvent = (idx) => {
    if (c.events.length <= 1) {
      alert('Case must contain at least one adverse event.');
      return;
    }
    const updated = { ...c };
    updated.events.splice(idx, 1);
    setCase(updated);
  };

  const handleMeddraSelect = (selectedTerm) => {
    const updated = { ...c };
    if (meddraTarget === 'event') {
      updated.events[meddraTargetIdx].coding = {
        soc: selectedTerm.soc, soc_code: selectedTerm.soc_code,
        hlgt: selectedTerm.hlgt, hlgt_code: selectedTerm.hlgt_code,
        hlt: selectedTerm.hlt, hlt_code: selectedTerm.hlt_code,
        pt: selectedTerm.pt, pt_code: selectedTerm.pt_code,
        llt: selectedTerm.llt, llt_code: selectedTerm.llt_code
      };
      updated.events[meddraTargetIdx].descriptionToBeCoded = selectedTerm.llt;
    } else if (meddraTarget === 'history') {
      updated.patient.medicalHistory[meddraTargetIdx].condition = selectedTerm.llt;
      updated.patient.medicalHistory[meddraTargetIdx].pt = selectedTerm.pt;
      updated.patient.medicalHistory[meddraTargetIdx].soc = selectedTerm.soc;
    }
    setCase(updated);
  };

  const handleWhoSelect = (selectedDrug) => {
    const updated = { ...c };
    updated.products[whoTargetIdx] = {
      ...updated.products[whoTargetIdx],
      tradeName: selectedDrug.trade_name,
      genericName: selectedDrug.generic_name,
      drugCode: selectedDrug.drug_code,
      formulation: selectedDrug.formulation,
      concentration: selectedDrug.concentration,
      manufacturer: selectedDrug.manufacturer
    };
    setCase(updated);
  };

  const handleCausalityChange = (eIdx, val) => {
    const updated = { ...c };
    updated.events[eIdx].causality = val;
    setCase(updated);
  };

  const handleListednessChange = (eIdx, val) => {
    const updated = { ...c };
    updated.events[eIdx].listedness = val;
    setCase(updated);
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading case files...</div>;
  if (!c) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}>Case files could not be loaded.</div>;

  const isBlinded = blindingStatus === 'Blinded';
  const userRole = currentUser?.role || 'Admin';

  const canEditCase = () => {
    if (c.lockState === 'Locked') return false;
    if (userRole === 'Admin') return true;
    if (userRole === 'Intake' && c.workflowState === 'Case Triage') return true;
    if (userRole === 'Data Entry' && (c.workflowState === 'Data Entry' || c.workflowState === 'Case Triage')) return true;
    if (userRole === 'Quality Control' && c.workflowState === 'Quality Control') return true;
    if (userRole === 'Medical Review' && c.workflowState === 'Medical Review') return true;
    if (userRole === 'Submission' && (c.workflowState === 'Regulatory Submission' || c.workflowState === 'Submission')) return true;
    return false;
  };

  const isEditable = canEditCase();

  const getVisibleTabs = () => {
    const list = [
      { id: 'general', label: 'General' },
      { id: 'patient', label: 'Patient' },
      { id: 'products', label: 'Products' },
      { id: 'events', label: 'Events' },
      { id: 'analysis', label: 'Analysis' },
      { id: 'activities', label: 'Activities' },
      { id: 'additional', label: 'Additional Info' },
      { id: 'regulatory', label: 'Regulatory Reports' }
    ];

    if (userRole === 'Quality Control' || userRole === 'Admin') {
      list.push({ id: 'qc', label: 'QC Review' });
    }

    if (userRole === 'Medical Review' || userRole === 'Admin') {
      list.push({ id: 'mr', label: 'Medical Review' });
    }

    return list;
  };

  return (
    <>
    <div className="page-container">
      {/* Modern Executive Case Header & Command Center */}
      <div className="case-details-header" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        alignItems: 'stretch',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        marginBottom: '1rem'
      }}>
        {/* ROW 1: Case Identification & Command Center Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Back button + Case ID + Stage + Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 'fit-content' }}>
            <button
              onClick={onBack}
              title="Back to Cases Worklist"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.transform = 'translateX(-2px)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              }}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  ICSR Case
                </span>
                
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  color: '#0f172a',
                  letterSpacing: '-0.025em',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {c.caseNumber}
                </h2>

                {/* Workflow Stage Pill with glowing LED */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: c.workflowState === 'Quality Control' ? '#ecfdf5' :
                                   c.workflowState === 'Medical Review' ? '#f5f3ff' :
                                   c.workflowState === 'Case Triage' ? '#fffbeb' :
                                   c.workflowState === 'Regulatory Submission' ? '#f0fdfa' : '#eff6ff',
                  border: `1px solid ${
                    c.workflowState === 'Quality Control' ? '#a7f3d0' :
                    c.workflowState === 'Medical Review' ? '#ddd6fe' :
                    c.workflowState === 'Case Triage' ? '#fde68a' :
                    c.workflowState === 'Regulatory Submission' ? '#99f6e4' : '#bfdbfe'
                  }`,
                  color: c.workflowState === 'Quality Control' ? '#065f46' :
                         c.workflowState === 'Medical Review' ? '#5b21b6' :
                         c.workflowState === 'Case Triage' ? '#92400e' :
                         c.workflowState === 'Regulatory Submission' ? '#115e59' : '#1e40af',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: c.workflowState === 'Quality Control' ? '#10b981' :
                                     c.workflowState === 'Medical Review' ? '#8b5cf6' :
                                     c.workflowState === 'Case Triage' ? '#f59e0b' :
                                     c.workflowState === 'Regulatory Submission' ? '#14b8a6' : '#3b82f6',
                    boxShadow: '0 0 6px currentColor'
                  }} />
                  {c.workflowState}
                </div>

                {/* Blinding Status Pill */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: isBlinded ? '#fef2f2' : '#f0fdf4',
                  color: isBlinded ? '#b91c1c' : '#15803d',
                  border: `1px solid ${isBlinded ? '#fecaca' : '#bbf7d0'}`
                }}>
                  {isBlinded ? <EyeOff size={12} /> : <Eye size={12} />}
                  {blindingStatus}
                </span>

                {/* Lock Status Pill */}
                {c.lockState === 'Locked' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                  }}>
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              {/* Sub-meta strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={13} style={{ color: '#94a3b8' }} />
                  Owner: <strong style={{ color: '#334155' }}>@{c.owner}</strong>
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} style={{ color: '#94a3b8' }} />
                  Updated: <span style={{ color: '#475569' }}>{new Date(c.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </span>
                {autoSaveStatus && (
                  <>
                    <span>•</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      color: autoSaveStatus === 'Saving...' ? '#d97706' :
                             autoSaveStatus === 'All changes saved' ? '#059669' : '#dc2626'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: autoSaveStatus === 'Saving...' ? '#f59e0b' :
                                         autoSaveStatus === 'All changes saved' ? '#10b981' : '#ef4444'
                      }} />
                      {autoSaveStatus}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Modern Command Center Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* QC Review Action Pill */}
            {(userRole === 'Quality Control' || userRole === 'Admin') && (
              <button
                type="button"
                onClick={() => setActiveTab('qc')}
                title="Open QC Checklist & Verification Findings"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(5, 150, 105, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(5, 150, 105, 0.25)'; }}
              >
                <CheckSquare size={15} /> QC Review
              </button>
            )}

            {/* Medical Review Action Pill */}
            {(userRole === 'Medical Review' || userRole === 'Admin') && (
              <button
                type="button"
                onClick={() => setActiveTab('mr')}
                title="Open Medical Review Assessment"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(124, 58, 237, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(124, 58, 237, 0.25)'; }}
              >
                <HeartPulse size={15} /> Medical Review
              </button>
            )}

            {/* Send to QC (Data Entry Role) */}
            {userRole === 'Data Entry' && (c.workflowState === 'Data Entry' || c.workflowState === 'Case Triage') && (
              <button
                type="button"
                onClick={() => setRoutingModalOpen(true)}
                title="Complete Data Entry and Send Case to Quality Control"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 99, 235, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.25)'; }}
              >
                <Send size={15} /> Send to QC
              </button>
            )}

            {/* Route Case */}
            <button
              type="button"
              onClick={() => setRoutingModalOpen(true)}
              title="Route case to next workflow state"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <Send size={14} style={{ color: '#64748b' }} /> Route
            </button>

            {/* Lock / Unlock */}
            <button
              type="button"
              onClick={handleLockToggle}
              title={c.lockState === 'Locked' ? 'Unlock Case' : 'Lock Case against changes'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              {c.lockState === 'Locked' ? (
                <>
                  <Unlock size={14} style={{ color: '#16a34a' }} /> Unlock
                </>
              ) : (
                <>
                  <Lock size={14} style={{ color: '#dc2626' }} /> Lock
                </>
              )}
            </button>

            {/* Audit Trail */}
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              title="View Complete 21 CFR Part 11 Audit Trail"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <History size={14} style={{ color: '#64748b' }} /> Audit
            </button>

            {/* Save Case (Primary CTA) */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !isEditable}
              title="Save case changes to database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                background: !isEditable ? '#94a3b8' : 'linear-gradient(135deg, #1e3f5d 0%, #2b5b84 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: !isEditable ? 'not-allowed' : 'pointer',
                boxShadow: !isEditable ? 'none' : '0 2px 6px rgba(43, 91, 132, 0.3)',
                transition: 'all 0.2s ease',
                opacity: saving ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (isEditable && !saving) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(43, 91, 132, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (isEditable && !saving) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(43, 91, 132, 0.3)';
                }
              }}
            >
              <Save size={15} /> {saving ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </div>

        {/* ROW 2: Unified Regulatory SLA & Clock Hub + Quick Tools */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#f8fafc',
          padding: '0.625rem 1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Left: SLA Monitors + SUSAR Regulatory Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Step SLA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 600 }}>
              <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>Step SLA</span>
              <TrafficLight activeColor={c.workflowState === 'Medical Review' ? 'red' : 'yellow'} />
              <span style={{
                color: c.workflowState === 'Medical Review' ? '#dc2626' : '#d97706',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                {c.workflowState === 'Medical Review' ? '- 00d 03h 15m' : '- 02d 07h 18m'}
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1' }} />

            {/* Overall SLA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 600 }}>
              <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>Overall SLA</span>
              <TrafficLight activeColor="green" />
              <span style={{
                color: '#059669',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                - 07d 03h 04m
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1' }} />

            {/* SUSAR / Expedited Regulatory Clock Decision Badge */}
            {(() => {
              const susar = calculateSUSARStatus(c);
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: susar.isSUSAR ? (susar.clockDays === 7 ? '#fef2f2' : '#fffbeb') : '#f0fdf4',
                    border: `1px solid ${susar.isSUSAR ? susar.badgeColor : '#bbf7d0'}`,
                    color: susar.isSUSAR ? susar.badgeColor : '#166534',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}
                  title={susar.reason}
                >
                  <AlertOctagon size={14} style={{ flexShrink: 0 }} />
                  <span>{susar.pathway}</span>
                  {susar.clockDays && (
                    <span style={{
                      backgroundColor: susar.badgeColor,
                      color: '#ffffff',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      letterSpacing: '0.02em'
                    }}>
                      {susar.clockDays}D Clock
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right: Modern Quick-Launch Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
              Quick Tools:
            </span>

            <button
              type="button"
              onClick={() => generateCIOMSPDF(c)}
              title="Generate & Download CIOMS-I Form (PDF)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.color = '#0d9488'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
            >
              <Printer size={13} /> CIOMS I (PDF)
            </button>

            <button
              type="button"
              onClick={() => setMeddraOpen(true)}
              title="Open MedDRA Dictionary Coding Browser"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
            >
              <Search size={13} /> MedDRA
            </button>

            <button
              type="button"
              onClick={() => setWhoOpen(true)}
              title="Open WHO Drug Dictionary Browser"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
            >
              <FolderOpen size={13} /> WHO Drug
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('regulatory')}
              title="Perform E2B (R3) XML Compliance Validation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.color = '#0284c7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
            >
              <FileCode size={13} /> E2B Check
            </button>
          </div>
        </div>

        {/* Read-Only Status Banner */}
        {!isEditable && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.625rem 1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            color: '#1e40af',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
              <span>
                <strong>Read-Only Mode:</strong> This case is in <strong>{c.workflowState}</strong>.
                {c.lockState === 'Locked'
                  ? ' Case is locked against editing.'
                  : userRole === 'Data Entry'
                    ? ' Quality Control / Medical Review is in progress. Data Entry users can view details in read-only mode.'
                    : ` Only users assigned to '${c.workflowState}' can edit this case.`}
              </span>
            </div>
            <span className={`role-badge role-${(c.workflowState || '').toLowerCase().replace(' ', '')}`}>
              Current Stage: {c.workflowState}
            </span>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="tabs-container" style={{ flex: 1 }}>
        <div className="tab-nav-bar">
          {getVisibleTabs().map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-panel">
          {/* ======================= 1. GENERAL TAB ======================= */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Case Information */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Case Information</h4>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label>Case Number (Auto Generated)</label>
                    <input type="text" className="form-control" value={c.caseNumber} disabled />
                  </div>
                  <div className="form-group">
                    <label>Version</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.version || '1'}
                      onChange={(e) => setCase({ ...c, version: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Report Type</label>
                    <select
                      className="form-control"
                      value={c.general.reportType}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, reportType: e.target.value } })}
                      disabled={!isEditable}
                    >
                      <option value="Spontaneous">Spontaneous</option>
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="Literature">Literature</option>
                      <option value="Other">Other Solicited</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Country of Occurrence</label>
                    <select
                      className="form-control"
                      value={c.general.country}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, country: e.target.value } })}
                      disabled={!isEditable}
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Initial Receipt Date</label>
                    <input type="date" className="form-control" value={c.general.initialReceiptDate} disabled />
                  </div>
                  <div className="form-group">
                    <label>Latest Receipt Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={c.general.safetyReceiptDate || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, safetyReceiptDate: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Follow-up Number</label>
                    <input
                      type="number"
                      className="form-control"
                      value={c.general.followUpNumber || '0'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, followUpNumber: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Latest Follow-up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={c.general.followUpDate || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, followUpDate: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Case Classification</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Solicited / Spontaneous"
                      value={c.general.caseClassification || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, caseClassification: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Serious / Non Serious</label>
                    <select
                      className="form-control"
                      value={c.analysis.caseSummary.seriousness}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, caseSummary: { ...c.analysis.caseSummary, seriousness: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Yes">Serious</option>
                      <option value="No">Non-Serious</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Medically Confirmed</label>
                    <select
                      className="form-control"
                      value={c.general.medicallyConfirmed || 'Yes'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, medicallyConfirmed: e.target.value } })}
                      disabled={!isEditable}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Source Type</label>
                    <select
                      className="form-control"
                      value={c.general.sourceType || 'Spontaneous'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, sourceType: e.target.value } })}
                      disabled={!isEditable}
                    >
                      <option value="Spontaneous">Spontaneous</option>
                      <option value="Literature">Literature</option>
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="Regulatory Agency">Regulatory Agency</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-3" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      className="form-control"
                      value={c.priority || 'Medium'}
                      onChange={(e) => setCase({ ...c, priority: e.target.value })}
                      disabled={!isEditable}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Workflow Status</label>
                    <input type="text" className="form-control" value={c.workflowState} disabled />
                  </div>
                </div>
              </div>

              {/* Study / Clinical Trial Information */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--primary)', margin: 0 }}>Clinical Trial & Study Details</h4>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={handleStudySelect} disabled={!isEditable}>
                    <Search size={12} /> Select Protocol
                  </button>
                </div>
                
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label>Project ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.projectId || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), projectId: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Study ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.studyId || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), studyId: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Center ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.centerId || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), centerId: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Study Phase</label>
                    <select
                      className="form-control"
                      value={c.general.studyInfo?.studyPhase || 'Phase II'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), studyPhase: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Phase I">Phase I</option>
                      <option value="Phase II">Phase II</option>
                      <option value="Phase III">Phase III</option>
                      <option value="Phase IV">Phase IV</option>
                      <option value="Bioequivalence">Bioequivalence</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Study Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.studyName || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), studyName: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Other ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.otherId || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), otherId: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Study Type</label>
                    <select
                      className="form-control"
                      value={c.general.studyInfo?.studyType || 'Double Blinded'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), studyType: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Double Blinded">Double Blinded</option>
                      <option value="Single Blinded">Single Blinded</option>
                      <option value="Open Label">Open Label</option>
                      <option value="Observational">Observational</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blinding Status</label>
                    <select
                      className="form-control"
                      value={c.general.studyInfo?.blindingStatus || 'Blinded'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), blindingStatus: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Blinded">Blinded</option>
                      <option value="Unblinded">Unblinded</option>
                      <option value="Active Control">Active Control</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Unblinding Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={c.general.studyInfo?.unblindingDate || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), unblindingDate: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Week #</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.weekNum || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), weekNum: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Visit #</label>
                    <input
                      type="text"
                      className="form-control"
                      value={c.general.studyInfo?.visitNum || ''}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), visitNum: e.target.value } } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Observe Study Type</label>
                    <select
                      className="form-control"
                      value={c.general.studyInfo?.observeStudyType || 'Clinical Trial'}
                      onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), observeStudyType: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="Compassionate Use">Compassionate Use</option>
                      <option value="Expanded Access">Expanded Access</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label>Study Description</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Provide details of clinical trial protocols..."
                    value={c.general.studyInfo?.studyDescription || ''}
                    onChange={(e) => setCase({ ...c, general: { ...c.general, studyInfo: { ...(c.general.studyInfo || {}), studyDescription: e.target.value } } })}
                    disabled={!isEditable}
                  />
                </div>
              </div>

              {/* Literature Information */}
              {c.general.reportType === 'Literature' && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Literature Reference</h4>
                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label>Author(s)</label>
                      <input
                        type="text"
                        placeholder="e.g. Smith J, et al."
                        className="form-control"
                        value={c.general.literatureInfo?.author || ''}
                        onChange={(e) => setCase({ ...c, general: { ...c.general, literatureInfo: { ...(c.general.literatureInfo || {}), author: e.target.value } } })}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="form-group">
                      <label>Journal Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Lancet Drug Safety"
                        className="form-control"
                        value={c.general.literatureInfo?.journal || ''}
                        onChange={(e) => setCase({ ...c, general: { ...c.general, literatureInfo: { ...(c.general.literatureInfo || {}), journal: e.target.value } } })}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="form-group">
                      <label>Article Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Hepatic impairment secondary to drug therapy"
                        className="form-control"
                        value={c.general.literatureInfo?.title || ''}
                        onChange={(e) => setCase({ ...c, general: { ...c.general, literatureInfo: { ...(c.general.literatureInfo || {}), title: e.target.value } } })}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reporter Information */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Reporter Information</h4>
                
                {/* Primary Reporter Bindings */}
                {(() => {
                  const rep = c.general.reporterInfo[0] || { name: '', occupation: 'Physician', email: '', phone: '', primary: true };
                  
                  const updateRep = (field, val) => {
                    const updated = { ...c };
                    if (!updated.general.reporterInfo[0]) {
                      updated.general.reporterInfo[0] = { name: '', occupation: 'Physician', email: '', phone: '', primary: true };
                    }
                    updated.general.reporterInfo[0][field] = val;
                    // Sync full name
                    const f = updated.general.reporterInfo[0].firstName || '';
                    const l = updated.general.reporterInfo[0].lastName || '';
                    updated.general.reporterInfo[0].name = `${f} ${l}`.trim() || 'Reporter';
                    setCase(updated);
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Reporter First Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.firstName || ''}
                            onChange={(e) => updateRep('firstName', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Reporter Last Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.lastName || ''}
                            onChange={(e) => updateRep('lastName', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Reporter Type</label>
                          <select
                            className="form-control"
                            value={rep.reporterType || 'Primary'}
                            onChange={(e) => updateRep('reporterType', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Primary">Primary Reporter</option>
                            <option value="Secondary">Secondary Reporter</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Reporter Qualification</label>
                          <select
                            className="form-control"
                            value={rep.occupation || 'Physician'}
                            onChange={(e) => {
                              updateRep('occupation', e.target.value);
                              updateRep('hcp', (e.target.value === 'Physician' || e.target.value === 'Pharmacist' || e.target.value === 'Other HCP') ? 'Yes' : 'No');
                            }}
                            disabled={!isEditable}
                          >
                            <option value="Physician">Physician</option>
                            <option value="Pharmacist">Pharmacist</option>
                            <option value="Other HCP">Other Healthcare Professional</option>
                            <option value="Consumer">Consumer / Non-HCP</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Healthcare Professional?</label>
                          <select
                            className="form-control"
                            value={rep.hcp || 'Yes'}
                            onChange={(e) => updateRep('hcp', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Hospital Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.hospital || ''}
                            onChange={(e) => updateRep('hospital', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Department</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.department || ''}
                            onChange={(e) => updateRep('department', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input
                            type="email"
                            className="form-control"
                            value={rep.email || ''}
                            onChange={(e) => updateRep('email', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                      </div>

                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.phone || ''}
                            onChange={(e) => updateRep('phone', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Fax</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.fax || ''}
                            onChange={(e) => updateRep('fax', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Postal Code</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.postalCode || ''}
                            onChange={(e) => updateRep('postalCode', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>City</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.city || ''}
                            onChange={(e) => updateRep('city', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                      </div>

                      <div className="grid-cols-3">
                        <div className="form-group">
                          <label>State</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.state || ''}
                            onChange={(e) => updateRep('state', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Country</label>
                          <select
                            className="form-control"
                            value={rep.country || ''}
                            onChange={(e) => updateRep('country', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="">Select Country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            className="form-control"
                            value={rep.address || ''}
                            onChange={(e) => updateRep('address', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Reporter Comments</label>
                        <textarea
                          rows="2"
                          className="form-control"
                          placeholder="Reporter notes or caveats..."
                          value={rep.comments || ''}
                          onChange={(e) => updateRep('comments', e.target.value)}
                          disabled={!isEditable}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* ======================= 2. PATIENT TAB ======================= */}
          {activeTab === 'patient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Patient / Parent Sub-tabs Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    border: 'none',
                    borderBottom: patientParentTab === 'patient' ? '3px solid var(--primary)' : 'none',
                    backgroundColor: 'transparent',
                    color: patientParentTab === 'patient' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: patientParentTab === 'patient' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPatientParentTab('patient')}
                >
                  Patient Details & History
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    border: 'none',
                    borderBottom: patientParentTab === 'parent' ? '3px solid var(--primary)' : 'none',
                    backgroundColor: 'transparent',
                    color: patientParentTab === 'parent' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: patientParentTab === 'parent' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPatientParentTab('parent')}
                >
                  Parent Details (Pediatric / Pregnancy Cases)
                </button>
              </div>

              {patientParentTab === 'patient' ? (
                <>
                  {/* Patient Demographics */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Patient Demographics</h4>
                    <div className="grid-cols-4">
                      <div className="form-group">
                        <label>Patient ID</label>
                        <input
                          type="text"
                          className="form-control"
                          value={c.patient.patientId || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, patientId: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Initials</label>
                        <input
                          type="text"
                          className="form-control"
                          value={c.patient.initials || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, initials: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={c.patient.firstName || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, firstName: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={c.patient.lastName || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, lastName: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>
                          Date of Birth
                          <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.5rem' }}>⚡ Auto-Calculates Demographics</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={c.patient.dob || ''}
                          onChange={(e) => {
                            const dobVal = e.target.value;
                            const demo = calculateDemographics(dobVal);
                            if (demo) {
                              let matchedGroup = 'Adult';
                              if (demo.age < 1 && demo.ageUnit === 'Days') matchedGroup = 'Neonate';
                              else if (demo.age < 2 && demo.ageUnit === 'Months') matchedGroup = 'Infant';
                              else if (demo.age < 12) matchedGroup = 'Child';
                              else if (demo.age < 18) matchedGroup = 'Adolescent';
                              else if (demo.age >= 65) matchedGroup = 'Elderly';
                              else matchedGroup = 'Adult';

                              setCase({
                                ...c,
                                patient: {
                                  ...c.patient,
                                  dob: dobVal,
                                  age: demo.age.toString(),
                                  ageUnit: demo.ageUnit,
                                  ageGroup: matchedGroup
                                }
                              });
                            } else {
                              setCase({ ...c, patient: { ...c.patient, dob: dobVal } });
                            }
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Age</label>
                        <input
                          type="number"
                          className="form-control"
                          value={c.patient.age || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, age: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Age Unit</label>
                        <select
                          className="form-control"
                          value={c.patient.ageUnit || 'Years'}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, ageUnit: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="Years">Years</option>
                          <option value="Months">Months</option>
                          <option value="Weeks">Weeks</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Age Group</label>
                        <select
                          className="form-control"
                          value={c.patient.ageGroup || 'Adult'}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, ageGroup: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="Neonate">Neonate (0-28 days)</option>
                          <option value="Infant">Infant (29 days - 2 years)</option>
                          <option value="Child">Child (2 - 11 years)</option>
                          <option value="Adolescent">Adolescent (12 - 17 years)</option>
                          <option value="Adult">Adult (18 - 64 years)</option>
                          <option value="Elderly">Elderly (&ge; 65 years)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          className="form-control"
                          value={c.patient.gender}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, gender: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={c.patient.weight || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, weight: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Height (cm)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={c.patient.height || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, height: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>BMI (kg/m²)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={(() => {
                            const w = parseFloat(c.patient.weight);
                            const h = parseFloat(c.patient.height);
                            if (w > 0 && h > 0) return (w / ((h / 100) * (h / 100))).toFixed(1);
                            return '';
                          })()}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid-cols-3" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>Ethnicity</label>
                        <select
                          className="form-control"
                          value={c.patient.ethnicity || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, ethnicity: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="">Select Ethnicity</option>
                          <option value="Hispanic or Latino">Hispanic or Latino</option>
                          <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
                          <option value="Unknown / Not Reported">Unknown / Not Reported</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Race</label>
                        <select
                          className="form-control"
                          value={c.patient.race || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, race: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="">Select Race</option>
                          <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                          <option value="Asian">Asian</option>
                          <option value="Black or African American">Black or African American</option>
                          <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
                          <option value="White">White</option>
                          <option value="Other">Other</option>
                          <option value="Unknown / Not Reported">Unknown / Not Reported</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Occupation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={c.patient.occupation || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, occupation: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pregnancy & Lactation Information */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Pregnancy & Lactation Information</h4>
                    <div className="grid-cols-4">
                      <div className="form-group">
                        <label>Pregnant?</label>
                        <select
                          className="form-control"
                          value={c.patient.pregnancy || 'No'}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, pregnancy: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Breast feeding?</label>
                        <select
                          className="form-control"
                          value={c.patient.breastfeeding || 'No'}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, breastfeeding: e.target.value } })}
                          disabled={!isEditable}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date of LMP (Last Menstrual Period)</label>
                        <input
                          type="date"
                          className="form-control"
                          value={c.patient.pregnancyDetails?.lmp || ''}
                          onChange={(e) => {
                            const updated = { ...c };
                            if (!updated.patient.pregnancyDetails) updated.patient.pregnancyDetails = {};
                            updated.patient.pregnancyDetails.lmp = e.target.value;
                            setCase(updated);
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>EDD (Expected Delivery Date)</label>
                        <input
                          type="date"
                          className="form-control"
                          value={c.patient.pregnancyDetails?.edd || ''}
                          onChange={(e) => {
                            const updated = { ...c };
                            if (!updated.patient.pregnancyDetails) updated.patient.pregnancyDetails = {};
                            updated.patient.pregnancyDetails.edd = e.target.value;
                            setCase(updated);
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>Weeks of Gestation</label>
                        <input
                          type="number"
                          className="form-control"
                          value={c.patient.pregnancyDetails?.weeksOfGestation || ''}
                          onChange={(e) => {
                            const updated = { ...c };
                            if (!updated.patient.pregnancyDetails) updated.patient.pregnancyDetails = {};
                            updated.patient.pregnancyDetails.weeksOfGestation = e.target.value;
                            setCase(updated);
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Trimester</label>
                        <select
                          className="form-control"
                          value={c.patient.pregnancyDetails?.trimester || 'First'}
                          onChange={(e) => {
                            const updated = { ...c };
                            if (!updated.patient.pregnancyDetails) updated.patient.pregnancyDetails = {};
                            updated.patient.pregnancyDetails.trimester = e.target.value;
                            setCase(updated);
                          }}
                          disabled={!isEditable}
                        >
                          <option value="First">First Trimester</option>
                          <option value="Second">Second Trimester</option>
                          <option value="Third">Third Trimester</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Number of Fetuses</label>
                        <input
                          type="number"
                          className="form-control"
                          value={c.patient.pregnancyDetails?.fetuses || '1'}
                          onChange={(e) => {
                            const updated = { ...c };
                            if (!updated.patient.pregnancyDetails) updated.patient.pregnancyDetails = {};
                            updated.patient.pregnancyDetails.fetuses = e.target.value;
                            setCase(updated);
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Delivery Outcome</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Normal Livebirth"
                          value={c.patient.pregnancyDetails?.deliveryOutcome || ''}
                          onChange={(e) => {
                            const updated = { ...c };
                            if (!updated.patient.pregnancyDetails) updated.patient.pregnancyDetails = {};
                            updated.patient.pregnancyDetails.deliveryOutcome = e.target.value;
                            setCase(updated);
                          }}
                          disabled={!isEditable}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Patient Medical & Surgical History */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Patient History & Habits</h4>
                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label>Surgical History</label>
                        <textarea
                          rows="2"
                          className="form-control"
                          value={c.patient.surgicalHistory || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, surgicalHistory: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="form-group">
                        <label>Family History</label>
                        <textarea
                          rows="2"
                          className="form-control"
                          value={c.patient.familyHistory || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, familyHistory: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>Allergies</label>
                        <textarea
                          rows="2"
                          className="form-control"
                          placeholder="Food, environment or drug allergies..."
                          value={c.patient.allergies || ''}
                          onChange={(e) => setCase({ ...c, patient: { ...c.patient, allergies: e.target.value } })}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="grid-cols-3" style={{ margin: 0 }}>
                        <div className="form-group">
                          <label>Smoking Habit</label>
                          <select
                            className="form-control"
                            value={c.patient.smoking || 'No'}
                            onChange={(e) => setCase({ ...c, patient: { ...c.patient, smoking: e.target.value } })}
                            disabled={!isEditable}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                            <option value="Ex-Smoker">Ex-Smoker</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Alcohol Intake</label>
                          <select
                            className="form-control"
                            value={c.patient.alcohol || 'No'}
                            onChange={(e) => setCase({ ...c, patient: { ...c.patient, alcohol: e.target.value } })}
                            disabled={!isEditable}
                          >
                            <option value="No">No</option>
                            <option value="Yes (Moderate)">Yes (Moderate)</option>
                            <option value="Yes (Heavy)">Yes (Heavy)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Drug Abuse History</label>
                          <select
                            className="form-control"
                            value={c.patient.drugAbuse || 'No'}
                            onChange={(e) => setCase({ ...c, patient: { ...c.patient, drugAbuse: e.target.value } })}
                            disabled={!isEditable}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Medical History Conditions list */}
                    <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h5 style={{ fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>Coded Medical History</h5>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={addMedicalHistory} disabled={!isEditable}>
                          <Plus size={10} /> Add Medical Condition
                        </button>
                      </div>
                      {c.patient.medicalHistory.map((hist, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 0.5fr', gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input type="text" className="form-control" value={hist.condition} readOnly placeholder="Encode term..." />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setMeddraTarget('history');
                                  setMeddraTargetIdx(idx);
                                  setMeddraOpen(true);
                                }}
                                disabled={!isEditable}
                              >
                                Encode
                              </button>
                            </div>
                          </div>
                          <input type="text" className="form-control" value={hist.pt} disabled placeholder="Coded PT" />
                          <input type="text" className="form-control" value={hist.soc} disabled placeholder="SOC" />
                          <input
                            type="date"
                            className="form-control"
                            value={hist.start}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.medicalHistory[idx].start = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                          <input
                            type="date"
                            className="form-control"
                            value={hist.stop}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.medicalHistory[idx].stop = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                          <button type="button" className="quick-btn" style={{ color: 'var(--color-danger)' }} onClick={() => deleteMedicalHistory(idx)} disabled={!isEditable}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Parent Sub-Tab Demographics */
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Parent Demographics</h4>
                  
                  {(() => {
                    const parent = c.patient.parent || { parentId: '', initials: '', dob: '', age: '', ageUnit: 'Years', gender: 'Female' };
                    
                    const updateParent = (field, val) => {
                      const updated = { ...c };
                      if (!updated.patient.parent) {
                        updated.patient.parent = { parentId: '', initials: '', dob: '', age: '', ageUnit: 'Years', gender: 'Female' };
                      }
                      updated.patient.parent[field] = val;
                      setCase(updated);
                    };

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="grid-cols-4">
                          <div className="form-group">
                            <label>Parent ID</label>
                            <input
                              type="text"
                              className="form-control"
                              value={parent.parentId || ''}
                              onChange={(e) => updateParent('parentId', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="form-group">
                            <label>Parent Initials</label>
                            <input
                              type="text"
                              className="form-control"
                              value={parent.initials || ''}
                              onChange={(e) => updateParent('initials', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                              type="date"
                              className="form-control"
                              value={parent.dob || ''}
                              onChange={(e) => updateParent('dob', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="form-group">
                            <label>Gender</label>
                            <select
                              className="form-control"
                              value={parent.gender || 'Female'}
                              onChange={(e) => updateParent('gender', e.target.value)}
                              disabled={!isEditable}
                            >
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Unknown">Unknown</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                          <div className="form-group">
                            <label>Age</label>
                            <input
                              type="number"
                              className="form-control"
                              value={parent.age || ''}
                              onChange={(e) => updateParent('age', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="form-group">
                            <label>Age Unit</label>
                            <select
                              className="form-control"
                              value={parent.ageUnit || 'Years'}
                              onChange={(e) => updateParent('ageUnit', e.target.value)}
                              disabled={!isEditable}
                            >
                              <option value="Years">Years</option>
                              <option value="Months">Months</option>
                              <option value="Weeks">Weeks</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Weight (kg)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={parent.weight || ''}
                              onChange={(e) => updateParent('weight', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="form-group">
                            <label>Height (cm)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={parent.height || ''}
                              onChange={(e) => updateParent('height', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>

                        <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                          <div className="form-group">
                            <label>LMP (Last Menstrual Period)</label>
                            <input
                              type="date"
                              className="form-control"
                              value={parent.lmp || ''}
                              onChange={(e) => updateParent('lmp', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div className="form-group">
                            <label>Parent Medical & Surgical History</label>
                            <textarea
                              rows="2"
                              className="form-control"
                              placeholder="Describe any parent medical history, exposure, or relevant details..."
                              value={parent.medicalHistory || ''}
                              onChange={(e) => updateParent('medicalHistory', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Lab Test Results */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--primary)', margin: 0 }}>Laboratory Data & Diagnostic Tests</h4>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      const updated = { ...c };
                      if (!updated.patient.labData) updated.patient.labData = [];
                      updated.patient.labData.push({ testName: '', result: '', unit: '', normRange: '', date: '', notes: '' });
                      setCase(updated);
                    }}
                    disabled={!isEditable}
                  >
                    <Plus size={12} /> Add Lab Record
                  </button>
                </div>

                {!c.patient.labData || c.patient.labData.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem' }}>No lab records logged.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {c.patient.labData.map((lab, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr 2fr 0.5fr', gap: '0.5rem', alignItems: 'end', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Test Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Creatinine Clearance"
                            className="form-control"
                            value={lab.testName}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.labData[idx].testName = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Result</label>
                          <input
                            type="text"
                            placeholder="75"
                            className="form-control"
                            value={lab.result}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.labData[idx].result = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Unit</label>
                          <input
                            type="text"
                            placeholder="mL/min"
                            className="form-control"
                            value={lab.unit}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.labData[idx].unit = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Reference Range</label>
                          <input
                            type="text"
                            placeholder="88-128 mL/min"
                            className="form-control"
                            value={lab.normRange}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.labData[idx].normRange = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Collection Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={lab.date}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.labData[idx].date = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Clinical Notes</label>
                          <input
                            type="text"
                            placeholder="Notes..."
                            className="form-control"
                            value={lab.notes || ''}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.patient.labData[idx].notes = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <button className="quick-btn" style={{ color: 'var(--color-danger)' }} onClick={() => {
                          const updated = { ...c };
                          updated.patient.labData.splice(idx, 1);
                          setCase(updated);
                        }} disabled={!isEditable}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================= 3. PRODUCTS TAB ======================= */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Header controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>Products Involved</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    disabled={!isEditable}
                    onClick={() => {
                      const updated = { ...c };
                      updated.products.push({
                        id: generateId(),
                        tradeName: 'New Product',
                        genericName: '',
                        type: 'Suspect',
                        drugType: 'Chemical',
                        dose: '',
                        doseUnit: 'mg',
                        frequency: 'QD',
                        route: 'Oral'
                      });
                      setCase(updated);
                      setActiveProductIdx(updated.products.length - 1);
                    }}
                  >
                    + Add Product
                  </button>
                  {c.products.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                      disabled={!isEditable}
                      onClick={() => {
                        const updated = { ...c };
                        updated.products.splice(activeProductIdx, 1);
                        setCase(updated);
                        setActiveProductIdx(0);
                      }}
                    >
                      ✕ Remove Product
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tabs for cycling products */}
              <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.25rem', borderBottom: '1px solid #f1f5f9' }}>
                {c.products.map((prod, i) => (
                  <button
                    key={i}
                    type="button"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: activeProductIdx === i ? 'var(--primary)' : 'transparent',
                      color: activeProductIdx === i ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: activeProductIdx === i ? 700 : 500
                    }}
                    onClick={() => setActiveProductIdx(i)}
                  >
                    Product {i + 1} ({prod.type || 'Suspect'})
                  </button>
                ))}
              </div>

              {/* Product Card Form */}
              {(() => {
                const prod = c.products[activeProductIdx] || c.products[0] || { tradeName: '', type: 'Suspect' };
                
                const updateProd = (field, val) => {
                  const updated = { ...c };
                  if (!updated.products[activeProductIdx]) {
                    updated.products[activeProductIdx] = { tradeName: '', type: 'Suspect' };
                  }
                  updated.products[activeProductIdx][field] = val;
                  setCase(updated);
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                    
                    {/* section 1: Coding & Identification */}
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '0.9rem' }}>Product Coding & Identification</h4>
                      
                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Product Name (WHO Search)</label>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <input
                              type="text"
                              className="form-control"
                              value={isBlinded ? '✦✦✦✦✦ (BLINDED)' : prod.tradeName}
                              onChange={(e) => updateProd('tradeName', e.target.value)}
                              placeholder="Search or enter Product name..."
                              disabled={isBlinded || !isEditable}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                setWhoTargetIdx(activeProductIdx);
                                setWhoOpen(true);
                              }}
                              disabled={isBlinded || !isEditable}
                            >
                              Encode
                            </button>
                          </div>
                          {/* Smart WHO Drug Auto-Coding Chip */}
                          {(() => {
                            const suggestion = suggestWHODrug(prod.tradeName || prod.genericName);
                            if (suggestion && (!prod.drugCode || prod.drugCode !== suggestion.drug_code)) {
                              return (
                                <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>⚡ AI WHO Drug:</span>
                                  <button
                                    type="button"
                                    className="btn"
                                    style={{
                                      padding: '0.2rem 0.5rem',
                                      fontSize: '0.72rem',
                                      backgroundColor: '#d1fae5',
                                      color: '#065f46',
                                      border: '1px solid #a7f3d0',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                    onClick={() => {
                                      const updated = { ...c };
                                      updated.products[activeProductIdx] = {
                                        ...updated.products[activeProductIdx],
                                        tradeName: prod.tradeName || suggestion.generic_name,
                                        genericName: suggestion.generic_name,
                                        drugCode: suggestion.drug_code,
                                        atcCode: suggestion.atc_code,
                                        formulation: suggestion.formulation,
                                        concentration: suggestion.concentration
                                      };
                                      setCase(updated);
                                    }}
                                    disabled={!isEditable}
                                    title="Click to automatically apply WHO Drug dictionary record"
                                  >
                                    Apply "{suggestion.generic_name}" ({suggestion.atc_code})
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="form-group">
                          <label>Generic Name</label>
                          <input type="text" className="form-control" value={isBlinded ? '✦✦✦✦✦ (BLINDED)' : prod.genericName || ''} disabled />
                        </div>
                        <div className="form-group">
                          <label>WHO Medicinal ID</label>
                          <input
                            type="text"
                            className="form-control font-mono"
                            style={{ fontSize: '0.8rem' }}
                            value={isBlinded ? '✦✦✦✦✦ (BLINDED)' : prod.whoMedicinalId || ''}
                            onChange={(e) => updateProd('whoMedicinalId', e.target.value)}
                            disabled={isBlinded || !isEditable}
                            placeholder="e.g. WHO-002931-A"
                          />
                        </div>
                        <div className="form-group">
                          <label>Manufacturer</label>
                          <input type="text" className="form-control" value={isBlinded ? '✦✦✦✦✦ (BLINDED)' : prod.manufacturer || ''} disabled />
                        </div>
                      </div>

                      <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                        <div className="form-group">
                          <label>Drug Country</label>
                          <select
                            className="form-control"
                            value={prod.drugCountry || ''}
                            onChange={(e) => updateProd('drugCountry', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="">Select Country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Drug Code</label>
                          <input
                            type="text"
                            className="form-control font-mono"
                            style={{ fontSize: '0.8rem' }}
                            value={prod.drugCode || ''}
                            onChange={(e) => updateProd('drugCode', e.target.value)}
                            disabled={!isEditable}
                            placeholder="e.g. C-182921"
                          />
                        </div>
                        <div className="form-group">
                          <label>Product Role</label>
                          <select
                            className="form-control"
                            value={prod.type}
                            onChange={(e) => updateProd('type', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Suspect">Suspect Drug</option>
                            <option value="Concomitant">Concomitant Drug</option>
                            <option value="Interacting">Interacting Drug</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Contraindicated?</label>
                          <select
                            className="form-control"
                            value={prod.contraindicated || 'No'}
                            onChange={(e) => updateProd('contraindicated', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-cols-3" style={{ marginTop: '0.75rem' }}>
                        <div className="form-group">
                          <label>Drug Type</label>
                          <select
                            className="form-control"
                            value={prod.drugType || 'Chemical'}
                            onChange={(e) => updateProd('drugType', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Chemical">Chemical / Small Molecule</option>
                            <option value="Biological">Biological / Protein</option>
                            <option value="Vaccine">Vaccine</option>
                            <option value="Blood Product">Blood Product</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Batch Number</label>
                          <input type="text" className="form-control" value={prod.batchNumber || ''} onChange={(e) => updateProd('batchNumber', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Lot Number</label>
                          <input type="text" className="form-control" value={prod.lotNumber || ''} onChange={(e) => updateProd('lotNumber', e.target.value)} disabled={!isEditable} />
                        </div>
                      </div>

                      <div className="grid-cols-3" style={{ marginTop: '0.75rem' }}>
                        <div className="form-group">
                          <label>Action Taken with Drug</label>
                          <select
                            className="form-control"
                            value={prod.actionTaken || 'Unknown'}
                            onChange={(e) => updateProd('actionTaken', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="Drug Withdrawn">Drug Withdrawn</option>
                            <option value="Dose Reduced">Dose Reduced</option>
                            <option value="Dose Increased">Dose Increased</option>
                            <option value="Dose Not Changed">Dose Not Changed</option>
                            <option value="Not Applicable">Not Applicable</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Dechallenge (Did event abate?)</label>
                          <select
                            className="form-control"
                            value={prod.dechallenge || 'Unknown'}
                            onChange={(e) => updateProd('dechallenge', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="Positive">Positive (Yes)</option>
                            <option value="Negative">Negative (No)</option>
                            <option value="Not Applicable">Not Applicable</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Rechallenge (Did event recur?)</label>
                          <select
                            className="form-control"
                            value={prod.rechallenge || 'Unknown'}
                            onChange={(e) => updateProd('rechallenge', e.target.value)}
                            disabled={!isEditable}
                          >
                            <option value="Unknown">Unknown</option>
                            <option value="Positive">Positive (Yes)</option>
                            <option value="Negative">Negative (No)</option>
                            <option value="Not Applicable">Not Applicable</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* section 2: Dosage Regimen */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '0.9rem' }}>Dosage Regimen & Dates</h4>
                      
                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Dose</label>
                          <input type="text" className="form-control" placeholder="500" value={prod.dose || ''} onChange={(e) => updateProd('dose', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Dose Unit</label>
                          <select className="form-control" value={prod.doseUnit || 'mg'} onChange={(e) => updateProd('doseUnit', e.target.value)} disabled={!isEditable}>
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="tablets">tablets</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Frequency</label>
                          <select className="form-control" value={prod.frequency || 'QD'} onChange={(e) => updateProd('frequency', e.target.value)} disabled={!isEditable}>
                            <option value="QD">QD (Once Daily)</option>
                            <option value="BID">BID (Twice Daily)</option>
                            <option value="TID">TID (Three times Daily)</option>
                            <option value="QID">QID (Four times Daily)</option>
                            <option value="PRN">PRN (As Needed)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Route of Administration</label>
                          <select className="form-control" value={prod.route || 'Oral'} onChange={(e) => updateProd('route', e.target.value)} disabled={!isEditable}>
                            <option value="Oral">Oral</option>
                            <option value="Intravenous">Intravenous</option>
                            <option value="Subcutaneous">Subcutaneous</option>
                            <option value="Intramuscular">Intramuscular</option>
                            <option value="Topical">Topical</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                        <div className="form-group">
                          <label>Formulation</label>
                          <input type="text" placeholder="Capsule, Tablet" className="form-control" value={prod.formulation || ''} onChange={(e) => updateProd('formulation', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Dosage Form</label>
                          <input type="text" placeholder="Oral solid" className="form-control" value={prod.dosageForm || ''} onChange={(e) => updateProd('dosageForm', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Daily Dose</label>
                          <input type="text" placeholder="e.g. 1000 mg" className="form-control" value={prod.dailyDose || ''} onChange={(e) => updateProd('dailyDose', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Total Cumulative Dose</label>
                          <input type="text" placeholder="e.g. 15000 mg" className="form-control" value={prod.totalDose || ''} onChange={(e) => updateProd('totalDose', e.target.value)} disabled={!isEditable} />
                        </div>
                      </div>

                      <div className="grid-cols-3" style={{ marginTop: '0.75rem' }}>
                        <div className="form-group">
                          <label>Product Indication (Verbatim)</label>
                          <input type="text" className="form-control" placeholder="e.g. Type II Diabetes Mellitus" value={prod.reportedIndication || ''} onChange={(e) => updateProd('reportedIndication', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Therapy Start Date</label>
                          <input type="date" className="form-control" value={prod.therapyStartDate || ''} onChange={(e) => updateProd('therapyStartDate', e.target.value)} disabled={!isEditable} />
                        </div>
                        <div className="form-group">
                          <label>Therapy Stop Date</label>
                          <input type="date" className="form-control" value={prod.therapyStopDate || ''} onChange={(e) => updateProd('therapyStopDate', e.target.value)} disabled={!isEditable} />
                        </div>
                      </div>
                    </div>

                    {/* section 3: Dechallenge / Rechallenge & Outcome */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '0.9rem' }}>Dechallenge, Rechallenge & Assessment</h4>
                      
                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Dechallenge</label>
                          <select className="form-control" value={prod.dechallenge || 'Positive'} onChange={(e) => updateProd('dechallenge', e.target.value)} disabled={!isEditable}>
                            <option value="Positive">Positive (Resolved on withdrawal)</option>
                            <option value="Negative">Negative (Continued on withdrawal)</option>
                            <option value="Not Done">Not Applicable / Not Done</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Rechallenge</label>
                          <select className="form-control" value={prod.rechallenge || 'Not Done'} onChange={(e) => updateProd('rechallenge', e.target.value)} disabled={!isEditable}>
                            <option value="Positive">Positive (Recurred on reintroduction)</option>
                            <option value="Negative">Negative (Did not recur)</option>
                            <option value="Not Done">Not Done</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Action Taken</label>
                          <select className="form-control" value={prod.actionTaken || 'None'} onChange={(e) => updateProd('actionTaken', e.target.value)} disabled={!isEditable}>
                            <option value="Drug Withdrawn">Drug Withdrawn</option>
                            <option value="Dose Reduced">Dose Reduced</option>
                            <option value="Dose Increased">Dose Increased</option>
                            <option value="None">Dose Not Changed</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Product Outcome</label>
                          <select className="form-control" value={prod.outcome || 'Unknown'} onChange={(e) => updateProd('outcome', e.target.value)} disabled={!isEditable}>
                            <option value="Recovered">Recovered / Resolved</option>
                            <option value="Recovering">Recovering / Resolving</option>
                            <option value="Not Recovered">Not Recovered</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label>Product Notes / Remarks</label>
                        <textarea rows="2" className="form-control" value={prod.notes || ''} onChange={(e) => updateProd('notes', e.target.value)} disabled={!isEditable} placeholder="Enter any additional product comments..." />
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================= 4. EVENTS TAB ======================= */}
          {activeTab === 'events' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Event Sub-tabs Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    border: 'none',
                    borderBottom: eventSubTab === 'info' ? '3px solid var(--primary)' : 'none',
                    backgroundColor: 'transparent',
                    color: eventSubTab === 'info' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: eventSubTab === 'info' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEventSubTab('info')}
                >
                  Event Information
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    border: 'none',
                    borderBottom: eventSubTab === 'assessment' ? '3px solid var(--primary)' : 'none',
                    backgroundColor: 'transparent',
                    color: eventSubTab === 'assessment' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: eventSubTab === 'assessment' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEventSubTab('assessment')}
                >
                  Event Assessment (Causality & Listedness)
                </button>
              </div>

              {eventSubTab === 'info' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>Adverse Events Details</h3>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={addEvent} disabled={!isEditable}>
                      <Plus size={12} /> Add Event
                    </button>
                  </div>

                  {c.events.map((ev, idx) => (
                    <div key={ev.id || idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      {/* Event details */}
                      <div className="grid-cols-2">
                        <div className="form-group">
                          <label>Description as Reported (Verbatim) *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={ev.descriptionAsReported}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].descriptionAsReported = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Description to be Coded</label>
                          <input
                            type="text"
                            placeholder="Coded term selection..."
                            className="form-control"
                            value={ev.descriptionToBeCoded || ev.descriptionAsReported}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].descriptionToBeCoded = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                      </div>

                      {/* Onset Dates and times */}
                      <div className="grid-cols-4">
                        <div className="form-group">
                          <label>Event Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={ev.eventStartDate || ''}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].eventStartDate = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Event End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={ev.eventEndDate || ''}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].eventEndDate = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Onset Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={ev.onsetDate || ''}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].onsetDate = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Onset Time</label>
                          <input
                            type="time"
                            className="form-control"
                            value={ev.onsetTime || ''}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].onsetTime = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                      </div>

                      <div className="grid-cols-3">
                        <div className="form-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. 3 Days"
                            className="form-control"
                            value={ev.duration || ''}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].duration = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          />
                        </div>
                        <div className="form-group">
                          <label>Event Outcome</label>
                          <select
                            className="form-control"
                            value={ev.outcome || 'Unknown'}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].outcome = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          >
                            <option value="Recovered">Recovered / Resolved</option>
                            <option value="Recovering">Recovering / Resolving</option>
                            <option value="Not Recovered">Not Recovered</option>
                            <option value="Fatal">Fatal</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Severity</label>
                          <select
                            className="form-control"
                            value={ev.severity || 'Moderate'}
                            onChange={(e) => {
                              const updated = { ...c };
                              updated.events[idx].severity = e.target.value;
                              setCase(updated);
                            }}
                            disabled={!isEditable}
                          >
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <label>MedDRA Coding Selection</label>
                        <div style={{ display: 'flex', gap: '0.25rem', maxWidth: '400px' }}>
                          <input type="text" className="form-control" value={ev.coding?.pt || ''} readOnly placeholder="Search MedDRA..." />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setMeddraTarget('event');
                              setMeddraTargetIdx(idx);
                              setMeddraOpen(true);
                            }}
                            disabled={!isEditable}
                          >
                            Encode
                          </button>
                        </div>
                        {/* Smart MedDRA Auto-Coding Chip */}
                        {(() => {
                          const suggestion = suggestMedDRATerm(ev.descriptionAsReported);
                          if (suggestion && (!ev.coding?.pt || ev.coding.pt !== suggestion.pt)) {
                            return (
                              <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>⚡ AI Suggested Code:</span>
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.72rem',
                                    backgroundColor: '#e0e7ff',
                                    color: '#3730a3',
                                    border: '1px solid #c7d2fe',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                  onClick={() => {
                                    const updated = { ...c };
                                    updated.events[idx].coding = {
                                      llt: suggestion.llt,
                                      llt_code: suggestion.llt_code,
                                      pt: suggestion.pt,
                                      pt_code: suggestion.pt_code,
                                      soc: suggestion.soc,
                                      soc_code: suggestion.soc_code
                                    };
                                    setCase(updated);
                                  }}
                                  disabled={!isEditable}
                                  title="Click to automatically apply this MedDRA code"
                                >
                                  Apply "{suggestion.pt}" ({suggestion.soc})
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Coded MedDRA hierarchy */}
                      {ev.coding?.pt && (
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '6px', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <div><strong>LLT:</strong> {ev.coding.llt || ev.coding.pt}</div>
                          <div><strong>PT:</strong> {ev.coding.pt} ({ev.coding.pt_code})</div>
                          <div><strong>HLT:</strong> {ev.coding.hlt || 'HLT not set'}</div>
                          <div><strong>HLGT:</strong> {ev.coding.hlgt || 'HLGT not set'}</div>
                          <div><strong>SOC:</strong> {ev.coding.soc} ({ev.coding.soc_code})</div>
                          <div><strong>MedDRA Version:</strong> 26.0 (Active)</div>
                        </div>
                      )}

                      {/* Seriousness Criteria */}
                      <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
                        <label>Seriousness Criteria</label>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ev.seriousness.death}
                              onChange={() => {
                                const updated = { ...c };
                                updated.events[idx].seriousness.death = !updated.events[idx].seriousness.death;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                            Death
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ev.seriousness.lifeThreatening}
                              onChange={() => {
                                const updated = { ...c };
                                updated.events[idx].seriousness.lifeThreatening = !updated.events[idx].seriousness.lifeThreatening;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                            Life Threatening
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ev.seriousness.hospitalized}
                              onChange={() => {
                                const updated = { ...c };
                                updated.events[idx].seriousness.hospitalized = !updated.events[idx].seriousness.hospitalized;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                            Hospitalization
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ev.seriousness.disability}
                              onChange={() => {
                                const updated = { ...c };
                                updated.events[idx].seriousness.disability = !updated.events[idx].seriousness.disability;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                            Disability
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ev.seriousness.congenitalAnomaly}
                              onChange={() => {
                                const updated = { ...c };
                                updated.events[idx].seriousness.congenitalAnomaly = !updated.events[idx].seriousness.congenitalAnomaly;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                            Congenital Anomaly
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ev.seriousness.otherMedicallyImportant}
                              onChange={() => {
                                const updated = { ...c };
                                updated.events[idx].seriousness.otherMedicallyImportant = !updated.events[idx].seriousness.otherMedicallyImportant;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                            Other Medically Important
                          </label>
                        </div>
                      </div>

                      {/* Death Details */}
                      {ev.seriousness.death && (
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fcfcfc' }}>
                          <h5 style={{ fontWeight: '600', margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--color-danger)' }}>Death Details</h5>
                          <div className="grid-cols-3">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Death Date</label>
                              <input
                                type="date"
                                className="form-control"
                                value={ev.deathDetails?.date || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].deathDetails) updated.events[idx].deathDetails = {};
                                  updated.events[idx].deathDetails.date = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Cause of Death</label>
                              <input
                                type="text"
                                placeholder="Primary cause..."
                                className="form-control"
                                value={ev.deathDetails?.cause || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].deathDetails) updated.events[idx].deathDetails = {};
                                  updated.events[idx].deathDetails.cause = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Autopsy Done</label>
                              <select
                                className="form-control"
                                value={ev.deathDetails?.autopsy || 'No'}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].deathDetails) updated.events[idx].deathDetails = {};
                                  updated.events[idx].deathDetails.autopsy = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                                <option value="Unknown">Unknown</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hospitalization Details */}
                      {ev.seriousness.hospitalized && (
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fcfcfc' }}>
                          <h5 style={{ fontWeight: '600', margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--primary)' }}>Hospitalization Details</h5>
                          <div className="grid-cols-4">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Admission Date</label>
                              <input
                                type="date"
                                className="form-control"
                                value={ev.hospDetails?.admissionDate || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].hospDetails) updated.events[idx].hospDetails = {};
                                  updated.events[idx].hospDetails.admissionDate = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Discharge Date</label>
                              <input
                                type="date"
                                className="form-control"
                                value={ev.hospDetails?.dischargeDate || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].hospDetails) updated.events[idx].hospDetails = {};
                                  updated.events[idx].hospDetails.dischargeDate = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Hospital Name</label>
                              <input
                                type="text"
                                placeholder="Saint Jude Hosp"
                                className="form-control"
                                value={ev.hospDetails?.hospitalName || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].hospDetails) updated.events[idx].hospDetails = {};
                                  updated.events[idx].hospDetails.hospitalName = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Hospitalization Duration</label>
                              <input
                                type="text"
                                placeholder="e.g. 5 days"
                                className="form-control"
                                value={ev.hospDetails?.duration || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  if (!updated.events[idx].hospDetails) updated.events[idx].hospDetails = {};
                                  updated.events[idx].hospDetails.duration = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {isEditable && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => deleteEvent(idx)}>
                            Remove Event
                          </button>
                        </div>
                      )}

                    </div>
                  ))}
                </>
              ) : (
                /* Event Assessment sub-tab: causality and listedness matrix grid */
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', overflowX: 'auto' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Product-Event Causality & Listedness Matrix</h4>
                  <table className="pv-table" style={{ fontSize: '0.8rem', width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Product Name</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Event Name (Coded PT)</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Reported Causality</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Determined Causality</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Listedness</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Company Assessment</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1.5px solid var(--border-color)' }}>Medical Reviewer Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.products.map((prod) => (
                        c.events.map((ev, eIdx) => (
                          <tr key={`${prod.id}-${ev.id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}><strong>{prod.tradeName || 'Unspecified'}</strong> ({prod.type})</td>
                            <td style={{ padding: '0.5rem' }}>{ev.coding?.pt || ev.descriptionAsReported || 'Uncoded'}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <select
                                className="form-control"
                                style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                                value={ev.causality || 'Possible'}
                                onChange={(e) => handleCausalityChange(eIdx, e.target.value)}
                                disabled={!isEditable}
                              >
                                <option value="Possible">Possible</option>
                                <option value="Related">Related</option>
                                <option value="Unrelated">Unrelated</option>
                                <option value="Unknown">Unknown</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <span style={{
                                fontWeight: '600',
                                color: ev.causality === 'Unrelated' ? 'var(--color-success)' : 'var(--color-danger)'
                              }}>
                                {ev.causality === 'Unrelated' ? 'Unrelated' : 'Related'}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <select
                                className="form-control"
                                style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                                value={ev.listedness || 'Unknown'}
                                onChange={(e) => handleListednessChange(eIdx, e.target.value)}
                                disabled={!isEditable}
                              >
                                <option value="Labeled">Expected (Labeled)</option>
                                <option value="Unlabeled">Unexpected (Unlabeled)</option>
                                <option value="Unknown">Unknown</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <select
                                className="form-control"
                                style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                                value={ev.companyAssessment || 'Possible'}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  updated.events[eIdx].companyAssessment = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              >
                                <option value="Related">Related</option>
                                <option value="Possible">Possible</option>
                                <option value="Unrelated">Unrelated</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Reviewer remarks..."
                                className="form-control"
                                style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                                value={ev.reviewerComments || ''}
                                onChange={(e) => {
                                  const updated = { ...c };
                                  updated.events[eIdx].reviewerComments = e.target.value;
                                  setCase(updated);
                                }}
                                disabled={!isEditable}
                              />
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Narrative Section */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--primary)', margin: 0 }}>Narrative & Comments</h4>
                  <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={generateNarrative} disabled={!isEditable}>
                    Auto-Generate Narrative
                  </button>
                </div>

                <div className="form-group">
                  <label>Case Narrative</label>
                  <textarea
                    rows="5"
                    className="form-control"
                    placeholder="Describe the clinical course of the adverse events, test results, and therapies..."
                    value={c.analysis.narrative}
                    onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, narrative: e.target.value } })}
                    disabled={!isEditable}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Medical Narrative (Reviewer Summary)</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Medical summary for aggregate safety reporting..."
                    value={c.analysis.medicalNarrative || ''}
                    onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, medicalNarrative: e.target.value } })}
                    disabled={!isEditable}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Company Comments</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Company sponsor safety comments..."
                    value={c.analysis.companyComments || ''}
                    onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, companyComments: e.target.value } })}
                    disabled={!isEditable}
                  />
                </div>
              </div>

              {/* Case Summary */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Case Summary & Safety Evaluation</h4>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label>Case Seriousness</label>
                    <select
                      className="form-control"
                      value={c.analysis.caseSummary.seriousness}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, caseSummary: { ...c.analysis.caseSummary, seriousness: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Yes">Serious</option>
                      <option value="No">Non-Serious</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Case Outcome</label>
                    <select
                      className="form-control"
                      value={c.analysis.caseOutcome || 'Recovered'}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, caseOutcome: e.target.value } })}
                      disabled={!isEditable}
                    >
                      <option value="Recovered">Recovered / Resolved</option>
                      <option value="Recovering">Recovering / Resolving</option>
                      <option value="Not Recovered">Not Recovered / Chronic</option>
                      <option value="Fatal">Fatal Outcome</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Diagnosis Coded</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Coded PT term..."
                      value={c.analysis.diagnosis || ''}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, diagnosis: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Causality</label>
                    <select
                      className="form-control"
                      value={c.analysis.caseSummary.causality}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, caseSummary: { ...c.analysis.caseSummary, causality: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Related">Related</option>
                      <option value="Possible">Possible</option>
                      <option value="Unrelated">Unrelated</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Listedness Determination</label>
                    <select
                      className="form-control"
                      value={c.analysis.caseSummary.listedness}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, caseSummary: { ...c.analysis.caseSummary, listedness: e.target.value } } })}
                      disabled={!isEditable}
                    >
                      <option value="Labeled">Labeled (Expected)</option>
                      <option value="Unlisted">Unlisted (Unexpected)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Summary Comments</label>
                    <input
                      type="text"
                      placeholder="General summary comments..."
                      className="form-control"
                      value={c.analysis.summaryComments || ''}
                      onChange={(e) => setCase({ ...c, analysis: { ...c.analysis, summaryComments: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================= 7. ACTIVITIES TAB ======================= */}
          {activeTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Contact Log */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Contact Log</h4>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      const updated = { ...c };
                      if (!updated.activities.contactLogs) updated.activities.contactLogs = [];
                      updated.activities.contactLogs.push({
                        date: new Date().toISOString().slice(0, 10),
                        code: 'QUERY',
                        description: 'Follow-up query sent',
                        sentBy: currentUser.name
                      });
                      setCase(updated);
                    }}
                    disabled={!isEditable}
                  >
                    <Plus size={12} /> Add Contact Log
                  </button>
                </div>
                {!c.activities.contactLogs || c.activities.contactLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>No contact correspondence logged.</div>
                ) : (
                  <table className="pv-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Contact Type</th>
                        <th>Description</th>
                        <th>User</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.activities.contactLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td>{log.date}</td>
                          <td>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={log.code}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.contactLogs[idx].code = e.target.value;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            >
                              <option value="QUERY">Follow-up Query</option>
                              <option value="EMAIL">Email Notification</option>
                              <option value="LETTER">Official Letter</option>
                              <option value="PHONE">Phone Call Log</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={log.description}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.contactLogs[idx].description = e.target.value;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                          </td>
                          <td>{log.sentBy}</td>
                          <td>
                            <button
                              className="quick-btn"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => {
                                const updated = { ...c };
                                updated.activities.contactLogs.splice(idx, 1);
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Action Items */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Action Items</h4>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      const updated = { ...c };
                      if (!updated.activities.actionItems) updated.activities.actionItems = [];
                      updated.activities.actionItems.push({
                        code: 'Action',
                        description: 'Follow-up query details request',
                        assignedTo: 'Data Entry Person',
                        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
                        completed: false,
                        priority: 'Medium'
                      });
                      setCase(updated);
                    }}
                    disabled={!isEditable}
                  >
                    <Plus size={12} /> Add Action Item
                  </button>
                </div>
                {!c.activities.actionItems || c.activities.actionItems.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>No action items recorded.</div>
                ) : (
                  <table className="pv-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Action Description</th>
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.activities.actionItems.map((act, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={act.description}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.actionItems[idx].description = e.target.value;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={act.assignedTo || ''}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.actionItems[idx].assignedTo = e.target.value;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={act.dueDate || ''}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.actionItems[idx].dueDate = e.target.value;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            />
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={act.priority || 'Medium'}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.actionItems[idx].priority = e.target.value;
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={act.completed ? 'Completed' : 'Pending'}
                              onChange={(e) => {
                                const updated = { ...c };
                                updated.activities.actionItems[idx].completed = e.target.value === 'Completed';
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="quick-btn"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => {
                                const updated = { ...c };
                                updated.activities.actionItems.splice(idx, 1);
                                setCase(updated);
                              }}
                              disabled={!isEditable}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Routing */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Routing & Stages</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Route To</label>
                    <select
                      className="form-control"
                      value={c.activities.routeTo || 'QC'}
                      onChange={(e) => setCase({ ...c, activities: { ...c.activities, routeTo: e.target.value } })}
                      disabled={!isEditable}
                    >
                      <option value="QC">Quality Review (QC)</option>
                      <option value="MR">Medical Review (MR)</option>
                      <option value="Submission">Regulatory Submission</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Workflow Stage</label>
                    <input type="text" className="form-control" value={c.workflowState} disabled />
                  </div>
                  <div className="form-group">
                    <label>Routing Comment</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Comment for next reviewer..."
                      value={c.activities.routingComment || ''}
                      onChange={(e) => setCase({ ...c, activities: { ...c.activities, routingComment: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>

              {/* Case Lock Status */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Case Lock & Archiving</h4>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" onClick={handleLockToggle}>
                    {c.lockState === 'Locked' ? 'Unlock Case' : 'Lock Case'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => alert("Case file archived successfully.")}>
                    Archive Case
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ======================= 8. ADDITIONAL INFORMATION ======================= */}
          {activeTab === 'additional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Internal / Medical Notes */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Case Notes</h4>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>Internal Notes</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="Add administrative or workflow notes here..."
                      value={c.additionalInfo?.internalNotes || ''}
                      onChange={(e) => setCase({ ...c, additionalInfo: { ...(c.additionalInfo || {}), internalNotes: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Medical Notes</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="Medical safety or signal detection notes..."
                      value={c.additionalInfo?.medicalNotes || ''}
                      onChange={(e) => setCase({ ...c, additionalInfo: { ...(c.additionalInfo || {}), medicalNotes: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Case Attachments</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Attachment Type</label>
                    <select className="form-control" disabled={!isEditable}>
                      <option value="Source Document">Source Document (Intake PDF)</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Medical Record">Medical Record</option>
                      <option value="Image">Image (e.g. ECG, X-Ray)</option>
                      <option value="PDF">Standard PDF Attachment</option>
                      <option value="Email">Email Correspondence File</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Upload File</label>
                    <input type="file" className="form-control" disabled={!isEditable} />
                  </div>
                </div>
                <div style={{
                  padding: '2rem',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '6px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  marginTop: '1rem'
                }}>
                  Drag & Drop Case Intake Source documents (.pdf, .tiff, .jpg) here
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Max file upload size: 30MB</div>
                </div>
              </div>

              {/* References */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Case References & Linking</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Reference Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. REF-9831"
                      value={c.additionalInfo?.referenceNumber || ''}
                      onChange={(e) => setCase({ ...c, additionalInfo: { ...(c.additionalInfo || {}), referenceNumber: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Linked Case Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 2026US00004"
                      value={c.additionalInfo?.linkedCase || ''}
                      onChange={(e) => setCase({ ...c, additionalInfo: { ...(c.additionalInfo || {}), linkedCase: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group">
                    <label>Literature Reference Details</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Medline, PubMed IDs..."
                      value={c.additionalInfo?.literatureRef || ''}
                      onChange={(e) => setCase({ ...c, additionalInfo: { ...(c.additionalInfo || {}), literatureRef: e.target.value } })}
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================= 9. REGULATORY REPORTS ======================= */}
          {activeTab === 'regulatory' && (
            <RegulatoryReportsView caseNumber={caseNumber} isLocked={c.lockState === 'Locked'} />
          )}

          {/* ======================= 9.5. QC REVIEW TAB ======================= */}
          {activeTab === 'qc' && (
            <QcReviewView c={c} setCase={setCase} caseNumber={caseNumber} isEditable={isEditable} onBack={onBack} currentUser={currentUser} />
          )}

          {/* ======================= 9.6. MEDICAL REVIEW TAB ======================= */}
          {activeTab === 'mr' && (
            <MedicalReviewView c={c} setCase={setCase} caseNumber={caseNumber} isEditable={isEditable} onBack={onBack} currentUser={currentUser} />
          )}

          {/* ======================= 10. BOTTOM BUTTONS ======================= */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            backgroundColor: '#f1f5f9',
            borderTop: '2px solid var(--primary)',
            marginTop: '1.5rem',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  alert("Draft saved locally. (Click Save to submit changes to server)");
                }}
                disabled={!isEditable}
              >
                Save Draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSave(true)}
                disabled={saving || !isEditable}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab('regulatory');
                  alert("E2B validation complete. Checking constraints in the Regulatory tab.");
                }}
              >
                Validate
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  alert("Running duplicate search on active cases list... No duplicates found.");
                }}
              >
                Duplicate Check
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  alert("Print summary sheet generated.");
                  window.print();
                }}
              >
                <Printer size={16} /> Print
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                onClick={() => {
                  // Forward route modal
                  alert("Case validated successfully. Navigating to Activities -> Routing in the sidebar to complete the Routing flow.");
                  setActiveTab('activities');
                }}
                disabled={!isEditable}
              >
                Forward to QC
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
              >
                Close Case
              </button>
            </div>
          </div>

        </div>

      {/* MedDRA Dictionary popup Modal */}
      <MedDRABrowser
        isOpen={meddraOpen}
        onClose={() => setMeddraOpen(false)}
        onSelect={handleMeddraSelect}
      />

      {/* WHO Drug Dictionary popup Modal */}
      <WHODrugBrowser
        isOpen={whoOpen}
        onClose={() => setWhoOpen(false)}
        onSelect={handleWhoSelect}
      />

      {/* Audit Trail Modal */}
      <AuditTrailModal 
        isOpen={showAuditModal} 
        onClose={() => setShowAuditModal(false)} 
        caseNumber={caseNumber} 
      />

      {/* Case Routing Modal */}
      <CaseRoutingModal
        isOpen={routingModalOpen}
        onClose={() => setRoutingModalOpen(false)}
        caseNumber={c.caseNumber}
        currentWorkflowState={c.workflowState}
        currentUser={currentUser}
        onRouteSuccess={(updated) => {
          setCase(updated);
          alert(`Case successfully routed to ${updated.workflowState}.`);
        }}
      />
    </div>
    </div>
    </>
  );
}
