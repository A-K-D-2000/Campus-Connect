import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import LoginNotice from './LoginNotice';
import CommentItem from './CommentItem';
import { mergeById } from '../utils';

function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [collapseKey, setCollapseKey] = useState(0);

  const fetchPage = async (p) => {
    const res = await api.get(`/api/comments/post/${postId}?page=${p}&limit=10`);
    setComments((prev) => mergeById(p === 1 ? [] : prev, res.data.comments, true));
    setTotal(res.data.total);
    setPage(p);
    setHasMore(res.data.hasMore);
  };

  useEffect(() => {
    setLoading(true);
    fetchPage(1)
      .then(() => setError(''))
      .catch(() => setError('Could not load comments. Please try again.'))
      .finally(() => setLoading(false));
  }, [postId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchPage(page + 1);
    } catch {
      setError('Could not load more comments.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    setPosting(true);
    setPostError('');
    try {
      const res = await api.post('/api/comments', { postId, content });
      const created = {
        ...res.data.comment,
        createdBy: { _id: user.id, username: user.username },
        upvotes: [],
        upvoteCount: 0,
        replyCount: 0,
      };
      setComments((prev) => mergeById(prev, [created], true));
      setTotal((t) => t + 1);
      setText('');
    } catch (err) {
      setPostError(err.response?.data?.message || 'Could not post your comment.');
    } finally {
      setPosting(false);
    }
  };

  const removeComment = (id) => {
    setComments((prev) => prev.filter((c) => c._id !== id));
    setTotal((t) => Math.max(0, t - 1));
  };

  return (
    <section className="comments">
      <div className="page-header">
        <h3>Comments ({total})</h3>
        {comments.length > 0 && (
          <button className="link-btn" onClick={() => setCollapseKey((k) => k + 1)}>
            Collapse all replies
          </button>
        )}
      </div>

      {user ? (
        <form onSubmit={handlePost} className="comment-form">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
          />
          {postError && <p className="msg msg-error">{postError}</p>}
          <div className="row">
            <button className="btn" disabled={posting || !text.trim()}>
              {posting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>
      ) : (
        <LoginNotice text="You're not logged in, so you can read but not comment." />
      )}

      {error && <p className="msg msg-error">{error}</p>}
      {loading && <p className="muted">Loading comments...</p>}
      {!loading && !error && comments.length === 0 && (
        <p className="muted">No comments yet. Be the first.</p>
      )}

      {comments.map((c) => (
        <CommentItem
          key={c._id}
          comment={c}
          postId={postId}
          user={user}
          onDeleted={removeComment}
          collapseKey={collapseKey}
        />
      ))}

      {hasMore && (
        <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </section>
  );
}

export default CommentSection;