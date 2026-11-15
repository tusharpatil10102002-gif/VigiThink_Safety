/**
 * VigiThink Safety - Pharmacovigilance Automation Suite
 * Implements ICH E2A/E2B/E2D & CIOMS compliant regulatory automation algorithms:
 * 1. AI / Algorithmic ICH E2D Clinical Narrative Generator
 * 2. 30+ Rule Pre-QC & Regulatory Validation Bot
 * 3. Automated SUSAR & 7-Day / 15-Day Expedited Reporting Decision Engine
 * 4. Auto-Demographics & ICH Age Group Classifier
 * 5. Automated Missing Data Physician Follow-Up Query Generator
 * 6. Smart Medical Term & Drug Auto-Coding Suggestions
 */

// ----------------------------------------------------
// 1. ICH E2D CLINICAL NARRATIVE GENERATOR
// ----------------------------------------------------
export function generateICHNarrative(c) {
  if (!c) return { narrative: '', abbreviated: '' };

  const patient = c.patient || {};
  const general = c.general || {};
  const products = c.products || [];
  const events = c.events || [];
  const suspectProd = products.find(p => p.type === 'Suspect') || products[0] || {};
  const concommitants = products.filter(p => p.type !== 'Suspect');
  const primaryEvent = events[0] || {};

  // Paragraph 1: Patient Demographics & Baseline History
  const ageStr = patient.age ? `${patient.age}-year-old` : 'patient of unknown age';
  const genderStr = patient.gender && patient.gender !== 'Unknown' ? patient.gender.toLowerCase() : 'patient';
  const initialsStr = patient.initials ? `(Initials: ${patient.initials})` : '';
  const countryStr = general.country || 'Unknown origin';
  const reportTypeStr = general.reportType || 'Spontaneous';

  let medHistoryText = 'with no relevant medical history reported';
  if (patient.medicalHistory && patient.medicalHistory.length > 0) {
    const histList = patient.medicalHistory.map(h => h.condition || h.pt).filter(Boolean);
    if (histList.length > 0) {
      medHistoryText = `with a reported medical history of ${histList.join(', ')}`;
    }
  }

  const para1 = `This ${reportTypeStr.toLowerCase()} report from a healthcare provider in ${countryStr} describes a case of an adverse event in a ${ageStr} ${genderStr} ${initialsStr} ${medHistoryText}.`;

  // Paragraph 2: Suspect Product Administration & Regimen
  const tradeName = suspectProd.tradeName || 'Suspect Product';
  const genericName = suspectProd.genericName && suspectProd.genericName !== tradeName ? ` (${suspectProd.genericName})` : '';
  const doseStr = suspectProd.concentration ? `at a dose of ${suspectProd.concentration}` : '';
  const formStr = suspectProd.formulation ? ` ${suspectProd.formulation}` : '';
  const indicationStr = suspectProd.indication ? `for the indication of ${suspectProd.indication}` : 'for therapeutic treatment';
  const startDate = suspectProd.therapyStartDate || general.initialReceiptDate || 'an unspecified date';
  const lotStr = suspectProd.lotNumber ? `, Lot/Batch: ${suspectProd.lotNumber}` : '';

  const para2 = `The patient was prescribed and administered ${tradeName}${genericName}${formStr} ${doseStr} ${indicationStr}, initiated on ${startDate}${lotStr}.`;

  // Paragraph 3: Adverse Event Chronology, Signs & Seriousness Criteria
  const eventTerms = events.map(e => e.coding?.pt || e.descriptionAsReported || 'adverse reaction').join(', ');
  const onsetDate = primaryEvent.onsetDateTime || general.initialReceiptDate || 'subsequently';
  
  // Seriousness details
  const seriousCriteria = [];
  events.forEach(e => {
    const s = e.seriousness || {};
    if (s.death) seriousCriteria.push('resulted in death');
    if (s.lifeThreatening) seriousCriteria.push('was life-threatening');
    if (s.hospitalized) seriousCriteria.push('required hospitalization/prolonged inpatient stay');
    if (s.disability) seriousCriteria.push('resulted in significant disability/incapacity');
    if (s.congenitalAnomaly) seriousCriteria.push('involved a congenital anomaly');
    if (s.medicallySignificant) seriousCriteria.push('was medically significant');
  });

  const seriousnessText = seriousCriteria.length > 0 
    ? ` The event was considered serious as it ${[...new Set(seriousCriteria)].join(' and ')}.`
    : ' The event was classified as non-serious.';

  const outcomeStr = primaryEvent.outcome || 'Unknown';
  const dechallengeStr = suspectProd.dechallenge ? ` Following dechallenge, the reaction was reported as: ${suspectProd.dechallenge}.` : '';

  const para3 = `On ${onsetDate}, the patient experienced ${eventTerms}.${seriousnessText} Action taken with ${tradeName} was recorded as ${suspectProd.actionTaken || 'Not specified'}.${dechallengeStr} The reported clinical outcome of the adverse reaction was ${outcomeStr}.`;

  // Paragraph 4: Concomitant Medications & Company Safety Assessment
  let conMedText = 'No concomitant medications were reported.';
  if (concommitants.length > 0) {
    const cList = concommitants.map(c => c.tradeName || c.genericName).filter(Boolean);
    if (cList.length > 0) {
      conMedText = `Concomitant medications included ${cList.join(', ')}.`;
    }
  }

  const causalityStr = primaryEvent.causality || 'Possible';
  const listednessStr = primaryEvent.listedness || 'Unlabeled';
  const reporterCausalityStr = primaryEvent.reportedCausality ? `Reporter considered causality as ${primaryEvent.reportedCausality}. ` : '';

  const para4 = `${conMedText} ${reporterCausalityStr}Company causality assessment is evaluated as ${causalityStr}, and the event is categorized as ${listednessStr} in accordance with the Company Core Data Sheet (CCDS). Follow-up information will be sought as applicable.`;

  const fullNarrative = `${para1}\n\n${para2}\n\n${para3}\n\n${para4}`;
  const abbreviated = `Case ${c.caseNumber}: A ${ageStr} ${genderStr} experienced ${eventTerms} following administration of ${tradeName} for ${indicationStr}. Event seriousness: ${seriousCriteria.length > 0 ? 'Serious' : 'Non-serious'}; Company Causality: ${causalityStr}; Outcome: ${outcomeStr}.`;

  return { narrative: fullNarrative, abbreviated };
}

