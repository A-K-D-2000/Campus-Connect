import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import LoginNotice from '../components/LoginNotice';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils';

const errorText = (err) =>
  err.response?.data?.message || 'Something went wrong. Please try again.';

function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (form.next !== form.confirm) {
      setError('The new passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/api/auth/password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      setMessage(res.data.message);
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <h3>Change password</h3>
      <form onSubmit={handleSubmit}>
        <label>Current password</label>
        <input name="current" type="password" autoComplete="current-password"
               value={form.current} onChange={handleChange} required />

        <label>New password</label>
        <input name="next" type="password" autoComplete="new-password" minLength={6}
               value={form.next} onChange={handleChange} required />

        <label>Confirm new password</label>
        <input name="confirm" type="password" autoComplete="new-password" minLength={6}
               value={form.confirm} onChange={handleChange} required />

        {error && <p className="msg msg-error">{error}</p>}
        {message && <p className="msg msg-success">{message}</p>}

        <div className="row">
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Change password'}</button>
        </div>
      </form>
    </section>
  );
}

function BackupEmailForm({ profile, onChanged }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const res = await api.put('/api/auth/backup-email', { backupEmail: email.trim() });
      setMessage(res.data.message);
      setEmail('');
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <h3>Backup recovery email</h3>
      <p className="muted">
        If your college email is ever deactivated, a verified backup email lets you reset your
        password. We email a confirmation link to the address first, and it only works after you
        click that link.
      </p>

      {profile.backupEmail ? (
        <p>Verified backup email: <strong>{profile.backupEmail}</strong></p>
      ) : (
        <p className="muted">No backup email set yet.</p>
      )}
      {profile.pendingBackupEmail && (
        <p className="msg msg-info">
          Waiting for you to confirm <strong>{profile.pendingBackupEmail}</strong>. Open the link we
          emailed to that address, then reload this page.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label>{profile.backupEmail ? 'Replace it with a different address' : 'Backup email address'}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {error && <p className="msg msg-error">{error}</p>}
        {message && <p className="msg msg-success">{message}</p>}

        <div className="row">
          <button className="btn" disabled={saving || !email.trim()}>
            {saving ? 'Sending...' : 'Send confirmation link'}
          </button>
        </div>
      </form>
    </section>
  );
}

function DeleteAccount({ profile }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (profile.role === 'admin') {
    return (
      <section className="panel danger-zone">
        <h3>Delete account</h3>
        <p className="muted">
          Admin accounts can't be deleted from here. Another admin has to change your role to
          student first.
        </p>
      </section>
    );
  }

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    setDeleting(true);
    try {
      await api.delete('/api/auth/account', { data: { password } });
      logout();
      navigate('/');
    } catch (err) {
      setError(errorText(err));
      setDeleting(false);
    }
  };

  return (
    <section className="panel danger-zone">
      <h3>Delete account</h3>
      <p className="muted">
        This removes your login, your email addresses and your notifications. Your posts and
        comments stay, shown as "Deleted user". Your college email can't be used to sign up again
        for 24 hours.
      </p>

      {!open ? (
        <button className="btn btn-outline" onClick={() => setOpen(true)}>Delete my account</button>
      ) : (
        <form onSubmit={handleDelete}>
          <label>Type your password to confirm</label>
          <input type="password" autoComplete="current-password" value={password}
                 onChange={(e) => setPassword(e.target.value)} required />

          {error && <p className="msg msg-error">{error}</p>}

          <div className="row">
            <button className="btn btn-danger" disabled={deleting || !password}>
              {deleting ? 'Deleting...' : 'Yes, delete my account'}
            </button>
            <button type="button" className="btn btn-outline"
                    onClick={() => { setOpen(false); setPassword(''); setError(''); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Settings() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  const loadProfile = async () => {
    const data = await refreshUser();
    if (data) {
      setProfile(data);
      setLoadError('');
    } else {
      setLoadError('Could not load your profile. Please try again.');
    }
  };

  useEffect(() => {
    if (user) loadProfile();
  }, [user?.id]);

  if (!user) {
    return (
      <div>
        <h1>Settings</h1>
        <LoginNotice text="You're not logged in, so there are no settings to show." />
      </div>
    );
  }

  return (
    <div>
      <h1>Settings</h1>
      {loadError && <p className="msg msg-error">{loadError}</p>}
      {!profile && !loadError && <p className="muted">Loading...</p>}

      {profile && (
        <>
          <section className="panel">
            <h3>Your account</h3>
            <div className="profile-head">
              <Avatar name={profile.username} size={48} />
              <div>
                <strong>{profile.username}</strong>
                <div className="muted">{profile.email}</div>
              </div>
            </div>
            <p className="muted">
              Role: <span className="badge">{profile.role}</span> · Member since {formatDate(profile.createdAt)}
            </p>
            <p className="muted">
              Your college email is your login and can't be changed. Other people only ever see your username.
            </p>
          </section>

          <PasswordForm />
          <BackupEmailForm profile={profile} onChanged={loadProfile} />
          <DeleteAccount profile={profile} />
        </>
      )}
    </div>
  );
}

export default Settings;