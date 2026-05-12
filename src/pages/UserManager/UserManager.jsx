import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Navigation from '../../components/Navigation/Navigation';
import './UserManager.css';

export default function UserManager() {
  // State for user list
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modal and form
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Form state
  const [form, setForm] = useState({
    accountID: null,
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    username: '',
    role: 'Cashier',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  // Fetch all active users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field) => (event) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (formError) setFormError(null);
  };

  // Validate form
  const validateForm = () => {
    if (!form.firstName.trim()) {
      setFormError('First name is required');
      return false;
    }
    if (!form.lastName.trim()) {
      setFormError('Last name is required');
      return false;
    }
    if (!form.phoneNumber.trim()) {
      setFormError('Phone number is required');
      return false;
    }

    // Validate phone number (10+ digits)
    const phoneDigits = form.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setFormError('Phone number must have at least 10 digits');
      return false;
    }

    if (!form.username.trim()) {
      setFormError('Username is required');
      return false;
    }

    // Validate username (alphanumeric, min 3 chars)
    if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username)) {
      setFormError('Username must be alphanumeric and at least 3 characters');
      return false;
    }

    if (!form.role) {
      setFormError('Role is required');
      return false;
    }

    // In add mode, both password fields are required
    if (!isEditMode) {
      if (!form.password) {
        setFormError('Password is required');
        return false;
      }
      if (form.password.length < 8) {
        setFormError('Password must be at least 8 characters');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }
    }

    // In edit mode, if password is provided, validate it
    if (isEditMode && form.password) {
      if (form.password.length < 8) {
        setFormError('Password must be at least 8 characters');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setFormError(null);
      const url = isEditMode ? `/api/users/${form.accountID}` : '/api/users';
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        username: form.username.trim(),
        role: form.role,
      };

      // Only include password if it's provided (or required in add mode)
      if (form.password) {
        payload.password = form.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} user`);
      }

      setFormSuccess(data.message);
      setTimeout(() => {
        setShowModal(false);
        resetForm();
        fetchUsers();
      }, 1500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError(err.message);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      accountID: null,
      firstName: '',
      middleName: '',
      lastName: '',
      phoneNumber: '',
      username: '',
      role: 'Cashier',
      password: '',
      confirmPassword: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setIsEditMode(false);
  };

  // Open modal for adding new user
  const handleAddUser = () => {
    resetForm();
    setIsEditMode(false);
    setShowModal(true);
  };

  // Open modal for editing user
  const handleEditUser = (user) => {
    setForm({
      accountID: user.accountID,
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      username: user.username,
      role: user.role,
      password: '',
      confirmPassword: '',
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  // Handle delete (soft delete)
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.accountID}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate user');
      }

      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="user-manager-container">
        <Navigation />
      <div className="user-manager-header">
        <h1>User Manager</h1>
        <button className="btn-add-user" onClick={handleAddUser}>
          Add User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Username</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-users-message">
                  No active users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.accountID}>
                  <td>{user.employeeID}</td>
                  <td>
                    {user.firstName} {user.middleName && `${user.middleName} `}
                    {user.lastName}
                  </td>
                  <td>{user.phoneNumber}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit User
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit User */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit User' : 'Add New User'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            {formSuccess && (
              <div className="success-message">{formSuccess}</div>
            )}

            {formError && (
              <div className="error-message">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={handleFormChange('firstName')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="middleName">Middle Name</label>
                  <input
                    type="text"
                    id="middleName"
                    placeholder="Middle Name (Optional)"
                    value={form.middleName}
                    onChange={handleFormChange('middleName')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={handleFormChange('lastName')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    placeholder="Phone Number"
                    value={form.phoneNumber}
                    onChange={handleFormChange('phoneNumber')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleFormChange('username')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={handleFormChange('role')}
                  >
                    <option value="">Select Role</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">
                    Password {!isEditMode ? '*' : '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder={isEditMode ? 'Leave blank to keep current password' : 'Password (min 8 characters)'}
                    value={form.password}
                    onChange={handleFormChange('password')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password {form.password ? '*' : ''}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleFormChange('confirmPassword')}
                    disabled={!form.password && isEditMode}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {isEditMode ? 'Update User' : 'Create User'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
