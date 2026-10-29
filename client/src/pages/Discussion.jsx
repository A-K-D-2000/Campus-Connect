import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import UpvoteButton from '../components/UpvoteButton';
import LoginNotice from '../components/LoginNotice';
import { toggleId, formatDate } from '../utils';

const FLAIRS = ['Academic Doubt', 'Placement Experience', 'General Query'];
const emptyForm = { title: '', content: '', flair: FLAIRS[0] };

function Discussion() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [needLogin, setNeedLogin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPosts = async () => {
    try {
      const res = await api.get('/api/posts');
      setPosts(res.data);
      setError('');
    } catch {
      setError('Could not load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleNewPost = () => {
    if (!user) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setFormError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/api/posts', form);
      closeForm();
      await loadPosts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpvote = async (post) => {
    if (!user) {
      setNeedLogin(true);
      return;
    }
    try {
      await api.put(`/api/posts/${post._id}/upvote`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id ? { ...p, upvotes: toggleId(p.upvotes, user.id) } : p
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your upvote.');
    }
  };

  const shown = filter === 'All' ? posts : posts.filter((p) => p.flair === filter);

  return (
    <div>
      <div className="page-header">
        <h1>Discussion Board</h1>
        {!showForm && (
          <button className="btn" onClick={handleNewPost}>New post</button>
        )}
      </div>
      <p className="muted">Academic doubts, placement experiences and general questions.</p>

      {needLogin && <LoginNotice />}

      {showForm && (
        <div className="panel">
          <h3>New post</h3>
          <form onSubmit={handleSubmit}>
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />

            <label>Flair</label>
            <select name="flair" value={form.flair} onChange={handleChange}>
              {FLAIRS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <label>Content</label>
            <textarea name="content" rows={7} value={form.content} onChange={handleChange} required />

            {formError && <p className="msg msg-error">{formError}</p>}

            <div className="row">
              <button className="btn" disabled={saving}>{saving ? 'Posting...' : 'Post'}</button>
              <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="row filter-row">
        <label htmlFor="flair-filter">Show:</label>
        <select id="flair-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All posts</option>
          {FLAIRS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {error && <p className="msg msg-error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && shown.length === 0 && <p className="muted">No posts yet.</p>}

      {shown.map((post) => (
        <article className="item" key={post._id}>
          <div className="post-card-row">
            <UpvoteButton
              count={post.upvotes.length}
              active={!!user && post.upvotes.includes(user.id)}
              onClick={() => handleUpvote(post)}
            />
            <div className="post-card-main">
              <span className="badge">{post.flair}</span>
              <h3><Link to={`/discussion/${post._id}`}>{post.title}</Link></h3>
              <p className="post-snippet">
                {post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content}
              </p>
              <p className="item-meta">
                by {post.createdBy?.username || 'Deleted user'} · {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default Discussion;