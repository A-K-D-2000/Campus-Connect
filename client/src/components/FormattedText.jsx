// Shows text with line breaks kept, and **double-asterisk text** as bold.
// We build real React elements instead of injecting HTML, so nothing typed
// into a post can run as code on the page.
function FormattedText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);

  return (
    <div className="formatted">
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </div>
  );
}

export default FormattedText;