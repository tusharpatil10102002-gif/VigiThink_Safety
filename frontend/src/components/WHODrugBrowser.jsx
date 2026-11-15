import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

export default function WHODrugBrowser({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      handleSearch('');
    }
  }, [isOpen]);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dict/who-drugs?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Error fetching WHO drugs:', err);
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
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>WHO Drug Dictionary Search</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Search by Trade Name or Generic Name (e.g. Nexium, Amoxicillin)..."
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
              Loading products...
            </div>
          ) : (
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Trade Name</th>
                    <th>Generic / Ingredient Name</th>
                    <th>Drug Code</th>
                    <th>Formulation</th>
                    <th>ATC Code</th>
                    <th>Manufacturer</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No drugs found. Enter a search query.
                      </td>
                    </tr>
                  ) : (
                    results.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(item)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedItem === item ? 'var(--primary-glow)' : 'transparent',
                          fontWeight: selectedItem === item ? '600' : 'normal'
                        }}
                      >
                        <td><strong>{item.trade_name}</strong></td>
                        <td>{item.generic_name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.drug_code}</td>
                        <td>{item.formulation} ({item.concentration})</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.atc_code}</td>
                        <td>{item.manufacturer}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedItem && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.8125rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Selected Drug:</span>{' '}
              <strong>{selectedItem.trade_name}</strong> ({selectedItem.generic_name}) - {selectedItem.formulation}
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
            <Check size={16} /> Select Drug
          </button>
        </div>
      </div>
    </div>
  );
}
