import { Link } from 'react-router-dom';

function LoginNotice({ text = "You're not logged in." }) {
  return (
    <p className="msg msg-info">
      {text} <Link to="/login">Log in</Link> or <Link to="/signup">sign up</Link> to take part.
    </p>
  );
}

export default LoginNotice;