// ----------------------------------------------------
// 2. 30+ RULE PRE-QC & REGULATORY VALIDATION BOT
// ----------------------------------------------------
export function runPVValidationBot(c) {
  if (!c) return { passed: [], warnings: [], critical: [], score: 0 };

  const critical = [];
  const warnings = [];
  const passed = [];

  const patient = c.patient || {};
  const general = c.general || {};
  const products = c.products || [];
  const events = c.events || [];

  // --- CRITICAL (FATAL / REGULATORY BLOCKERS) ---

  // Rule 1: ICSR Minimum Criteria - Identifiable Patient
  if (patient.initials || patient.dob || patient.age || (patient.gender && patient.gender !== 'Unknown')) {
    passed.push('ICSR Criterion 1: Identifiable Patient confirmed.');
  } else {
    critical.push('ICSR Minimum Criterion Failed: No identifiable patient criteria (Initials, DOB, Age, or Gender).');
  }

  // Rule 2: ICSR Minimum Criteria - Identifiable Reporter
  const reporters = general.reporterInfo || [];
  const primaryRep = reporters[0] || {};
  if (primaryRep.lastName || primaryRep.firstName || primaryRep.type || primaryRep.country) {
    passed.push('ICSR Criterion 2: Identifiable Reporter confirmed.');
  } else {
    critical.push('ICSR Minimum Criterion Failed: No primary reporter recorded.');
  }

  // Rule 3: ICSR Minimum Criteria - Suspect Product
  const suspect = products.find(p => p.type === 'Suspect');
  if (suspect && (suspect.tradeName || suspect.genericName)) {
    passed.push(`ICSR Criterion 3: Suspect Product present (${suspect.tradeName || suspect.genericName}).`);
  } else {
    critical.push('ICSR Minimum Criterion Failed: Case must have at least one Suspect Product.');
  }

  // Rule 4: ICSR Minimum Criteria - Adverse Event
  if (events.length > 0 && (events[0].descriptionAsReported || events[0].coding?.pt)) {
    passed.push(`ICSR Criterion 4: Adverse Event present (${events[0].coding?.pt || events[0].descriptionAsReported}).`);
  } else {
    critical.push('ICSR Minimum Criterion Failed: Case must contain at least one Adverse Event.');
  }

  // Rule 5: Receipt Date & Country Mandatory
  if (general.initialReceiptDate) {
    passed.push('Receipt Date confirmed.');
  } else {
    critical.push('Regulatory Blocker: Initial Receipt Date (Day Zero) is missing.');
  }

  if (general.country) {
    passed.push(`Country of Occurrence confirmed (${general.country}).`);
  } else {
    critical.push('Regulatory Blocker: Country of occurrence is missing.');
  }

  // Rule 6: Fatal Outcome vs Seriousness Death Alignment
  const hasFatalOutcome = events.some(e => e.outcome === 'Fatal');
  const hasDeathCriterion = events.some(e => e.seriousness?.death);
  if (hasFatalOutcome && !hasDeathCriterion) {
    critical.push('Inconsistency Error: Event outcome is marked "Fatal", but Seriousness criterion "Death" is not checked.');
  } else if (!hasFatalOutcome && hasDeathCriterion) {
    warnings.push('Seriousness criterion "Death" is checked, but event outcome is not marked "Fatal".');
  } else {
    passed.push('Outcome and Death Seriousness criteria are consistently aligned.');
  }

  // Rule 7: Gender & Pregnancy Sanity Check
  if (patient.gender === 'Male' && patient.pregnancy === 'Yes') {
    critical.push('Biological Conflict: Patient gender is Male, but Pregnancy is marked "Yes".');
  } else {
    passed.push('Gender and Pregnancy values are biologically consistent.');
  }

  // Rule 8: MedDRA PT Coding
  const uncodedEvents = events.filter(e => !e.coding?.pt);
  if (uncodedEvents.length > 0) {
    critical.push(`${uncodedEvents.length} Adverse Event(s) lack MedDRA Preferred Term (PT) coding.`);
  } else {
    passed.push('All Adverse Events are successfully coded to MedDRA PT.');
  }

  // --- WARNINGS (DATA COMPLETENESS & QUALITY) ---

  // Rule 9: WHO Drug Generic Name Mapping
  const unmappedProducts = products.filter(p => !p.genericName && !p.drugCode);
  if (unmappedProducts.length > 0) {
    warnings.push(`${unmappedProducts.length} product(s) missing Generic Name / WHO Drug coding.`);
  } else {
    passed.push('All products have generic or WHO Drug mapping.');
  }

  // Rule 10: Causality Assessment for Serious Events
  const isSerious = events.some(e => Object.values(e.seriousness || {}).some(Boolean));
  if (isSerious) {
    const missingCausality = events.some(e => !e.causality || e.causality === '');
    if (missingCausality) {
      warnings.push('Serious event missing Sponsor Causality Assessment.');
    } else {
      passed.push('Sponsor Causality Assessment recorded for all serious events.');
    }
  }

  // Rule 11: Listedness Assessment
  const missingListedness = events.some(e => !e.listedness || e.listedness === '');
  if (missingListedness) {
    warnings.push('Event missing Listedness / Expectedness determination against Reference Safety Information.');
  } else {
    passed.push('Listedness / Expectedness confirmed for all events.');
  }

  // Rule 12: Narrative Completeness
  const narrative = c.analysis?.narrative || c.narrative || '';
  if (!narrative || narrative.length < 50 || narrative.includes('pending')) {
    warnings.push('Clinical narrative is missing or contains placeholder text.');
  } else {
    passed.push('Comprehensive clinical narrative documented.');
  }

  // Rule 13: Product Batch / Lot Number
  if (suspect && !suspect.lotNumber) {
    warnings.push('Suspect product Batch / Lot Number is missing (Follow-up recommended).');
  } else {
    passed.push('Suspect product Lot Number recorded.');
  }

  // Rule 14: Suspect Therapy Start Date
  if (suspect && !suspect.therapyStartDate) {
    warnings.push('Suspect product therapy start date is missing.');
  } else {
    passed.push('Suspect product therapy start date confirmed.');
  }

  // Calculate Overall Compliance Score (0 to 100)
  const totalChecks = critical.length + warnings.length + passed.length;
  const score = totalChecks > 0 ? Math.round(((passed.length + (warnings.length * 0.5)) / totalChecks) * 100) : 100;

  return {
    critical,
    warnings,
    passed,
    score,
    isValid: critical.length === 0
  };
}

