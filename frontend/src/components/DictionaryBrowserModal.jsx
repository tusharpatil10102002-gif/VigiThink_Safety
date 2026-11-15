import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle, Database } from 'lucide-react';

export default function DictionaryBrowserModal({ isOpen, onClose, type, onSelect }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'meddra' 
        ? `${API_BASE_URL}/dict/meddra?q=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/dict/who-drugs?q=${encodeURIComponent(search)}`;
        
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Dictionary search failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', height: '80vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
              {type === 'meddra' ? 'MedDRA Browser' : 'WHO Drug Dictionary'}
            </h3>
          </div>
          <button className="quick-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder={type === 'meddra' ? "Search for SOC, PT, LLT..." : "Search for Trade Name or Generic Name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Search size={16} /> Search
            </button>
          </form>

          <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Searching dictionary...</div>
            ) : results.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No terms found. Enter a search term above.</div>
            ) : (
              <table className="pv-table">
                <thead>
                  <tr>
                    {type === 'meddra' ? (
                      <>
                        <th>LLT (Lowest Level Term)</th>
                        <th>PT (Preferred Term)</th>
                        <th>SOC (System Organ Class)</th>
                        <th>Action</th>
                      </>
                    ) : (
                      <>
                        <th>Trade Name</th>
                        <th>Generic Name</th>
                        <th>ATC Class</th>
                        <th>Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, idx) => (
                    <tr key={idx}>
                      {type === 'meddra' ? (
                        <>
                          <td>{item.llt}</td>
                          <td><strong>{item.pt}</strong></td>
                          <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.soc}</span></td>
                          <td>
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onSelect(item)}>
                              Select
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td><strong>{item.trade_name}</strong></td>
                          <td>{item.generic_name}</td>
                          <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.atc_description}</span></td>
                          <td>
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onSelect(item)}>
                              Select
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
