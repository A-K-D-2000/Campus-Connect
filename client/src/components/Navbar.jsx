import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="brand">
          Campus Connect
        </Link>
        <Link to="/faqs" className="nav-link">
          FAQs
        </Link>
        <Link to="/announcements" className="nav-link">
          Announcements
        </Link>
        <Link to="/discussion" className="nav-link">
          Discussion
        </Link>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <NotificationBell />
            <Link to="/my-activity" className="nav-link">
              My Activity
            </Link>
            {user.role === "admin" && (
              <Link to="/admin/users" className="nav-link">
                Users
              </Link>
            )}
            <Link to="/settings" className="nav-user">
              <Avatar name={user.username} />
              <span className="nav-username">{user.username}</span>
            </Link>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="btn">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