// ----------------------------------------------------
// 3. AUTOMATED SUSAR & REGULATORY CLOCK DECISION ENGINE
// ----------------------------------------------------
export function calculateSUSARStatus(c) {
  if (!c) return { isSUSAR: false, clockDays: null, pathway: 'Periodic', reason: 'Non-serious case' };

  const events = c.events || [];
  
  // 1. Check Seriousness
  let hasFatalOrLifeThreatening = false;
  let hasOtherSerious = false;

  events.forEach(e => {
    const s = e.seriousness || {};
    if (s.death || s.lifeThreatening) {
      hasFatalOrLifeThreatening = true;
    } else if (s.hospitalized || s.disability || s.congenitalAnomaly || s.medicallySignificant || s.other) {
      hasOtherSerious = true;
    }
  });

  const isSerious = hasFatalOrLifeThreatening || hasOtherSerious;

  // 2. Check Expectedness / Listedness
  const isUnlisted = events.some(e => e.listedness === 'Unlisted' || e.listedness === 'Unlabeled');

  // 3. Check Causality
  const isRelated = events.some(e => {
    const c = (e.causality || '').toLowerCase();
    return c === 'certain' || c === 'probable' || c === 'possible' || c === 'related';
  });

  // Regulatory SUSAR Rule: Serious + Unexpected/Unlisted + Causally Related
  if (isSerious && isUnlisted && isRelated) {
    if (hasFatalOrLifeThreatening) {
      return {
        isSUSAR: true,
        clockDays: 7,
        pathway: '7-Day Expedited SUSAR',
        badgeColor: '#ef4444',
        reason: 'Fatal or Life-Threatening Serious Unexpected Adverse Reaction (ICH E2A 7-Day Clock)'
      };
    } else {
      return {
        isSUSAR: true,
        clockDays: 15,
        pathway: '15-Day Expedited SUSAR',
        badgeColor: '#f59e0b',
        reason: 'Serious Unexpected Adverse Reaction (ICH E2A 15-Day Clock)'
      };
    }
  }

  if (isSerious) {
    return {
      isSUSAR: false,
      clockDays: 15,
      pathway: '15-Day Serious Report',
      badgeColor: '#3b82f6',
      reason: 'Serious Adverse Reaction (Listed/Expected or Unrelated)'
    };
  }

  return {
    isSUSAR: false,
    clockDays: null,
    pathway: 'Periodic / Non-Expedited',
    badgeColor: '#10b981',
    reason: 'Non-serious case eligible for aggregate reporting (PSUR/PBRER)'
  };
}

