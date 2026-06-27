import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignInPage() {
  const { demo, user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (demo) {
    return (
      <section className="section form-narrow">
        <h1>Demo mode</h1>
        <p className="muted">
          You're running in offline demo mode and are already "signed in" as{" "}
          <strong>{user?.email}</strong>, so you can try submitting and voting. These
          actions are stored only in this browser.
        </p>
        <p className="muted">
          To enable real accounts (email magic-link sign-in) and a shared database,
          connect a Supabase project — see the README. <Link to="/">Back to dashboard</Link>
        </p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="section form-narrow">
        <h1>You're signed in</h1>
        <p className="muted">
          Signed in as <strong>{user.email}</strong>. <Link to="/submit">Submit data</Link> or{" "}
          <Link to="/pending">help verify</Link>.
        </p>
      </section>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signIn(email.trim());
    setBusy(false);
    if (error) setError(error);
    else setSent(true);
  };

  return (
    <section className="section form-narrow">
      <h1>Sign in</h1>
      {sent ? (
        <p>
          ✉️ Check <strong>{email}</strong> for a magic sign-in link. You can close this
          tab and click the link when it arrives.
        </p>
      ) : (
        <>
          <p className="muted">
            Enter your email and we'll send a one-time magic link — no password needed.
          </p>
          <form onSubmit={onSubmit}>
            <div className="field-row">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send magic link"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
