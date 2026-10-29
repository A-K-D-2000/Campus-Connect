import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Signup() {
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const email = form.email.trim().toLowerCase();
    if (!email.endsWith('@medicaps.ac.in')) {
      setError('Please use your @medicaps.ac.in college email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/signup', { ...form, email });
      setSuccess(res.data.message);
      setForm({ email: '', username: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create your account</h2>
      <form onSubmit={handleSubmit}>
        <label>College email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange}
               placeholder="en24cs...@medicaps.ac.in" required />

        <label>Username (shown publicly instead of your name)</label>
        <input name="username" value={form.username} onChange={handleChange} required />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange}
               minLength={6} required />

        {error && <p className="msg msg-error">{error}</p>}
        {success && <p className="msg msg-success">{success}</p>}

        <button className="btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}

export default Signup;