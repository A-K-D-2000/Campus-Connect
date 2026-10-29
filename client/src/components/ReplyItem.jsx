import { useState } from 'react';
import api from '../api';
import Avatar from './Avatar';
import UpvoteButton from './UpvoteButton';
import { toggleId, formatDate } from '../utils';

function ReplyItem({ reply, user, onReply, onDeleted, onNeedLogin }) {
  const [upvotes, setUpvotes] = useState(reply.upvotes || []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const author = reply.createdBy;
  const canDelete = user && (user.role === 'admin' || author?._id === user.id);

  // Highlight the @mention if the text still starts with it
  const tag = reply.taggedUser ? `@${reply.taggedUser.username}` : null;
  const hasTag = tag && reply.content.startsWith(tag);

  const handleUpvote = async () => {
    if (!user) {
      onNeedLogin();
      return;
    }
    try {
      await api.put(`/api/comments/${reply._id}/upvote`);
      setUpvotes((prev) => toggleId(prev, user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your upvote.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/comments/${reply._id}`);
      onDeleted(reply._id);
    } catch (err) {
      setConfirmDelete(false);
      setError(err.response?.data?.message || 'Could not delete the reply.');
    }
  };

  return (
    <div className="reply">
      <div className="comment-head">
        <Avatar name={author?.username || '?'} size={24} />
        <strong>{author?.username || 'Deleted user'}</strong>
        <span className="muted">{formatDate(reply.createdAt)}</span>
      </div>

      <p className="comment-text">
        {hasTag ? (
          <>
            <span className="mention">{tag}</span>
            {reply.content.slice(tag.length)}
          </>
        ) : (
          reply.content
        )}
      </p>

      <div className="comment-actions">
        <UpvoteButton
          count={upvotes.length}
          active={!!user && upvotes.includes(user.id)}
          onClick={handleUpvote}
        />
        <button className="link-btn" onClick={() => onReply(author)}>Reply</button>
        {canDelete && (
          confirmDelete ? (
            <>
              <span className="muted">Delete?</span>
              <button className="link-btn danger-text" onClick={handleDelete}>Yes</button>
              <button className="link-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="link-btn" onClick={() => setConfirmDelete(true)}>Delete</button>
          )
        )}
      </div>
      {error && <p className="msg msg-error">{error}</p>}
    </div>
  );
}

export default ReplyItem;