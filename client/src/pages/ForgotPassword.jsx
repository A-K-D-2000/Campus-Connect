import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Reset your password</h2>
      <p className="muted">Enter your college email, or your verified backup email.</p>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {error && <p className="msg msg-error">{error}</p>}
        {message && <p className="msg msg-success">{message}</p>}

        <button className="btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="muted"><Link to="/login">Back to login</Link></p>
    </div>
  );
}

export default ForgotPassword;