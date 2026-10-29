import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from './AuthContext';
import { mergeById } from '../utils';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ids we already know about, so a notification is never counted twice
  const knownIds = useRef(new Set());

  const fetchPage = useCallback(async (p) => {
    const res = await api.get(`/api/notifications?page=${p}&limit=20`);
    res.data.notifications.forEach((n) => knownIds.current.add(n._id));
    setNotifications((prev) => mergeById(p === 1 ? [] : prev, res.data.notifications, true));
    setUnreadCount(res.data.unreadCount);
    setPage(p);
    setHasMore(res.data.hasMore);
  }, []);

  // Runs when someone logs in or out
  useEffect(() => {
    if (!user) {
      knownIds.current = new Set();
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setPage(1);
      setError('');
      return;
    }

    let cancelled = false;
    knownIds.current = new Set();
    setLoading(true);
    fetchPage(1)
      .then(() => !cancelled && setError(''))
      .catch(() => !cancelled && setError('Could not load notifications.'))
      .finally(() => !cancelled && setLoading(false));

    // Live connection. The server checks this token before accepting us.
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('token') },
    });

    socket.on('notification', (n) => {
      if (knownIds.current.has(n._id)) return;
      knownIds.current.add(n._id);
      setNotifications((prev) => mergeById(prev, [n], true));
      setUnreadCount((c) => c + 1);
    });

    // Leaving: close the connection (logout, or the page closing)
    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [user?.id, fetchPage]);

  const loadMore = async () => {
    setLoading(true);
    try {
      await fetchPage(page + 1);
    } catch {
      setError('Could not load more notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (n) => {
    if (n.isRead) return;
    try {
      await api.put(`/api/notifications/${n._id}/read`);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setError('Could not update the notification.');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError('Could not update notifications.');
    }
  };

  const dismiss = async (n) => {
    try {
      await api.delete(`/api/notifications/${n._id}`);
      setNotifications((prev) => prev.filter((x) => x._id !== n._id));
      if (!n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setError('Could not dismiss the notification.');
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    } catch {
      setError('Could not clear notifications.');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications, unreadCount, hasMore, loading, error,
        loadMore, markRead, markAllRead, dismiss, clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);