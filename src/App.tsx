import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Header } from "./components/Header";

// Route-level code splitting: each page (and the chart-heavy ones in particular)
// loads as its own chunk, so non-chart routes don't pull in Recharts.
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const FieldPage = lazy(() => import("./pages/FieldPage").then((m) => ({ default: m.FieldPage })));
const BenchmarkPage = lazy(() =>
  import("./pages/BenchmarkPage").then((m) => ({ default: m.BenchmarkPage }))
);
const SubmitPage = lazy(() => import("./pages/SubmitPage").then((m) => ({ default: m.SubmitPage })));
const PendingPage = lazy(() =>
  import("./pages/PendingPage").then((m) => ({ default: m.PendingPage }))
);
const SignInPage = lazy(() => import("./pages/SignInPage").then((m) => ({ default: m.SignInPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ComparePage = lazy(() =>
  import("./pages/ComparePage").then((m) => ({ default: m.ComparePage }))
);

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Suspense fallback={<p className="section muted">Loading…</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/field/:slug" element={<FieldPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/benchmark/:slug" element={<BenchmarkPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/pending" element={<PendingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<p className="section">Page not found.</p>} />
          </Routes>
        </Suspense>
      </main>
      <footer className="footer">
        <div className="container">
          AI Progress Tracker — community-verified benchmark data. Seed figures are
          approximate; verify against original sources.
        </div>
      </footer>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