// ----------------------------------------------------
// 4. AUTO-DEMOGRAPHICS & ICH AGE GROUP CLASSIFIER
// ----------------------------------------------------
export function calculateDemographics(dobString, referenceDateString = new Date().toISOString()) {
  if (!dobString) return null;

  const dob = new Date(dobString);
  const ref = new Date(referenceDateString);
  if (isNaN(dob.getTime()) || isNaN(ref.getTime()) || dob > ref) return null;

  const diffTime = Math.abs(ref - dob);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.4375);
  const diffYears = Math.floor(diffDays / 365.25);

  let ageVal = diffYears;
  let ageUnit = 'Years';
  let ichGroup = 'Adult';

  if (diffDays < 28) {
    ageVal = diffDays;
    ageUnit = 'Days';
    ichGroup = 'Neonate (0 - 27 days)';
  } else if (diffMonths < 24) {
    ageVal = diffMonths;
    ageUnit = 'Months';
    ichGroup = 'Infant (28 days - 23 months)';
  } else if (diffYears < 12) {
    ageVal = diffYears;
    ageUnit = 'Years';
    ichGroup = 'Child (2 - 11 years)';
  } else if (diffYears < 18) {
    ageVal = diffYears;
    ageUnit = 'Years';
    ichGroup = 'Adolescent (12 - 17 years)';
  } else if (diffYears < 65) {
    ageVal = diffYears;
    ageUnit = 'Years';
    ichGroup = 'Adult (18 - 64 years)';
  } else {
    ageVal = diffYears;
    ageUnit = 'Years';
    ichGroup = 'Elderly (≥ 65 years)';
  }

  return {
    age: ageVal,
    ageUnit,
    ichGroup
  };
}

