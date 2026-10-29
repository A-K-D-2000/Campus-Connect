const COLORS = ['#e57373', '#f06292', '#ba68c8', '#7986cb', '#4fc3f7', '#4db6ac', '#81c784', '#ffb74d'];

function Avatar({ name = '', size = 32 }) {
  const letter = (name.charAt(0) || '?').toUpperCase();
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const color = COLORS[hash % COLORS.length];

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.5 }}
    >
      {letter}
    </span>
  );
}

export default Avatar;