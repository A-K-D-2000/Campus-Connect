const COLORS = ['#6a795d', '#8a6f4e', '#9a5b4e', '#5b7a86', '#7b6a8f', '#4f7f6a', '#a0803f', '#6e6b4a'];

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