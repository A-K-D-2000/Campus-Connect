import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import LoginNotice from '../components/LoginNotice';
import { formatDate, mergeById } from '../utils';

const TAB_LABELS = {
  posts: 'Posts',
  comments: 'Comments',
  faqs: 'FAQs',
  announcements: 'Announcements',
};

const EMPTY_TEXT = {
  posts: "You haven't posted anything yet.",
  comments: "You haven't commented yet.",
  faqs: "You haven't created any FAQs yet.",
  announcements: "You haven't published any announcements yet.",
};

function MyActivity() {
  const { user } = useAuth();
  const [tab, setTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isStaff = user && (user.role === 'admin' || user.role === 'authority');
  // Students get two tabs; Authority and Admin also get FAQs and Announcements
  const tabs = isStaff ? ['posts', 'comments', 'faqs', 'announcements'] : ['posts', 'comments'];
  // If the role changes while the page is open, never stay on a tab you can't see
  const activeTab = tabs.includes(tab) ? tab : 'posts';

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
    fetchPage(1, activeTab)
      .then(() => !cancelled && setError(''))
      .catch(() => !cancelled && setError('Could not load your activity. Please try again.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeTab, user?.id]);

  const loadMore = async () => {
    setLoading(true);
    try {
      await fetchPage(page + 1, activeTab);
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

  const attachmentText = (n) => (n > 0 ? ` · 📎 ${n}` : '');

  return (
    <div>
      <h1>My Activity</h1>
      <p className="muted">
        {isStaff
          ? 'Your own posts, comments, FAQs and announcements. Only you can see this page.'
          : 'Your own posts and comments. Only you can see this page.'}
      </p>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`tab ${activeTab === t ? 'tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <p className="msg msg-error">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="muted">{EMPTY_TEXT[activeTab]}</p>}
      {!error && items.length > 0 && <p className="muted">{total} in total</p>}

      {activeTab === 'posts' &&
        items.map((p) => (
          <article className="item" key={p._id}>
            <span className="badge">{p.flair}</span>
            <h3><Link to={`/discussion/${p._id}`}>{p.title}</Link></h3>
            <p className="item-meta">
              {formatDate(p.createdAt)} · ▲ {p.upvoteCount}
            </p>
          </article>
        ))}

      {activeTab === 'comments' &&
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

      {activeTab === 'faqs' &&
        items.map((f) => (
          <article className="item" key={f._id}>
            <h3><Link to="/faqs">{f.title}</Link></h3>
            <p className="item-meta">
              Published {formatDate(f.createdAt)}
              {f.updatedAt !== f.createdAt && ` · updated ${formatDate(f.updatedAt)}`}
              {attachmentText(f.attachmentCount)}
            </p>
          </article>
        ))}

      {activeTab === 'announcements' &&
        items.map((a) => (
          <article className="item" key={a._id}>
            <span className="badge">{a.category}</span>
            <h3><Link to="/announcements">{a.title}</Link></h3>
            <p className="item-meta">
              Posted {formatDate(a.createdAt)}
              {attachmentText(a.attachmentCount)}
            </p>
          </article>
        ))}

      {(activeTab === 'faqs' || activeTab === 'announcements') && items.length > 0 && (
        <p className="muted">
          To edit or delete these, open the {activeTab === 'faqs' ? 'FAQs' : 'Announcements'} page.
        </p>
      )}

      {loading && <p className="muted">Loading...</p>}
      {hasMore && !loading && (
        <button className="btn btn-outline" onClick={loadMore}>Load more</button>
      )}
    </div>
  );
}

export default MyActivity;