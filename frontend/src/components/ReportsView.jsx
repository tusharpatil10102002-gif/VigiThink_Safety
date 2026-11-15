import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Download, FileText, Database, ShieldAlert } from 'lucide-react';

export default function ReportsView() {
  const [downloading, setDownloading] = useState(false);

  const downloadLineListing = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reports/linelisting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to generate report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LineListing_Report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading report: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Database size={28} color="var(--primary)" />
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', margin: 0, color: 'var(--primary)' }}>
            Database Reports & Extraction
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Generate aggregate safety reports, line listings, and compliance metrics.
          </p>
        </div>
      </div>

      <div className="grid-cols-2">
        
        {/* Line Listing Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-glow)', borderRadius: '8px', color: 'var(--primary)' }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Global Line Listing (CSV)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aggregate tabular data for all cases</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
            Extract a comprehensive CSV containing case numbers, receipt dates, suspect products, adverse events (PT), seriousness, and current workflow states across the entire database.
          </p>
          <button className="btn btn-primary" onClick={downloadLineListing} disabled={downloading} style={{ width: '100%', marginTop: 'auto' }}>
            <Download size={16} /> {downloading ? 'Generating CSV...' : 'Extract Line Listing'}
          </button>
        </div>

        {/* Future compliance card */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(217, 119, 6, 0.1)', borderRadius: '8px', color: 'var(--color-warning)' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Compliance Metrics (PDF)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submission timeliness & KPI tracking</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
            View late reporting metrics, average processing time per workflow state, and individual user productivity (cases processed per day).
          </p>
          <button className="btn btn-secondary" disabled style={{ width: '100%', marginTop: 'auto' }}>
            Coming Soon
          </button>
        </div>

      </div>
    </div>
  );
}