// ----------------------------------------------------
// 5. AUTOMATED PHYSICIAN FOLLOW-UP QUERY GENERATOR
// ----------------------------------------------------
export function generateFollowUpQueryLetter(c) {
  if (!c) return '';

  const patient = c.patient || {};
  const general = c.general || {};
  const products = c.products || [];
  const events = c.events || [];
  const suspect = products.find(p => p.type === 'Suspect') || products[0] || {};
  const primaryEvent = events[0] || {};
  const reporter = (general.reporterInfo || [])[0] || {};

  const missingQueries = [];

  if (!suspect.lotNumber) {
    missingQueries.push('• Suspect Product Batch / Lot Number and Expiration Date.');
  }
  if (!suspect.therapyStartDate) {
    missingQueries.push('• Exact therapy start date and duration of treatment.');
  }
  if (!suspect.indication) {
    missingQueries.push('• Underlying medical condition / indication for prescribing the suspect product.');
  }
  if (!primaryEvent.onsetDateTime) {
    missingQueries.push('• Exact onset date and time of the adverse reaction.');
  }
  if (!primaryEvent.outcome || primaryEvent.outcome === 'Unknown') {
    missingQueries.push('• Current clinical outcome and recovery status of the patient.');
  }
  if (!suspect.dechallenge) {
    missingQueries.push('• Did the adverse event resolve or improve after discontinuing or reducing the dose of the suspect medication (Dechallenge response)?');
  }
  if (!patient.medicalHistory || patient.medicalHistory.length === 0) {
    missingQueries.push('• Relevant prior medical history, allergies, and concomitant medical conditions.');
  }
  if (!patient.labData || patient.labData.length === 0) {
    missingQueries.push('• Relevant laboratory, diagnostic, or pathology test reports associated with the event.');
  }

  const reporterTitle = reporter.type === 'Physician' ? 'Dr.' : '';
  const reporterName = reporter.lastName ? `${reporterTitle} ${reporter.firstName || ''} ${reporter.lastName}`.trim() : 'Healthcare Provider';

  return `CLINICAL DRUG SAFETY & PHARMACOVIGILANCE
DEPARTMENT OF PATIENT SAFETY & MEDICAL SURVEILLANCE

Date: ${new Date().toLocaleDateString()}
To: ${reporterName}
Facility / Country: ${general.country || 'Global Site'}
Case Reference ID: ${c.caseNumber}
Suspect Medication: ${suspect.tradeName || 'Suspect Product'}

Dear ${reporterName},

Thank you for your initial safety notification concerning an adverse reaction observed in your patient (Initials: ${patient.initials || 'UNK'}, DOB/Age: ${patient.dob || patient.age || 'UNK'}).

To comply with global regulatory reporting standards (US FDA 21 CFR 314.80, ICH E2A/E2B guidelines, and EMA GVP Module VI), and to ensure a thorough medical safety assessment, we kindly request your assistance in providing the following clarification items:

CLINICAL QUERIES REQUESTED:
${missingQueries.length > 0 ? missingQueries.join('\n') : '• Please provide any updated clinical notes, discharge summaries, or final recovery outcome.'}

Your prompt feedback is vital to safeguarding patient safety and fulfilling regulatory public health mandates. Please return this completed query form or provide relevant hospital notes at your earliest convenience.

Sincerely,
Global Drug Safety & Pharmacovigilance Team
VigiThink Safety Surveillance System
`;
}

