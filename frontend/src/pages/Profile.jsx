import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword } from '../services/api';
import { toast } from 'sonner';

const Profile = () => {
  const { user, login, token, logout } = useAuth();
  const navigate = useNavigate();

  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [nameLoading, setNameLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return toast.error('Name cannot be empty');
    setNameLoading(true);
    try {
      const data = await updateProfile(nameForm.name.trim());
      login(data.data.user, token);
      toast.success('Name updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setNameLoading(false);
    }
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (!pwForm.newPassword) errs.newPassword = 'Required';
    else if (pwForm.newPassword.length < 6) errs.newPassword = 'Min 6 characters';
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/');
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
      pwErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        {/* Avatar + basics */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary-600">
              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { to: '/orders', label: 'My Orders', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            { to: '/wishlist', label: 'Wishlist', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /> },
            { to: '/products', label: 'Shop', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
          ].map(({ to, label, icon }) => (
            <Link key={to} to={to} className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>

        {/* Update name */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Update Name</h2>
          <form onSubmit={handleNameSave} className="flex gap-3">
            <input
              value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Your full name"
            />
            <button
              type="submit"
              disabled={nameLoading}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              {nameLoading ? 'Saving…' : 'Save'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">Email: {user.email} (cannot be changed)</p>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
            {[
              { id: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
              { id: 'newPassword', label: 'New Password', placeholder: 'Min. 6 characters' },
              { id: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(({ id, label, placeholder }) => (
              <div key={id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="password"
                  value={pwForm[id]}
                  onChange={e => { setPwForm(p => ({ ...p, [id]: e.target.value })); if (pwErrors[id]) setPwErrors(p => ({ ...p, [id]: '' })); }}
                  placeholder={placeholder}
                  className={inputCls(id)}
                />
                {pwErrors[id] && <p className="mt-1 text-xs text-red-600">{pwErrors[id]}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              {pwLoading ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Sign Out</h2>
          <p className="text-gray-600 text-sm mb-4">You'll be signed out on this device.</p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
