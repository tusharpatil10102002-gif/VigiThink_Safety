import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, ShieldAlert, Edit2, X } from 'lucide-react';

export default function AdminConsole() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Data Entry');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const method = editingUserId ? 'PUT' : 'POST';
      const url = editingUserId ? `${API_BASE_URL}/users/${editingUserId}` : `${API_BASE_URL}/users`;
      
      const bodyData = { username, firstName, lastName, role, email };
      if (password) bodyData.password = password;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save user');
      }

      setSuccess(`User ${data.username} ${editingUserId ? 'updated' : 'created'} successfully.`);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('Data Entry');
    setEditingUserId(null);
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldAlert size={28} className="text-danger" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Vigithink Safety Console</h1>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          {success}
        </div>
      )}

      <div className="grid-cols-2">
        {/* User creation form */}
        <div className="table-container" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingUserId ? <Edit2 size={20} className="text-primary" /> : <UserPlus size={20} className="text-secondary" />} 
              {editingUserId ? 'Edit User Account' : 'Add New Student User'}
            </span>
            {editingUserId && (
              <button className="quick-btn" onClick={resetForm} title="Cancel Edit" type="button">
                <X size={16} />
              </button>
            )}
          </h3>

          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div>
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="e.g. john.doe@vigithink.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>{editingUserId ? 'New Password (Optional)' : 'Temporary Password'}</label>
                <input
                  type="password"
                  placeholder={editingUserId ? 'Leave blank to keep current' : 'Minimum 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  required={!editingUserId}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-control"
                required
              >
                <option value="Intake">Intake (Triage / Case Book-in)</option>
                <option value="Data Entry">Data Entry Associate</option>
                <option value="Quality Control">Quality Control (QC Review)</option>
                <option value="Medical Review">Medical Reviewer (MR)</option>
                <option value="Submission">Submission Manager</option>
                <option value="Admin">System Administrator (Console)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              {editingUserId ? 'Update User Account' : 'Add User Account'}
            </button>
          </form>
        </div>

        {/* Existing users list */}
        <div className="table-container">
          <div className="table-header-bar">
            <h3 className="table-title">Configured System Accounts</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {users.length} accounts configured
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '430px' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading user list...
              </div>
            ) : (
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>System Role</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          @{u.username} • {u.email}
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${u.role.toLowerCase().replace(' ', '')}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="quick-btn"
                          style={{ color: 'var(--primary)' }}
                          onClick={() => handleEditClick(u)}
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="quick-btn"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.username === 'admin'}
                          title={u.username === 'admin' ? "Cannot delete primary system admin" : "Delete user"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
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
