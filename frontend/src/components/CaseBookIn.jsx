import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, AlertTriangle, RefreshCw, UploadCloud, FolderOpen, Briefcase, FileCode, CheckCircle, FileText, Check, HelpCircle, Archive, AlertOctagon, Save, ArrowRight, CornerUpLeft, Ban, FileCheck, Layers, ClipboardList, Send, Printer } from 'lucide-react';
import { COUNTRIES } from '../utils/countries';

export default function CaseBookIn({ onBookInSuccess }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, source, bookin, duplicates, triage, followUp, workflow

  // 1. Intake Dashboard State (Mock numbers)
  const dashboardStats = {
    newCases: 0,
    pendingBookIn: 0,
    duplicateReview: 0,
    followUpCases: 0,
    returnedCases: 0,
    assignedCases: 0
  };

  // 2. Source Document & OCR State
  const [uploadType, setUploadType] = useState('PDF');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [runningOcr, setRunningOcr] = useState(false);

  // 3. Initial Case Entry Form State
  const [projectId, setProjectId] = useState('');
  const [studyId, setStudyId] = useState('');
  const [centerId, setCenterId] = useState('');
  const [initialJustification, setInitialJustification] = useState('');
  const [genericName, setGenericName] = useState('');
  const [onsetDate, setOnsetDate] = useState('');
  const [onsetTime, setOnsetTime] = useState('');
  const [reporterState, setReporterState] = useState('');
  const [reporterPostalCode, setReporterPostalCode] = useState('');
  const [reporterIntermediary, setReporterIntermediary] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [patientAgeUnit, setPatientAgeUnit] = useState('Years');
  const [reportedCausality, setReportedCausality] = useState('');
  const [seriousnessOtherText, setSeriousnessOtherText] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [initialReceiptDate, setInitialReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [latestReceiptDate, setLatestReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [country, setCountry] = useState('UNITED STATES');
  const [reportType, setReportType] = useState('Spontaneous');
  const [sourceType, setSourceType] = useState('Spontaneous');
  const [seriousnessSerious, setSeriousnessSerious] = useState('Yes');
  const [medicallyConfirmed, setMedicallyConfirmed] = useState('Yes');
  const [priority, setPriority] = useState('Medium');
  
  // Dynamic Source Fields
  const [litTitle, setLitTitle] = useState('');
  const [litAuthor, setLitAuthor] = useState('');
  const [litYear, setLitYear] = useState('');
  const [regReportNo, setRegReportNo] = useState('');
  
  // Historical data for Autocomplete
  const [allCasesData, setAllCasesData] = useState([]);

  // Reporter
  const [reporterType, setReporterType] = useState('Physician');
  const [reporterHcp, setReporterHcp] = useState('Yes');
  const [reporterFirstName, setReporterFirstName] = useState('');
  const [reporterLastName, setReporterLastName] = useState('');
  const [reporterCountry, setReporterCountry] = useState('UNITED STATES');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

  // Patient
  const [patientInitials, setPatientInitials] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Unknown');

  // Product
  const [productName, setProductName] = useState('');
  const [isSuspectProduct, setIsSuspectProduct] = useState(true);

  // Event
  const [reportedDescription, setReportedDescription] = useState('');
  const [eventOutcome, setEventOutcome] = useState('Recovering');
  const [eventSeriousness, setEventSeriousness] = useState({
    death: false,
    hospitalized: false,
    lifeThreatening: false,
    disability: false,
    congenitalAnomaly: false,
    medicallyImportant: false
  });

  // 4. Duplicate Search State
  const [dupProduct, setDupProduct] = useState('');
  const [dupEvent, setDupEvent] = useState('');
  const [dupInitials, setDupInitials] = useState('');
  const [dupAge, setDupAge] = useState('');
  const [dupGender, setDupGender] = useState('Unknown');
  const [dupCountry, setDupCountry] = useState('UNITED STATES');
  const [duplicates, setDuplicates] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  // 5. Case Triage & ICSR State
  const [hasPatient, setHasPatient] = useState(false);
  const [hasReporter, setHasReporter] = useState(false);
  const [hasProduct, setHasProduct] = useState(false);
  const [hasEvent, setHasEvent] = useState(false);
  const [caseClassification, setCaseClassification] = useState('Valid ICSR');
  const [expeditedReporting, setExpeditedReporting] = useState('No');

  // 6. Follow-up Management State
  const [followUpNum, setFollowUpNum] = useState('0');
  const [followUpDate, setFollowUpDate] = useState('');
  const [missingInfo, setMissingInfo] = useState('');
  const [querySent, setQuerySent] = useState(false);
  const [responseReceived, setResponseReceived] = useState(false);
  const [pendingItems, setPendingItems] = useState('');

  // 8. QC Checklist State
  const [qcPatient, setQcPatient] = useState(false);
  const [qcReporter, setQcReporter] = useState(false);
  const [qcProduct, setQcProduct] = useState(false);
  const [qcEvent, setQcEvent] = useState(false);
  const [qcDuplicateChecked, setQcDuplicateChecked] = useState(false);
  const [qcMandatoryCompleted, setQcMandatoryCompleted] = useState(false);
  const [qcSourceAttached, setQcSourceAttached] = useState(false);
  const [qcSeriousnessVerified, setQcSeriousnessVerified] = useState(false);
  const [qcBookInReady, setQcBookInReady] = useState(false);

  // 9. Workflow Routing State
  const [assignedTo, setAssignedTo] = useState('triage');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [comments, setComments] = useState('');
  const [routeTo, setRouteTo] = useState('Data Entry');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // Fetch Draft on Mount
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/drafts`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const draft = await res.json();
          if (draft) {
            if (draft.projectId !== undefined) setProjectId(draft.projectId);
            if (draft.studyId !== undefined) setStudyId(draft.studyId);
            if (draft.centerId !== undefined) setCenterId(draft.centerId);
            if (draft.initialJustification !== undefined) setInitialJustification(draft.initialJustification);
            if (draft.genericName !== undefined) setGenericName(draft.genericName);
            if (draft.onsetDate !== undefined) setOnsetDate(draft.onsetDate);
            if (draft.onsetTime !== undefined) setOnsetTime(draft.onsetTime);
            if (draft.reporterState !== undefined) setReporterState(draft.reporterState);
            if (draft.reporterPostalCode !== undefined) setReporterPostalCode(draft.reporterPostalCode);
            if (draft.reporterIntermediary !== undefined) setReporterIntermediary(draft.reporterIntermediary);
            if (draft.patientId !== undefined) setPatientId(draft.patientId);
            if (draft.patientDob !== undefined) setPatientDob(draft.patientDob);
            if (draft.patientAgeUnit !== undefined) setPatientAgeUnit(draft.patientAgeUnit);
            if (draft.reportedCausality !== undefined) setReportedCausality(draft.reportedCausality);
            if (draft.seriousnessOtherText !== undefined) setSeriousnessOtherText(draft.seriousnessOtherText);
            if (draft.receiptDate !== undefined) setReceiptDate(draft.receiptDate);
            if (draft.initialReceiptDate !== undefined) setInitialReceiptDate(draft.initialReceiptDate);
            if (draft.latestReceiptDate !== undefined) setLatestReceiptDate(draft.latestReceiptDate);
            if (draft.country !== undefined) setCountry(draft.country);
            if (draft.reportType !== undefined) setReportType(draft.reportType);
            if (draft.sourceType !== undefined) setSourceType(draft.sourceType);
            if (draft.seriousnessSerious !== undefined) setSeriousnessSerious(draft.seriousnessSerious);
            if (draft.medicallyConfirmed !== undefined) setMedicallyConfirmed(draft.medicallyConfirmed);
            if (draft.priority !== undefined) setPriority(draft.priority);
            if (draft.reporterType !== undefined) setReporterType(draft.reporterType);
            if (draft.reporterHcp !== undefined) setReporterHcp(draft.reporterHcp);
            if (draft.reporterFirstName !== undefined) setReporterFirstName(draft.reporterFirstName);
            if (draft.reporterLastName !== undefined) setReporterLastName(draft.reporterLastName);
            if (draft.litTitle !== undefined) setLitTitle(draft.litTitle);
            if (draft.litAuthor !== undefined) setLitAuthor(draft.litAuthor);
            if (draft.litYear !== undefined) setLitYear(draft.litYear);
            if (draft.regReportNo !== undefined) setRegReportNo(draft.regReportNo);
            if (draft.reporterCountry !== undefined) setReporterCountry(draft.reporterCountry);
            if (draft.reporterEmail !== undefined) setReporterEmail(draft.reporterEmail);
            if (draft.reporterPhone !== undefined) setReporterPhone(draft.reporterPhone);
            if (draft.patientInitials !== undefined) setPatientInitials(draft.patientInitials);
            if (draft.patientAge !== undefined) setPatientAge(draft.patientAge);
            if (draft.patientGender !== undefined) setPatientGender(draft.patientGender);
            if (draft.productName !== undefined) setProductName(draft.productName);
            if (draft.isSuspectProduct !== undefined) setIsSuspectProduct(draft.isSuspectProduct);
            if (draft.reportedDescription !== undefined) setReportedDescription(draft.reportedDescription);
            if (draft.eventOutcome !== undefined) setEventOutcome(draft.eventOutcome);
            if (draft.eventSeriousness !== undefined) setEventSeriousness(draft.eventSeriousness);
            if (draft.hasPatient !== undefined) setHasPatient(draft.hasPatient);
            if (draft.hasReporter !== undefined) setHasReporter(draft.hasReporter);
            if (draft.hasProduct !== undefined) setHasProduct(draft.hasProduct);
            if (draft.hasEvent !== undefined) setHasEvent(draft.hasEvent);
            if (draft.caseClassification !== undefined) setCaseClassification(draft.caseClassification);
            if (draft.expeditedReporting !== undefined) setExpeditedReporting(draft.expeditedReporting);
          }
        }
      } catch (err) {}
      setDraftLoaded(true);
    };
    fetchDraft();
  }, []);

  // Fetch historical data for Smart Suggestions
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/cases`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const cases = await res.json();
          setAllCasesData(cases);
        }
      } catch (e) {}
    };
    fetchCases();
  }, []);

  // Autofill Logic based on Reporter Email
  useEffect(() => {
    if (reporterEmail && allCasesData.length > 0) {
      const match = allCasesData.find(c => c.general?.reporterInfo?.[0]?.email === reporterEmail);
      if (match) {
        const info = match.general.reporterInfo[0];
        if (info.firstName && !reporterFirstName) setReporterFirstName(info.firstName);
        if (info.lastName && !reporterLastName) setReporterLastName(info.lastName);
        if (info.country && reporterCountry === 'UNITED STATES') setReporterCountry(info.country);
        if (info.type) setReporterType(info.type);
      }
    }
  }, [reporterEmail, allCasesData]);

  // Auto-Save Draft
  useEffect(() => {
    if (!draftLoaded) return;
    const draftData = {
      projectId, studyId, centerId, initialJustification, genericName, onsetDate, onsetTime,
      reporterState, reporterPostalCode, reporterIntermediary, patientId, patientDob,
      patientAgeUnit, reportedCausality, seriousnessOtherText, receiptDate, initialReceiptDate,
      latestReceiptDate, country, reportType, sourceType, seriousnessSerious, medicallyConfirmed,
      priority, reporterType, reporterHcp, reporterFirstName, reporterLastName, reporterCountry, reporterEmail,
      reporterPhone, patientInitials, patientAge, patientGender, productName, isSuspectProduct,
      reportedDescription, eventOutcome, eventSeriousness, hasPatient, hasReporter, hasProduct,
      hasEvent, caseClassification, expeditedReporting,
      litTitle, litAuthor, litYear, regReportNo
    };
    
    setAutoSaveStatus('Saving Draft...');
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(draftData)
        });
        if (res.ok) setAutoSaveStatus('Draft Saved');
        else setAutoSaveStatus('Save Failed');
      } catch (e) {
        setAutoSaveStatus('Save Failed');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [draftLoaded, projectId, studyId, centerId, initialJustification, genericName, onsetDate, onsetTime, reporterState, reporterPostalCode, reporterIntermediary, patientId, patientDob, patientAgeUnit, reportedCausality, seriousnessOtherText, receiptDate, initialReceiptDate, latestReceiptDate, country, reportType, sourceType, seriousnessSerious, medicallyConfirmed, priority, reporterType, reporterHcp, reporterFirstName, reporterLastName, reporterCountry, reporterEmail, reporterPhone, patientInitials, patientAge, patientGender, productName, isSuspectProduct, reportedDescription, eventOutcome, eventSeriousness, hasPatient, hasReporter, hasProduct, hasEvent, caseClassification, expeditedReporting, litTitle, litAuthor, litYear, regReportNo]);

  // OCR API Execution
  const runOCR = async () => {
    if (uploadedFiles.length === 0 || !uploadedFiles[0].file) {
      alert("No valid files to parse. Please upload source document.");
      return;
    }
    setRunningOcr(true);
    setOcrText('Scanning document via backend OCR...');
    
    try {
      const formData = new FormData();
      formData.append('document', uploadedFiles[0].file);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/ocr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('OCR API failed');
      const data = await res.json();
      
      setOcrText(`[EXTRACTED ICSR DATA via OCR]\n==============================================\n${data.text.substring(0, 500)}...\n==============================================`);
      
      if (data.fields) {
        if (data.fields.patientInitials) setPatientInitials(data.fields.patientInitials);
        if (data.fields.patientDob) setPatientDob(data.fields.patientDob);
        if (data.fields.patientGender) setPatientGender(data.fields.patientGender);
        if (data.fields.productName) setProductName(data.fields.productName);
        if (data.fields.reportedDescription) setReportedDescription(data.fields.reportedDescription);
        if (data.fields.reporterName) {
          const parts = data.fields.reporterName.split(' ');
          setReporterFirstName(parts[0] || '');
          setReporterLastName(parts.slice(1).join(' ') || '');
        }
        if (data.fields.reporterType) setReporterType(data.fields.reporterType);
        if (data.fields.reporterHcp) setReporterHcp(data.fields.reporterHcp);
        if (data.fields.eventSeriousness) setEventSeriousness(prev => ({ ...prev, ...data.fields.eventSeriousness }));
        if (data.fields.seriousnessSerious) setSeriousnessSerious(data.fields.seriousnessSerious);
      }
      
      alert('OCR parsing complete. Extracted fields populated automatically.');
    } catch (err) {
      console.error(err);
      setOcrText('Error running OCR engine.');
      alert('Error connecting to backend OCR API.');
    }
    setRunningOcr(false);
  };

  // Run Duplicate search in cases list
  const runDuplicateSearch = async () => {
    setSearching(true);
    setDuplicates([]);
    setError('');

    const searchProduct = dupProduct || productName;
    const searchEvent = dupEvent || reportedDescription;
    const searchInitials = dupInitials || patientInitials;

    if (!searchProduct && !searchEvent && !searchInitials) {
      setError('Please provide at least one parameter (Product Name, Event, or Patient Initials) to run duplicate check.');
      setSearching(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const allCases = await res.json();
        // Check matching cases
        const matches = allCases.filter(c => {
          const productMatch = searchProduct && c.products.some(p => p.tradeName.toLowerCase().includes(searchProduct.toLowerCase()));
          const eventMatch = searchEvent && c.events.some(e => e.descriptionAsReported.toLowerCase().includes(searchEvent.toLowerCase()));
          const patientMatch = searchInitials && c.patient.initials.toLowerCase().includes(searchInitials.toLowerCase());
          return productMatch || eventMatch || patientMatch;
        });
        setDuplicates(matches);
        setSearched(true);
        setQcDuplicateChecked(true);
      }
    } catch (err) {
      console.error(err);
      setError('Duplicate search query failed.');
    } finally {
      setSearching(false);
    }
  };

  // Execute Actual case creation
  const handleBookIn = async () => {
    setBooking(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Feature 1: Duplicate Case Detection
      if (patientInitials && patientDob && productName) {
        const dupRes = await fetch(`${API_BASE_URL}/cases/check-duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ initials: patientInitials, dob: patientDob, productName })
        });
        if (dupRes.ok) {
          const duplicates = await dupRes.json();
          if (duplicates.length > 0) {
            const proceed = window.confirm(`Potential duplicate case(s) found: ${duplicates.join(', ')}.\nDo you still want to book in this new case?`);
            if (!proceed) {
              setBooking(false);
              return;
            }
          }
        }
      }

      const res = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType,
          country,
          initialReceiptDate: receiptDate,
          productName,
          reportedDescription,
          seriousness: eventSeriousness,
          reportedCausality: reportedCausality || 'Possible',
          patientInitials,
          patientDob: patientDob || '',
          patientGender,
          // Valid ICSR Triage Checkboxes
          hasPatient,
          hasReporter,
          hasProduct,
          hasEvent,
          // Priorities and Source
          priority,
          sourceType,
          expeditedReporting,
          caseClassification,
          // Reporter details
          reporterFirstName,
          reporterLastName,
          reporterType,
          reporterEmail,
          reporterCountry,
          // Other properties
          projectId,
          studyId,
          centerId,
          initialJustification,
          genericName,
          onsetDate,
          onsetTime,
          reporterState,
          reporterPostalCode,
          reporterIntermediary,
          patientId,
          patientAgeUnit,
          routeTo
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Book-in failed.');
      }

      alert(`Case Book-in Successful! Coded as Stage: ${routeTo}. Case Number: ${data.caseNumber}`);
      
      // Clear draft after successful book-in
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/drafts`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      } catch (e) {}

      onBookInSuccess(data.caseNumber);
    } catch (err) {
      setError(err.message || 'Failed to complete book-in.');
    } finally {
      setBooking(false);
    }
  };

  const uniqueEmails = Array.from(new Set(allCasesData.map(c => c.general?.reporterInfo?.[0]?.email).filter(Boolean)));
  const uniqueProducts = Array.from(new Set(allCasesData.map(c => c.products?.[0]?.tradeName).filter(Boolean)));

  return (
    <div className="page-container">
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Intake Officer Workstation
            </h1>
            {autoSaveStatus && (
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: autoSaveStatus === 'Saving Draft...' ? 'var(--text-secondary)' : (autoSaveStatus === 'Draft Saved' ? 'var(--color-success)' : 'var(--color-danger)') }}>
                {autoSaveStatus}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Review incoming source documents, perform triage safety validation, and book-in pharmacovigilance files.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontWeight: 600, color: 'var(--primary)' }}>Role: Intake Person</span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.875rem' }}>
          <AlertTriangle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          {error}
        </div>
      )}

      {/* Tabs navigation bar */}
      <div className="tabs-container" style={{ flex: 1 }}>
        <div className="tab-nav-bar" style={{ padding: '0.5rem 0.5rem 0 0.5rem' }}>
          {[
            { id: 'dashboard', label: 'Intake Dashboard', icon: <Briefcase size={14} /> },
            { id: 'source', label: 'Source Document & OCR', icon: <UploadCloud size={14} /> },
            { id: 'bookin', label: 'Initial Case Entry', icon: <PlusCircle size={14} /> },
            { id: 'duplicates', label: 'Duplicate Search', icon: <Search size={14} /> },
            { id: 'triage', label: 'Case Triage / ICSR', icon: <FileCheck size={14} /> },
            { id: 'followUp', label: 'Follow-up & Attachments', icon: <Layers size={14} /> },
            { id: 'workflow', label: 'QC & Routing', icon: <ClipboardList size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="tab-panel" style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
          
          {/* ======================= 1. INTAKE DASHBOARD ======================= */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-cols-3">
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div className="kpi-info">
                    <h3>New Cases</h3>
                    <div className="kpi-val">{dashboardStats.newCases}</div>
                  </div>
                  <div className="kpi-icon"><UploadCloud size={20} /></div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                  <div className="kpi-info">
                    <h3>Pending Book-in</h3>
                    <div className="kpi-val">{dashboardStats.pendingBookIn}</div>
                  </div>
                  <div className="kpi-icon"><RefreshCw size={20} /></div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                  <div className="kpi-info">
                    <h3>Duplicate Review</h3>
                    <div className="kpi-val">{dashboardStats.duplicateReview}</div>
                  </div>
                  <div className="kpi-icon"><Search size={20} /></div>
                </div>
              </div>

              <div className="grid-cols-3" style={{ marginTop: '-0.75rem' }}>
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                  <div className="kpi-info">
                    <h3>Follow-up Cases</h3>
                    <div className="kpi-val">{dashboardStats.followUpCases}</div>
                  </div>
                  <div className="kpi-icon"><Layers size={20} /></div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid var(--text-muted)' }}>
                  <div className="kpi-info">
                    <h3>Returned Cases</h3>
                    <div className="kpi-val">{dashboardStats.returnedCases}</div>
                  </div>
                  <div className="kpi-icon"><CornerUpLeft size={20} /></div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #a855f7' }}>
                  <div className="kpi-info">
                    <h3>Assigned Cases</h3>
                    <div className="kpi-val">{dashboardStats.assignedCases}</div>
                  </div>
                  <div className="kpi-icon"><Briefcase size={20} /></div>
                </div>
              </div>

              <div className="grid-cols-2">
                {/* Today's work table */}
                <div className="table-container" style={{ padding: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>Today's Incoming Work</h4>
                  <table className="pv-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Source Doc</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Received At</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Doc_0821_US.pdf</strong></td>
                        <td>MedWatch Form</td>
                        <td><span className="role-badge role-qc">Ready</span></td>
                        <td>10:15 AM</td>
                      </tr>
                      <tr>
                        <td><strong>Email_WonderDrug.txt</strong></td>
                        <td>Email Body</td>
                        <td><span className="role-badge role-intake">New</span></td>
                        <td>11:32 AM</td>
                      </tr>
                      <tr>
                        <td><strong>CIOMS_0128.xml</strong></td>
                        <td>E2B XML</td>
                        <td><span className="role-badge role-intake">New</span></td>
                        <td>02:45 PM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Recent Activity Log */}
                <div className="table-container" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '1rem' }}>Recent Intake Activity</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '4px' }} />
                      <div>Uploaded Doc_0821_US.pdf and assigned to queue triage.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', marginTop: '4px' }} />
                      <div>Completed Duplicate Check query for patient initials 'JD'.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', marginTop: '4px' }} />
                      <div>Case booked-in: 2026US00001 forwarded to Data Entry queue.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= 2. SOURCE DOCUMENT & OCR ======================= */}
          {activeTab === 'source' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-cols-3">
                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label>Source Document Type</label>
                  <select className="form-control" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                    <option value="PDF">Upload PDF Document</option>
                    <option value="Email">Upload Email Body (.eml / .txt)</option>
                    <option value="Image">Upload Image (ECG, Scan)</option>
                    <option value="CIOMS">Upload CIOMS-I Form</option>
                    <option value="MedWatch">Upload MedWatch Form</option>
                    <option value="XML">Upload E2B XML Data</option>
                    <option value="Literature">Upload Literature Article</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Select & Upload</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="file" className="form-control" onChange={(e) => setSelectedFile(e.target.files[0])} />
                    <button className="btn btn-primary" onClick={() => {
                      if (!selectedFile) return alert("Please select a file first.");
                      const name = selectedFile.name;
                      setUploadedFiles([...uploadedFiles, { name, type: uploadType, size: (selectedFile.size / 1024).toFixed(1) + ' KB', date: new Date().toISOString().slice(0, 10), file: selectedFile }]);
                      setQcSourceAttached(true);
                      alert("Document uploaded and attached successfully!");
                    }}>
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center', backgroundColor: '#fafafa', color: 'var(--text-muted)' }}>
                <UploadCloud size={32} style={{ margin: '0 auto 0.5rem auto', color: 'var(--primary)' }} />
                Drag & Drop Intake case records here (.pdf, .xml, .tiff, .eml)
              </div>

              {/* Uploads Grid & OCR preview */}
              <div className="grid-cols-2">
                <div className="table-container" style={{ padding: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Attachments List Preview</h4>
                  <table className="pv-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFiles.map((file, idx) => (
                        <tr key={idx}>
                          <td>{file.name}</td>
                          <td><span className="role-badge role-qc" style={{ fontSize: '0.65rem' }}>{file.type}</span></td>
                          <td>{file.size}</td>
                          <td>
                            <button className="quick-btn" style={{ color: 'var(--color-danger)' }} onClick={() => {
                              const updated = [...uploadedFiles];
                              updated.splice(idx, 1);
                              setUploadedFiles(updated);
                            }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-container" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>OCR Extractor Preview</h4>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={runOCR} disabled={runningOcr}>
                      <RefreshCw size={12} className={runningOcr ? 'animate-spin' : ''} /> {runningOcr ? 'Scanning...' : 'Run OCR Parser'}
                    </button>
                  </div>
                  <textarea
                    rows="6"
                    className="form-control font-mono"
                    style={{ fontSize: '0.75rem', backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.75rem', borderRadius: '4px' }}
                    value={ocrText || '// Run OCR to extract minimum ICSR fields...'}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= 3. INITIAL CASE ENTRY (BOOK-IN) ======================= */}
          {activeTab === 'bookin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Case Details */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Case Specifications & Study Details</h4>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label>Receipt Date</label>
                    <input type="date" className="form-control" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Initial Receipt Date</label>
                    <input type="date" className="form-control" value={initialReceiptDate} onChange={(e) => setInitialReceiptDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Latest Receipt Date</label>
                    <input type="date" className="form-control" value={latestReceiptDate} onChange={(e) => setLatestReceiptDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Country of Occurrence</label>
                    <select className="form-control" value={country} onChange={(e) => setCountry(e.target.value)}>
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c} value={c.toUpperCase()}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Report Type</label>
                    <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                      <option value="Spontaneous">Spontaneous</option>
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="Literature">Literature</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Source Type</label>
                    <select className="form-control" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                      <option value="Spontaneous">Spontaneous</option>
                      <option value="Literature">Literature</option>
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="Regulatory Agency">Regulatory Agency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Serious / Non Serious</label>
                    <select className="form-control" value={seriousnessSerious} onChange={(e) => setSeriousnessSerious(e.target.value)}>
                      <option value="Yes">Serious</option>
                      <option value="No">Non-Serious</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Medically Confirmed</label>
                    <select className="form-control" value={medicallyConfirmed} onChange={(e) => setMedicallyConfirmed(e.target.value)}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Study Details in Triage Book-in */}
                {sourceType === 'Clinical Trial' && (
                  <div className="grid-cols-3" style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div className="form-group">
                      <label>Project ID</label>
                      <input type="text" className="form-control" placeholder="e.g. Cure All Study" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Study ID</label>
                      <input type="text" className="form-control" placeholder="e.g. 3001" value={studyId} onChange={(e) => setStudyId(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Center ID</label>
                      <input type="text" className="form-control" placeholder="e.g. CTR-092" value={centerId} onChange={(e) => setCenterId(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Literature Details */}
                {sourceType === 'Literature' && (
                  <div className="grid-cols-3" style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div className="form-group">
                      <label>Literature Title</label>
                      <input type="text" className="form-control" placeholder="e.g. A study of..." value={litTitle} onChange={(e) => setLitTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Author Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Smith J." value={litAuthor} onChange={(e) => setLitAuthor(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Publication Year</label>
                      <input type="text" className="form-control" placeholder="e.g. 2023" value={litYear} onChange={(e) => setLitYear(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Regulatory Details */}
                {sourceType === 'Regulatory Agency' && (
                  <div className="grid-cols-1" style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div className="form-group">
                      <label>Regulatory Report No</label>
                      <input type="text" className="form-control" placeholder="e.g. FDA-2023-12345" value={regReportNo} onChange={(e) => setRegReportNo(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="grid-cols-3" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Initial Justification</label>
                    <textarea rows="1" className="form-control" style={{ fontSize: '0.8rem' }} placeholder="Provide justification for case book-in..." value={initialJustification} onChange={(e) => setInitialJustification(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Case Priority</label>
                    <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="High">High (Expedited)</option>
                      <option value="Medium">Medium (Routine)</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reporter Details */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Reporter Details</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Reporter First Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Sarah" value={reporterFirstName} onChange={(e) => setReporterFirstName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Reporter Last Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Conner" value={reporterLastName} onChange={(e) => setReporterLastName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Reporter Type</label>
                    <select className="form-control" value={reporterType} onChange={(e) => setReporterType(e.target.value)}>
                      <option value="Physician">Physician</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Consumer">Consumer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>HCP / Consumer</label>
                    <select className="form-control" value={reporterHcp} onChange={(e) => setReporterHcp(e.target.value)}>
                      <option value="Yes">Healthcare Professional (HCP)</option>
                      <option value="No">Consumer / Patient Representative</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Reporter Country</label>
                    <select
                      className="form-control"
                      value={reporterCountry}
                      onChange={(e) => setReporterCountry(e.target.value)}
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c} value={c.toUpperCase()}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>State / Province</label>
                    <input type="text" className="form-control" placeholder="e.g. California" value={reporterState} onChange={(e) => setReporterState(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input type="text" className="form-control" placeholder="e.g. 90001" value={reporterPostalCode} onChange={(e) => setReporterPostalCode(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Intermediary</label>
                    <select className="form-control" value={reporterIntermediary} onChange={(e) => setReporterIntermediary(e.target.value)}>
                      <option value="None">None</option>
                      <option value="Manufacturer">Manufacturer</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="form-control" list="reporterEmails" value={reporterEmail} onChange={(e) => setReporterEmail(e.target.value)} />
                    <datalist id="reporterEmails">
                      {uniqueEmails.map(e => <option key={e} value={e} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="text" className="form-control" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Patient Demographics</h4>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label>Patient ID (Pt. ID)</label>
                    <input type="text" className="form-control" placeholder="e.g. Pt-330" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Patient Initials</label>
                    <input type="text" className="form-control" placeholder="J.D." value={patientInitials} onChange={(e) => setPatientInitials(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Patient DOB</label>
                    <input type="date" className="form-control" value={patientDob} onChange={(e) => setPatientDob(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select className="form-control" value={patientGender} onChange={(e) => setPatientGender(e.target.value)}>
                      <option value="Unknown">Unknown</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" className="form-control" placeholder="48" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Age Unit</label>
                    <select className="form-control" value={patientAgeUnit} onChange={(e) => setPatientAgeUnit(e.target.value)}>
                      <option value="Years">Years</option>
                      <option value="Months">Months</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Days">Days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product and Event */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Suspect Products & Adverse Events</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Suspect Product Name *</label>
                    <input type="text" className="form-control" list="productNames" placeholder="e.g. WonderDrug" value={productName} onChange={(e) => setProductName(e.target.value)} />
                    <datalist id="productNames">
                      {uniqueProducts.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Generic Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Amoxicillin" value={genericName} onChange={(e) => setGenericName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', height: '38px', gap: '0.5rem', marginTop: '1.75rem' }}>
                    <input type="checkbox" checked={isSuspectProduct} onChange={(e) => setIsSuspectProduct(e.target.checked)} />
                    <label style={{ margin: 0 }}>Suspect Product characterization</label>
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Event Description as Reported *</label>
                    <input type="text" className="form-control" placeholder="Severe chest pain and palpitations" value={reportedDescription} onChange={(e) => setReportedDescription(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Onset Date</label>
                    <input type="date" className="form-control" value={onsetDate} onChange={(e) => setOnsetDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Onset Time</label>
                    <input type="time" className="form-control" value={onsetTime} onChange={(e) => setOnsetTime(e.target.value)} />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Event Outcome</label>
                    <select className="form-control" value={eventOutcome} onChange={(e) => setEventOutcome(e.target.value)}>
                      <option value="Recovered">Recovered / Resolved</option>
                      <option value="Recovering">Recovering / Resolving</option>
                      <option value="Not Recovered">Not Recovered</option>
                      <option value="Fatal">Fatal</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================= 4. DUPLICATE SEARCH ======================= */}
          {activeTab === 'duplicates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Duplicate Search Query Settings</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" className="form-control" value={dupProduct} onChange={(e) => setDupProduct(e.target.value)} placeholder={productName || 'Search product...'} />
                  </div>
                  <div className="form-group">
                    <label>Adverse Event Description</label>
                    <input type="text" className="form-control" value={dupEvent} onChange={(e) => setDupEvent(e.target.value)} placeholder={reportedDescription || 'Search event...'} />
                  </div>
                  <div className="form-group">
                    <label>Patient Initials</label>
                    <input type="text" className="form-control" value={dupInitials} onChange={(e) => setDupInitials(e.target.value)} placeholder={patientInitials || 'Search initials...'} />
                  </div>
                </div>

                <div className="grid-cols-4" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" className="form-control" value={dupAge} onChange={(e) => setDupAge(e.target.value)} placeholder={patientAge || 'Age'} />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select className="form-control" value={dupGender} onChange={(e) => setDupGender(e.target.value)}>
                      <option value="Unknown">Unknown</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input type="text" className="form-control" value={dupCountry} onChange={(e) => setDupCountry(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Case Number (Direct Search)</label>
                    <input type="text" className="form-control" placeholder="REF-2026US..." />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button className="btn btn-primary" onClick={runDuplicateSearch} disabled={searching}>
                    <Search size={16} /> {searching ? 'Searching Case Database...' : 'Run Duplicate Check'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setDupProduct('');
                    setDupEvent('');
                    setDupInitials('');
                    setDuplicates([]);
                    setSearched(false);
                  }}>
                    Clear Queries
                  </button>
                </div>
              </div>

              {/* Duplicate results list */}
              <div className="table-container" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', margin: 0 }}>Duplicate Checking results</h4>
                  {searched && (
                    <span className={`role-badge ${duplicates.length > 0 ? 'role-qc' : 'role-intake'}`}>
                      {duplicates.length > 0 ? `${duplicates.length} Potential duplicates found` : 'No duplicates found'}
                    </span>
                  )}
                </div>

                {!searched ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Provide search parameters and run search queries.
                  </div>
                ) : duplicates.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#10b981' }}>
                    <CheckCircle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                    <strong>No duplicates found!</strong> You are clear to continue booking this as a New Case.
                    <div style={{ marginTop: '1rem' }}>
                      <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }} onClick={() => setActiveTab('triage')}>
                        Continue New Case Book-in
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--color-warning-bg)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-warning)', marginBottom: '1rem' }}>
                      <AlertTriangle size={16} />
                      Warning: Potential matches exist! You can either merge this as a Follow-up sequence to an existing case, or continue registering a new case.
                    </div>
                    <table className="pv-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Case Number</th>
                          <th>Suspect Product</th>
                          <th>Event (PT)</th>
                          <th>Country</th>
                          <th>Receipt Date</th>
                          <th>Workflow State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicates.map(d => (
                          <tr key={d.caseNumber}>
                            <td><strong>{d.caseNumber}</strong></td>
                            <td>{d.products[0]?.tradeName}</td>
                            <td>{d.events[0]?.coding?.pt || d.events[0]?.descriptionAsReported}</td>
                            <td>{d.general.country}</td>
                            <td>{d.general.initialReceiptDate}</td>
                            <td><span className="role-badge role-dataentry" style={{ fontSize: '0.65rem' }}>{d.workflowState}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                      <button className="btn btn-primary" onClick={() => {
                        const targetNum = duplicates[0].caseNumber;
                        alert(`Merging follow-up sequence into Case ${targetNum}. The system will assign version increments on data entry.`);
                        setFollowUpNum('1');
                        setCaseClassification('Duplicate');
                        setActiveTab('triage');
                      }}>
                        Merge Follow-up
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActiveTab('triage')}>
                        Ignore & Continue New Case
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================= 5. CASE TRIAGE / ICSR ======================= */}
          {activeTab === 'triage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Valid Case Criteria Checklist */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Valid Case Criteria (Minimum ICSR Criteria)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={hasPatient} onChange={(e) => { setHasPatient(e.target.checked); setQcPatient(e.target.checked); }} />
                    <span>Identifiable Patient</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={hasReporter} onChange={(e) => { setHasReporter(e.target.checked); setQcReporter(e.target.checked); }} />
                    <span>Identifiable Reporter</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={hasProduct} onChange={(e) => { setHasProduct(e.target.checked); setQcProduct(e.target.checked); }} />
                    <span>Suspect Product</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={hasEvent} onChange={(e) => { setHasEvent(e.target.checked); setQcEvent(e.target.checked); }} />
                    <span>Adverse Event</span>
                  </label>
                </div>

                {/* Validation Status message */}
                {hasPatient && hasReporter && hasProduct && hasEvent ? (
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: '0.85rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} /> <strong>Valid ICSR Case:</strong> All 4 minimum criteria met. Case is book-in ready.
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.85rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertOctagon size={16} /> <strong>Invalid Case:</strong> Missing minimum reporting criteria. Case cannot be booked in.
                  </div>
                )}
              </div>

              {/* Case Classification details */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1rem', color: 'var(--primary)' }}>Triage Evaluation, Seriousness & Causality</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.25rem' }}>
                  
                  {/* Left: Classification */}
                  <div className="form-group">
                    <label>Case Classification</label>
                    <select className="form-control" value={caseClassification} onChange={(e) => setCaseClassification(e.target.value)}>
                      <option value="Valid ICSR">Valid ICSR Case</option>
                      <option value="Invalid Case">Invalid Case (Lack of criteria)</option>
                      <option value="Follow-up Required">Follow-up Required</option>
                      <option value="Duplicate">Duplicate / Linked</option>
                      <option value="Literature">Literature Case</option>
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="Consumer">Consumer Report</option>
                    </select>
                  </div>

                  {/* Middle: Expanded Serious Criteria Checklist */}
                  <div className="form-group">
                    <label>Serious Criteria</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem', padding: '0.25rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.death} onChange={(e) => setEventSeriousness({ ...eventSeriousness, death: e.target.checked })} />
                        Death
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.hospitalized} onChange={(e) => setEventSeriousness({ ...eventSeriousness, hospitalized: e.target.checked })} />
                        Hospitalized
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.lifeThreatening} onChange={(e) => setEventSeriousness({ ...eventSeriousness, lifeThreatening: e.target.checked })} />
                        Life-threatening
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.disability} onChange={(e) => setEventSeriousness({ ...eventSeriousness, disability: e.target.checked })} />
                        Disability
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.congenitalAnomaly} onChange={(e) => setEventSeriousness({ ...eventSeriousness, congenitalAnomaly: e.target.checked })} />
                        Congenital Anomaly
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.medicallyImportant} onChange={(e) => setEventSeriousness({ ...eventSeriousness, medicallyImportant: e.target.checked })} />
                        Medically Significant
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.interventionRequired} onChange={(e) => setEventSeriousness({ ...eventSeriousness, interventionRequired: e.target.checked })} />
                        Intervention Required
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input type="checkbox" checked={eventSeriousness.caseNonSerious} onChange={(e) => setEventSeriousness({ ...eventSeriousness, caseNonSerious: e.target.checked })} />
                        Case is Non-Serious
                      </label>
                      <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', gridColumn: 'span 2' }}>
                        <input type="checkbox" checked={eventSeriousness.other} onChange={(e) => setEventSeriousness({ ...eventSeriousness, other: e.target.checked })} />
                        Other: <input type="text" className="form-control" style={{ display: 'inline-block', width: '120px', height: '22px', fontSize: '0.75rem', padding: '0 4px', marginLeft: '4px' }} placeholder="specify..." value={seriousnessOtherText} onChange={(e) => setSeriousnessOtherText(e.target.value)} />
                      </label>
                    </div>
                  </div>

                  {/* Right: Causality & Priority */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label>Reported Causality</label>
                      <select className="form-control" value={reportedCausality} onChange={(e) => setReportedCausality(e.target.value)}>
                        <option value="Almost Certain">Almost Certain</option>
                        <option value="Probable">Probable</option>
                        <option value="Possible">Possible</option>
                        <option value="Unlikely">Unlikely</option>
                        <option value="Unrelated">Unrelated</option>
                        <option value="Unable to Determine">Unable to Determine</option>
                      </select>
                    </div>
                    <div>
                      <label>Priority Assignment</label>
                      <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="Critical">Critical (e.g. Fatal / Spontaneous)</option>
                        <option value="High">High (7-day timeline)</option>
                        <option value="Medium">Medium (15-day timeline)</option>
                        <option value="Low">Low (Routine)</option>
                      </select>
                    </div>
                  </div>

                </div>

                <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Expedited Reporting Required?</label>
                    <select className="form-control" value={expeditedReporting} onChange={(e) => setExpeditedReporting(e.target.value)}>
                      <option value="Yes">Yes (Expedited 7/15 day reporting)</option>
                      <option value="No">No (Standard aggregate table)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================= 6. FOLLOW-UP & ATTACHMENTS ======================= */}
          {activeTab === 'followUp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Follow-up Management */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Follow-up Sequence Tracking</h4>
                <div className="grid-cols-3">
                  <div className="form-group">
                    <label>Follow-up Number</label>
                    <input type="number" className="form-control" value={followUpNum} onChange={(e) => setFollowUpNum(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Follow-up Receipt Date</label>
                    <input type="date" className="form-control" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Query Sent?</label>
                    <select className="form-control" value={querySent ? 'Yes' : 'No'} onChange={(e) => setQuerySent(e.target.value === 'Yes')}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Missing Critical Information</label>
                    <textarea rows="2" className="form-control" placeholder="e.g. missing daily dose details or onset time..." value={missingInfo} onChange={(e) => setMissingInfo(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Pending Follow-up Items</label>
                    <textarea rows="2" className="form-control" placeholder="Details of queries sent..." value={pendingItems} onChange={(e) => setPendingItems(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Advanced Attachments categorization */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Intake Categorized Attachments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justify: 'space-between', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <span>📁 Source Document / MedWatch Form</span>
                    <span style={{ color: '#0d9488' }}>Attached (1)</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <span>✉ Email correspondence</span>
                    <span style={{ color: '#64748b' }}>None</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <span>📄 Literature PDF Reference</span>
                    <span style={{ color: '#64748b' }}>None</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <span>🎙 Voice Recording Intake notes</span>
                    <span style={{ color: '#64748b' }}>None</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================= 7. QC & WORKFLOW ROUTING ======================= */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* QC Triage Checklist */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>QC Intake Checklist validation</h4>
                <div className="grid-cols-3" style={{ fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcPatient} onChange={(e) => setQcPatient(e.target.checked)} />
                      Patient criteria verified
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcReporter} onChange={(e) => setQcReporter(e.target.checked)} />
                      Reporter criteria verified
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcProduct} onChange={(e) => setQcProduct(e.target.checked)} />
                      Product criteria verified
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcEvent} onChange={(e) => setQcEvent(e.target.checked)} />
                      Event criteria verified
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcDuplicateChecked} onChange={(e) => setQcDuplicateChecked(e.target.checked)} />
                      Duplicate checked in DB
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcMandatoryCompleted} onChange={(e) => setQcMandatoryCompleted(e.target.checked)} />
                      Mandatory fields completed
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcSourceAttached} onChange={(e) => setQcSourceAttached(e.target.checked)} />
                      Source document uploaded
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcSeriousnessVerified} onChange={(e) => setQcSeriousnessVerified(e.target.checked)} />
                      Seriousness criteria verified
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qcBookInReady} onChange={(e) => setQcBookInReady(e.target.checked)} />
                      Book-In Ready
                    </label>
                  </div>
                </div>
              </div>

              {/* Routing specifications */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--primary)' }}>Routing & Workflow Routing</h4>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label>Current Workflow Stage</label>
                    <input type="text" className="form-control" value="Intake Triage" disabled />
                  </div>
                  <div className="form-group">
                    <label>Assigned To</label>
                    <input type="text" className="form-control" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Route To (Target Group Queue)</label>
                    <select className="form-control" value={routeTo} onChange={(e) => setRouteTo(e.target.value)}>
                      <option value="Data Entry">Data Entry</option>
                      <option value="Medical Review">Medical Review</option>
                      <option value="Quality Control">Quality Control</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label>Routing Comments</label>
                  <textarea rows="3" className="form-control" placeholder="Add comment for next group..." value={comments} onChange={(e) => setComments(e.target.value)} />
                </div>
              </div>

              {/* Bottom Action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                backgroundColor: '#f1f5f9',
                borderTop: '2px solid var(--primary)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => alert("Draft intake saved locally.")}>
                    <Save size={16} /> Save Draft
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleBookIn} disabled={booking}>
                    <CheckCircle size={16} /> {booking ? 'Processing...' : 'Book-In'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => alert("Intake case returned to supervisor queue.")}>
                    <CornerUpLeft size={16} /> Return
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => alert("Case file set to Hold status.")}>
                    <Ban size={16} /> Hold
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => alert("Intake case rejected (Lack of criteria).")}>
                    <AlertOctagon size={16} /> Reject
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-primary" style={{ backgroundColor: 'var(--color-info)', borderColor: 'var(--color-info)' }} onClick={() => {
                    setRouteTo('Data Entry');
                    handleBookIn();
                  }}>
                    <Send size={16} /> Send to Data Entry
                  </button>
                  <button type="button" className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }} onClick={() => {
                    setRouteTo('Medical Review');
                    handleBookIn();
                  }}>
                    <Send size={16} /> Send to Medical Review
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
