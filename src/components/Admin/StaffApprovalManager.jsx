import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { Modal } from '../Common/Modal';
import { CheckCircle, XCircle, UserPlus, Trash2, ShieldCheck, Mail, Edit, Key } from 'lucide-react';

export const StaffApprovalManager = () => {
  const [staff, setStaff] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    role: 'chef'
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'chef',
    status: 'approved',
    password: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStaff = () => {
    fetchAPI('/auth/staff')
      .then(data => setStaff(data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleUpdateStatus = async (staffId, status) => {
    try {
      await fetchAPI(`/auth/staff/${staffId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user '${username}'?`)) return;
    try {
      await fetchAPI(`/auth/users/${userId}`, {
        method: 'DELETE'
      });
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchAPI('/auth/add-user', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      setSuccessMsg(res.message);
      setNewUser({ username: '', email: '', name: '', password: '', role: 'chef' });
      setIsAddUserOpen(false);
      loadStaff();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleOpenEditModal = (userObj) => {
    setEditingUser(userObj);
    setEditFormData({
      name: userObj.name || '',
      email: userObj.email || '',
      username: userObj.username || '',
      role: userObj.role || 'chef',
      status: userObj.status || 'approved',
      password: ''
    });
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchAPI(`/auth/staff/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setSuccessMsg(res.message);
      setEditingUser(null);
      loadStaff();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck style={{ color: 'var(--brand-primary)' }} />
            Main Admin Governance & User Accounts
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage Admin, Chef & Cashier/Waiter usernames, passwords, emails & credentials
          </span>
        </div>

        <button onClick={() => setIsAddUserOpen(!isAddUserOpen)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <UserPlus size={16} />
          <span>Add Admin / Staff</span>
        </button>
      </div>

      {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--danger-bg)', borderRadius: '6px', fontSize: '0.85rem' }}>{errorMsg}</div>}
      {successMsg && <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--success-bg)', borderRadius: '6px', fontSize: '0.85rem' }}>{successMsg}</div>}

      {/* Add User Form Drawer/Modal */}
      {isAddUserOpen && (
        <div className="glass-card animate-slide-up" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--brand-primary)' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Add New Admin or Staff User</h3>

          <form onSubmit={handleCreateUserSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Full Name</label>
              <input type="text" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="input-field" placeholder="e.g. Alex Smith" />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Username</label>
              <input type="text" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="input-field" placeholder="e.g. admin2 or chef3" />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Email Address</label>
              <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="input-field" placeholder="user@aamantran.com" />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Password</label>
              <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="input-field" placeholder="••••••••" />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Role</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="input-field">
                <option value="chef">Kitchen / Chef</option>
                <option value="cashier">Waiter / Floor Staff</option>
                <option value="admin">Owner / Admin</option>
                <option value="cashier">Billing / Cashier</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save User</button>
              <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal isOpen={Boolean(editingUser)} onClose={() => setEditingUser(null)} title={`Edit Staff: ${editingUser.name}`}>
          <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Full Name:</label>
              <input type="text" required value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="input-field" />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Email Address:</label>
              <input type="email" required value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="input-field" />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Username:</label>
              <input type="text" required value={editFormData.username} onChange={e => setEditFormData({ ...editFormData, username: e.target.value })} className="input-field" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Role:</label>
                <select value={editFormData.role} onChange={e => setEditFormData({ ...editFormData, role: e.target.value })} className="input-field" disabled={editingUser.is_main_admin === 1}>
                  <option value="chef">Kitchen / Chef</option>
                  <option value="cashier">Waiter / Floor Staff</option>
                  <option value="admin">Owner / Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Status:</label>
                <select value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })} className="input-field" disabled={editingUser.is_main_admin === 1}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Reset Password (Optional):</label>
              <input type="password" value={editFormData.password} onChange={e => setEditFormData({ ...editFormData, password: e.target.value })} className="input-field" placeholder="Leave blank to keep existing password" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>Update Staff Member</button>
              <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary btn-lg">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* User Accounts Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Name & Email</th>
              <th style={{ padding: '0.75rem' }}>Username</th>
              <th style={{ padding: '0.75rem' }}>Role</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 700 }}>
                    {s.name} {s.is_main_admin === 1 && <span className="badge badge-dinein" style={{ fontSize: '0.65rem', marginLeft: '0.3rem' }}>MAIN ADMIN</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Mail size={12} /> {s.email || `${s.username}@aamantran.com`}
                  </div>
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{s.username}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge-dinein" style={{ textTransform: 'capitalize' }}>
                    {s.role === 'cashier' ? 'Cashier / Waiter' : s.role}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {s.status === 'approved' && <span className="badge badge-veg">✓ Approved</span>}
                  {s.status === 'pending' && <span className="badge badge-packing">⏳ Pending</span>}
                  {s.status === 'rejected' && <span className="badge badge-nonveg">✕ Rejected</span>}
                  {s.status === 'deactivated' && <span className="badge" style={{ background: 'var(--bg-surface-elevated)' }}>Deactivated</span>}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* Edit Staff Details & Password Button */}
                    <button onClick={() => handleOpenEditModal(s)} className="btn btn-secondary btn-sm" title="Edit Credentials & Details" style={{ padding: '0.3rem 0.5rem' }}>
                      <Edit size={14} /> Edit
                    </button>

                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(s.id, 'approved')} className="btn btn-success btn-sm">
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button onClick={() => handleUpdateStatus(s.id, 'rejected')} className="btn btn-danger btn-sm">
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}

                    {s.status === 'approved' && s.is_main_admin !== 1 && (
                      <button onClick={() => handleUpdateStatus(s.id, 'deactivated')} className="btn btn-secondary btn-sm">
                        Deactivate
                      </button>
                    )}

                    {s.status === 'deactivated' && (
                      <button onClick={() => handleUpdateStatus(s.id, 'approved')} className="btn btn-success btn-sm">
                        Re-Approve
                      </button>
                    )}

                    {/* Delete user button for non-main admins */}
                    {s.is_main_admin !== 1 && (
                      <button onClick={() => handleDeleteUser(s.id, s.username)} className="btn btn-danger btn-sm" title="Remove User Account" style={{ padding: '0.3rem 0.5rem' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
