import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

function VerifyEmail({ kind = 'signup' }) {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // In development React runs effects twice, and a link only works once
    if (started.current) return;
    started.current = true;

    const path = kind === 'backup' ? 'verify-backup' : 'verify';
    api
      .get(`/api/auth/${path}/${token}`)
      .then((res) => {
        setMessage(res.data.message);
        setStatus('success');
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || 'Could not reach the server. Please try again.');
        setStatus('error');
      });
  }, []);

  const isBackup = kind === 'backup';

  return (
    <div className="card">
      <h2>{isBackup ? 'Backup email' : 'Email verification'}</h2>

      {status === 'loading' && <p className="muted">Checking your link...</p>}
      {status === 'success' && <p className="msg msg-success">{message}</p>}
      {status === 'error' && <p className="msg msg-error">{message}</p>}

      {status === 'success' && (
        <p>
          <Link to={isBackup ? '/settings' : '/login'} className="btn">
            {isBackup ? 'Back to settings' : 'Log in'}
          </Link>
        </p>
      )}
      {status === 'error' && (
        <p className="muted">
          {isBackup
            ? 'Open Settings and send a new confirmation link.'
            : 'Try logging in. If your account is not verified yet, you can request a new link there.'}{' '}
          <Link to={isBackup ? '/settings' : '/login'}>
            {isBackup ? 'Go to settings' : 'Go to login'}
          </Link>
        </p>
      )}
    </div>
  );
}

export default VerifyEmail;