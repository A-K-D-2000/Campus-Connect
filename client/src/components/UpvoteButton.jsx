function UpvoteButton({ count, active, onClick }) {
  return (
    <button
      type="button"
      className={`upvote ${active ? 'upvote-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      ▲ {count}
    </button>
  );
}

export default UpvoteButton;