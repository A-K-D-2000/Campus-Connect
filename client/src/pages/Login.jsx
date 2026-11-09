import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerify(false);
    setResendMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setNeedsVerify(err.response?.status === 403);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      const res = await api.post('/api/auth/resend-verification', {
        email: form.email.trim().toLowerCase(),
      });
      setResendMsg(res.data.message);
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Could not send the email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="card">
      <h2>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required />

        {error && <p className="msg msg-error">{error}</p>}

        {needsVerify && (
          <div>
            <button type="button" className="btn btn-outline btn-small" onClick={handleResend} disabled={resending}>
              {resending ? 'Sending...' : 'Send a new verification link'}
            </button>
            {resendMsg && <p className="msg msg-info" style={{ marginTop: 10 }}>{resendMsg}</p>}
          </div>
        )}

        <button className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="muted"><Link to="/forgot-password">Forgot password?</Link></p>
      <p className="muted">New here? <Link to="/signup">Create an account</Link></p>
    </div>
  );
}

export default Login;