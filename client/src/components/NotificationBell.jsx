import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils';

function describe(n) {
  const who = n.sender?.username || 'Someone';
  const title = n.post?.title ? `"${n.post.title}"` : 'a post';
  if (n.type === 'comment') return `${who} commented on your post ${title}`;
  if (n.type === 'reply') return `${who} replied to your comment on ${title}`;
  return `${who} mentioned you in ${title}`;
}

function NotificationBell() {
  const {
    notifications, unreadCount, hasMore, loading, error,
    loadMore, markRead, markAllRead, dismiss, clearAll,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openNotification = async (n) => {
    await markRead(n);
    setOpen(false);
    if (n.post?._id) navigate(`/discussion/${n.post._id}`);
  };

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        className="bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-header">
            <strong>Notifications</strong>
            <div className="row">
              {unreadCount > 0 && (
                <button className="link-btn" onClick={markAllRead}>Mark all as read</button>
              )}
              {notifications.length > 0 && (
                <button className="link-btn" onClick={clearAll}>Clear all</button>
              )}
            </div>
          </div>

          {error && <p className="msg msg-error">{error}</p>}
          {!error && !loading && notifications.length === 0 && (
            <p className="muted bell-empty">You're all caught up.</p>
          )}

          <ul className="bell-list">
            {notifications.map((n) => (
              <li key={n._id} className={`bell-item ${n.isRead ? '' : 'bell-unread'}`}>
                <button className="bell-item-main" onClick={() => openNotification(n)}>
                  <span>{describe(n)}</span>
                  <span className="muted bell-time">{formatDate(n.createdAt)}</span>
                </button>
                <button className="bell-dismiss" onClick={() => dismiss(n)} aria-label="Dismiss">×</button>
              </li>
            ))}
          </ul>

          {loading && <p className="muted bell-empty">Loading...</p>}
          {hasMore && !loading && (
            <button className="link-btn bell-more" onClick={loadMore}>Load more</button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;