import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

export default function MedDRABrowser({ isOpen, onClose, onSelect, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dict/meddra?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Error fetching MedDRA terms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2>MedDRA Browser (v24.0)</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Search by term name, code or synonym (e.g. Headache)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search className="search-icon-inside" />
            </div>
            <button className="btn btn-primary" onClick={() => handleSearch(query)}>
              Search
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Loading MedDRA terms...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="meddra-header">
                <div>Low Level Term (LLT)</div>
                <div>Preferred Term (PT)</div>
                <div>High Level Term (HLT)</div>
                <div>HL Group Term (HLGT)</div>
                <div>Sys Organ Class (SOC)</div>
              </div>
              <div className="meddra-search-results">
                {results.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No terms found. Enter a query and press Search.
                  </div>
                ) : (
                  results.map((item, idx) => (
                    <div
                      key={idx}
                      className={`meddra-row ${selectedItem === item ? 'selected' : ''}`}
                      onClick={() => handleRowClick(item)}
                    >
                      <div>
                        <strong>{item.llt}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({item.llt_code})</span>
                      </div>
                      <div>
                        {item.pt} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({item.pt_code})</span>
                      </div>
                      <div>{item.hlt}</div>
                      <div>{item.hlgt}</div>
                      <div>{item.soc}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedItem && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              lineHeight: '1.5'
            }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Hierarchy Selected:</h4>
              <div><strong>System Organ Class (SOC):</strong> {selectedItem.soc} ({selectedItem.soc_code})</div>
              <div><strong>High Level Group Term (HLGT):</strong> {selectedItem.hlgt} ({selectedItem.hlgt_code})</div>
              <div><strong>High Level Term (HLT):</strong> {selectedItem.hlt} ({selectedItem.hlt_code})</div>
              <div><strong>Preferred Term (PT):</strong> {selectedItem.pt} ({selectedItem.pt_code})</div>
              <div><strong>Low Level Term (LLT):</strong> {selectedItem.llt} ({selectedItem.llt_code})</div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!selectedItem}
            onClick={handleConfirm}
          >
            <Check size={16} /> Select Term
          </button>
        </div>
      </div>
    </div>
  );
}
