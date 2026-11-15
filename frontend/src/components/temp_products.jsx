
import React from 'react';
export function Test(props) {
  const { c, activeProductIdx, isEditable, isBlinded, updateProd, setCase } = props;
  return (
    <div>
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
                            <input type="text" className="form-control" value={isBlinded ? '✦✦✦✦✦ (BLINDED)' : prod.tradeName} readOnly placeholder="Search WHO Drug..." />
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
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Germany">Germany</option>
                            <option value="Japan">Japan</option>
                            <option value="India">India</option>
                            <option value="Canada">Canada</option>
                            <option value="France">France</option>
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
                })()}
            </div>
    </div>
  );
}
