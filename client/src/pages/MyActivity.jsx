import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import LoginNotice from '../components/LoginNotice';
import { formatDate, mergeById } from '../utils';

function MyActivity() {
  const { user } = useAuth();
  const [tab, setTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPage = async (p, type) => {
    const res = await api.get(`/api/activity?type=${type}&page=${p}&limit=10`);
    setItems((prev) => mergeById(p === 1 ? [] : prev, res.data.items, true));
    setTotal(res.data.total);
    setPage(p);
    setHasMore(res.data.hasMore);
  };

  // Reload from the first page whenever the tab (or the logged-in person) changes
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);
    fetchPage(1, tab)
      .then(() => !cancelled && setError(''))
      .catch(() => !cancelled && setError('Could not load your activity. Please try again.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, user?.id]);

  const loadMore = async () => {
    setLoading(true);
    try {
      await fetchPage(page + 1, tab);
    } catch {
      setError('Could not load more.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <h1>My Activity</h1>
        <LoginNotice text="You're not logged in, so there is no activity to show." />
      </div>
    );
  }

  return (
    <div>
      <h1>My Activity</h1>
      <p className="muted">Your own posts and comments. Only you can see this page.</p>

      <div className="tabs">
        <button className={`tab ${tab === 'posts' ? 'tab-active' : ''}`} onClick={() => setTab('posts')}>
          Posts
        </button>
        <button className={`tab ${tab === 'comments' ? 'tab-active' : ''}`} onClick={() => setTab('comments')}>
          Comments
        </button>
      </div>

      {error && <p className="msg msg-error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">
          {tab === 'posts' ? "You haven't posted anything yet." : "You haven't commented yet."}
        </p>
      )}
      {!error && items.length > 0 && <p className="muted">{total} in total</p>}

      {tab === 'posts' &&
        items.map((p) => (
          <article className="item" key={p._id}>
            <span className="badge">{p.flair}</span>
            <h3><Link to={`/discussion/${p._id}`}>{p.title}</Link></h3>
            <p className="item-meta">
              {formatDate(p.createdAt)} · ▲ {p.upvoteCount}
            </p>
          </article>
        ))}

      {tab === 'comments' &&
        items.map((c) => (
          <article className="item" key={c._id}>
            <p className="comment-text">{c.content}</p>
            <p className="item-meta">
              {c.isReply ? 'Reply' : 'Comment'} on{' '}
              {c.post ? <Link to={`/discussion/${c.post._id}`}>{c.post.title}</Link> : 'a deleted post'}
              {' · '}{formatDate(c.createdAt)} · ▲ {c.upvoteCount}
            </p>
          </article>
        ))}

      {loading && <p className="muted">Loading...</p>}
      {hasMore && !loading && (
        <button className="btn btn-outline" onClick={loadMore}>Load more</button>
      )}
    </div>
  );
}

export default MyActivity;