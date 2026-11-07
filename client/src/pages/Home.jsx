import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NOTES = [
  { to: '/faqs', title: 'FAQs', text: 'Who to contact, in what order, and how long it usually takes.' },
  { to: '/announcements', title: 'Announcements', text: 'Deadlines and updates from the college, in one feed.' },
  { to: '/discussion', title: 'Discussion', text: 'Ask a doubt, share a placement experience, help a junior.' },
];

function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="hero">
        <h1>{user ? `Welcome back, ${user.username}.` : 'Ask once. Find it later.'}</h1>
        <p className="hero-sub">
          Process answers, college announcements and student discussion in one place. Everyone can
          read. When you take part, only your username is shown.
        </p>
        <div className="hero-actions">
          <Link to="/faqs" className="btn">Browse FAQs</Link>
          {user ? (
            <Link to="/discussion" className="btn btn-outline">Open the discussion board</Link>
          ) : (
            <Link to="/signup" className="btn btn-outline">Create an account</Link>
          )}
        </div>
      </section>

      <div className="board">
        {NOTES.map((n, i) => (
          <Link key={n.to} to={n.to} className={`note-link note-${i + 1}`}>
            <h3>{n.title}</h3>
            <p>{n.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;