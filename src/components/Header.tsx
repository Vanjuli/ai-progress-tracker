import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, demo, signOut } = useAuth();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="dot" />
          AI Progress Tracker
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/pending">Verify</NavLink>
          <NavLink to="/submit">Submit</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <div className="header-right">
          {demo && <span className="tag">Demo mode</span>}
          {user ? (
            <>
              <span className="muted">{user.email}</span>
              {!demo && (
                <button className="btn" onClick={() => void signOut()}>
                  Sign out
                </button>
              )}
            </>
          ) : (
            <Link to="/signin" className="btn btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
