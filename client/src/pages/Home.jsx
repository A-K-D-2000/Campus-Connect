import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Campus Connect</h1>
      <p>
        {user
          ? `Welcome, ${user.username}.`
          : 'Browse as a visitor, or log in to take part.'}
      </p>
    </div>
  );
}

export default Home;