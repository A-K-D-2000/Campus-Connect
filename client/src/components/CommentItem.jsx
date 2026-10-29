import { useEffect, useState } from "react";
import api from "../api";
import Avatar from "./Avatar";
import UpvoteButton from "./UpvoteButton";
import LoginNotice from "./LoginNotice";
import ReplyItem from "./ReplyItem";
import { toggleId, formatDate, mergeById } from "../utils";

function CommentItem({ comment, postId, user, onDeleted, collapseKey }) {
  const [upvotes, setUpvotes] = useState(comment.upvotes || []);
  const [replyCount, setReplyCount] = useState(comment.replyCount || 0);

  const [replies, setReplies] = useState([]);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesHasMore, setRepliesHasMore] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [tagged, setTagged] = useState(null); // { id, username } or null
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const [needLogin, setNeedLogin] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const author = comment.createdBy;
  const canDelete = user && (user.role === "admin" || author?._id === user.id);

  // "Collapse all replies" from the parent: fold this thread
  useEffect(() => {
    setRepliesOpen(false);
    setComposerOpen(false);
  }, [collapseKey]);

  const fetchReplies = async (p) => {
    setRepliesLoading(true);
    setError("");
    try {
      const res = await api.get(
        `/api/comments/${comment._id}/replies?page=${p}&limit=5`,
      );
      setReplies((prev) => mergeById(prev, res.data.replies));
      setRepliesPage(p);
      setRepliesHasMore(res.data.hasMore);
      setReplyCount(res.data.total);
      setRepliesLoaded(true);
    } catch {
      setError("Could not load replies. Please try again.");
    } finally {
      setRepliesLoading(false);
    }
  };

  const toggleReplies = () => {
    if (repliesOpen) {
      setRepliesOpen(false);
      return;
    }
    setRepliesOpen(true);
    if (!repliesLoaded) fetchReplies(1);
  };

  const handleUpvote = async () => {
    if (!user) {
      setNeedLogin(true);
      return;
    }
    try {
      await api.put(`/api/comments/${comment._id}/upvote`);
      setUpvotes((prev) => toggleId(prev, user.id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your upvote.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/comments/${comment._id}`);
      onDeleted(comment._id);
    } catch (err) {
      setConfirmDelete(false);
      setError(err.response?.data?.message || "Could not delete the comment.");
    }
  };

  // Open the reply box, with the chosen person's @username already filled in
  const startReply = (person) => {
    if (!user) {
      setNeedLogin(true);
      return;
    }
    const target = person && person._id !== user.id ? person : null;
    setTagged(target ? { id: target._id, username: target.username } : null);
    setReplyText(target ? `@${target.username} ` : "");
    setComposerOpen(true);
    setError("");
  };

  const cancelReply = () => {
    setComposerOpen(false);
    setReplyText("");
    setTagged(null);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    const content = replyText.trim();
    if (!content) return;

    // Only tag the person if the @username is still at the start of the text
    const mentioned = tagged && content.startsWith(`@${tagged.username}`);

    setSending(true);
    setError("");
    try {
      const res = await api.post("/api/comments", {
        postId,
        content,
        parentComment: comment._id,
        taggedUser: mentioned ? tagged.id : undefined,
      });
      const created = {
        ...res.data.comment,
        createdBy: { _id: user.id, username: user.username },
        taggedUser: mentioned
          ? { _id: tagged.id, username: tagged.username }
          : null,
        upvotes: [],
        upvoteCount: 0,
      };
      setReplies((prev) => mergeById(prev, [created]));
      setReplyCount((c) => c + 1);
      setRepliesOpen(true);
      cancelReply();
      if (!repliesLoaded) fetchReplies(1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not post your reply.");
    } finally {
      setSending(false);
    }
  };

  const removeReply = (id) => {
    setReplies((prev) => prev.filter((r) => r._id !== id));
    setReplyCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="comment">
      <div className="comment-head">
        <Avatar name={author?.username || "?"} size={28} />
        <strong>{author?.username || "Deleted user"}</strong>
        <span className="muted">{formatDate(comment.createdAt)}</span>
      </div>

      <p className="comment-text">{comment.content}</p>

      <div className="comment-actions">
        <UpvoteButton
          count={upvotes.length}
          active={!!user && upvotes.includes(user.id)}
          onClick={handleUpvote}
        />
        <button className="link-btn" onClick={() => startReply(author)}>
          Reply
        </button>
        {canDelete &&
          (confirmDelete ? (
            <>
              <span className="muted">
                Delete this comment and its replies?
              </span>
              <button className="link-btn danger-text" onClick={handleDelete}>
                Yes
              </button>
              <button
                className="link-btn"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button className="link-btn" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          ))}
      </div>

      {needLogin && <LoginNotice />}

      {replyCount > 0 && (
        <button className="link-btn replies-toggle" onClick={toggleReplies}>
          {repliesOpen
            ? "Hide replies"
            : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
        </button>
      )}

      {repliesOpen && (
        <div className="replies">
          {replies.map((r) => (
            <ReplyItem
              key={r._id}
              reply={r}
              user={user}
              onReply={startReply}
              onDeleted={removeReply}
              onNeedLogin={() => setNeedLogin(true)}
            />
          ))}
          {repliesLoading && <p className="muted">Loading replies...</p>}
          {repliesHasMore && !repliesLoading && (
            <button
              className="link-btn"
              onClick={() => fetchReplies(repliesPage + 1)}
            >
              View more replies
            </button>
          )}
        </div>
      )}

      {composerOpen && (
        <form className="reply-form" onSubmit={sendReply}>
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
            onFocus={(e) =>
              e.target.setSelectionRange(
                e.target.value.length,
                e.target.value.length,
              )
            }
          />
          <div className="row">
            <button
              className="btn btn-small"
              disabled={sending || !replyText.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={cancelReply}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="msg msg-error">{error}</p>}
    </div>
  );
}

export default CommentItem;
