import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import FormattedText from '../components/FormattedText';
import UpvoteButton from '../components/UpvoteButton';
import LoginNotice from '../components/LoginNotice';
import CommentSection from '../components/CommentSection';
import { toggleId, formatDate } from '../utils';
import AttachmentList from '../components/AttachmentList';

function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/posts/${id}`)
      .then((res) => {
        setPost(res.data);
        setError('');
      })
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? 'This post does not exist. It may have been deleted.'
            : 'Could not load the post. Please try again.'
        )
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    if (!user) {
      setNeedLogin(true);
      return;
    }
    try {
      await api.put(`/api/posts/${post._id}/upvote`);
      setPost((p) => ({ ...p, upvotes: toggleId(p.upvotes, user.id) }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your upvote.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/posts/${post._id}`);
      navigate('/discussion');
    } catch (err) {
      setConfirmDelete(false);
      setError(err.response?.data?.message || 'Could not delete the post.');
    }
  };

  if (loading) return <p className="muted">Loading...</p>;

  if (!post) {
    return (
      <div>
        <p className="msg msg-error">{error}</p>
        <Link to="/discussion">Back to the Discussion Board</Link>
      </div>
    );
  }

  const author = post.createdBy;
  const canDelete = user && (user.role === 'admin' || author?._id === user.id);

  return (
    <div>
      <p><Link to="/discussion">← Back to the Discussion Board</Link></p>

      <article className="item">
        <span className="badge">{post.flair}</span>
        <h2>{post.title}</h2>

        <div className="comment-head">
          <Avatar name={author?.username || '?'} size={28} />
          <strong>{author?.username || 'Deleted user'}</strong>
          <span className="muted">{formatDate(post.createdAt)}</span>
        </div>

        <AttachmentList urls={post.attachments} />
        <FormattedText text={post.content} />

        <div className="row post-actions">
          <UpvoteButton
            count={post.upvotes.length}
            active={!!user && post.upvotes.includes(user.id)}
            onClick={handleUpvote}
          />
          {canDelete && (
            confirmDelete ? (
              <>
                <span className="muted">Delete this post and all its comments?</span>
                <button className="btn btn-danger btn-small" onClick={handleDelete}>Yes, delete</button>
                <button className="btn btn-outline btn-small" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-outline btn-small" onClick={() => setConfirmDelete(true)}>Delete</button>
            )
          )}
        </div>

        {needLogin && <LoginNotice />}
        {error && <p className="msg msg-error">{error}</p>}
      </article>

      <CommentSection postId={post._id} />
    </div>
  );
}

export default PostPage;