import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/api/auth/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Choose a new password</h2>
      <form onSubmit={handleSubmit}>
        <label>New password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               minLength={6} required />

        <label>Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
               minLength={6} required />

        {error && <p className="msg msg-error">{error}</p>}
        {message && <p className="msg msg-success">{message}</p>}

        <button className="btn" disabled={loading}>
          {loading ? 'Saving...' : 'Set new password'}
        </button>
      </form>
      <p className="muted"><Link to="/login">Go to login</Link></p>
    </div>
  );
}

export default ResetPassword;