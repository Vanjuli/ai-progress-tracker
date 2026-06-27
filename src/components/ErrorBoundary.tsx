import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time exceptions anywhere below it so a single throw can't blank
 * the entire app (which is indistinguishable from "no data"). Shows the error and
 * logs it to the console instead of unmounting silently.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the full error + component stack in the browser console.
    console.error("Render error caught by ErrorBoundary:", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="container" style={{ paddingTop: 48 }}>
        <section className="section">
          <h1>Something went wrong</h1>
          <p className="muted">
            The page hit an unexpected error while rendering. The details below (and your
            browser console) can help pin down the cause.
          </p>
          <pre
            className="card"
            style={{ whiteSpace: "pre-wrap", overflowX: "auto", color: "var(--bad)" }}
          >
            {error.message}
          </pre>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </section>
      </main>
    );
  }
}