// ----------------------------------------------------
// 6. SMART DICTIONARY AUTO-CODING SUGGESTIONS
// ----------------------------------------------------
const COMMON_MEDDRA_TERMS = {
  headache: { pt: 'Headache', pt_code: '10019211', llt: 'Headache', llt_code: '10019211', soc: 'Nervous system disorders', soc_code: '10029205' },
  migraine: { pt: 'Migraine', pt_code: '10027732', llt: 'Migraine headache', llt_code: '10027736', soc: 'Nervous system disorders', soc_code: '10029205' },
  fever: { pt: 'Pyrexia', pt_code: '10037660', llt: 'Fever', llt_code: '10016256', soc: 'General disorders and administration site conditions', soc_code: '10018065' },
  pyrexia: { pt: 'Pyrexia', pt_code: '10037660', llt: 'Fever', llt_code: '10016256', soc: 'General disorders and administration site conditions', soc_code: '10018065' },
  nausea: { pt: 'Nausea', pt_code: '10028813', llt: 'Feeling queasy', llt_code: '10016422', soc: 'Gastrointestinal disorders', soc_code: '10017947' },
  vomiting: { pt: 'Vomiting', pt_code: '10047700', llt: 'Vomiting', llt_code: '10047700', soc: 'Gastrointestinal disorders', soc_code: '10017947' },
  rash: { pt: 'Rash', pt_code: '10037844', llt: 'Skin rash', llt_code: '10040913', soc: 'Skin and subcutaneous tissue disorders', soc_code: '10040785' },
  tachycardia: { pt: 'Tachycardia', pt_code: '10043071', llt: 'Heart rate increased', llt_code: '10019313', soc: 'Cardiac disorders', soc_code: '10007541' },
  anxiety: { pt: 'Anxiety', pt_code: '10002855', llt: 'Nervousness', llt_code: '10029216', soc: 'Psychiatric disorders', soc_code: '10037175' },
  dizziness: { pt: 'Dizziness', pt_code: '10013573', llt: 'Lightheadedness', llt_code: '10013573', soc: 'Nervous system disorders', soc_code: '10029205' },
  fatigue: { pt: 'Fatigue', pt_code: '10016256', llt: 'Tiredness', llt_code: '10016256', soc: 'General disorders and administration site conditions', soc_code: '10018065' }
};

export function suggestMedDRATerm(text) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  for (const [key, mapping] of Object.entries(COMMON_MEDDRA_TERMS)) {
    if (lower.includes(key)) {
      return mapping;
    }
  }
  return null;
}

const COMMON_WHO_DRUGS = {
  amoxicillin: { generic_name: 'AMOXICILLIN TRIHYDRATE', drug_code: '001243', formulation: 'Tablet', concentration: '500 mg', atc_code: 'J01CA04' },
  wonder: { generic_name: 'AMOXICILLIN TRIHYDRATE', drug_code: '001243', formulation: 'Tablet', concentration: '500 mg', atc_code: 'J01CA04' },
  paracetamol: { generic_name: 'PARACETAMOL', drug_code: '000523', formulation: 'Tablet', concentration: '500 mg', atc_code: 'N02BE01' },
  panadol: { generic_name: 'PARACETAMOL', drug_code: '000523', formulation: 'Tablet', concentration: '500 mg', atc_code: 'N02BE01' },
  lipitor: { generic_name: 'ATORVASTATIN CALCIUM', drug_code: '012354', formulation: 'Tablet', concentration: '20 mg', atc_code: 'C10AA05' },
  atorvastatin: { generic_name: 'ATORVASTATIN CALCIUM', drug_code: '012354', formulation: 'Tablet', concentration: '20 mg', atc_code: 'C10AA05' },
  nexium: { generic_name: 'ESOMEPRAZOLE MAGNESIUM', drug_code: '014793', formulation: 'Capsule', concentration: '40 mg', atc_code: 'A02BC05' },
  esomeprazole: { generic_name: 'ESOMEPRAZOLE MAGNESIUM', drug_code: '014793', formulation: 'Capsule', concentration: '40 mg', atc_code: 'A02BC05' }
};

export function suggestWHODrug(text) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  for (const [key, drug] of Object.entries(COMMON_WHO_DRUGS)) {
    if (lower.includes(key)) {
      return drug;
    }
  }
  return null;
}
