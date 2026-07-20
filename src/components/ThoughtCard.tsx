import { FoodForThoughtEntry } from "../lib/types";

export function ThoughtCard({ entry }: { entry: FoodForThoughtEntry }) {
  return (
    <a className="card article-card thought-card" href={entry.sourceUrl} target="_blank" rel="noreferrer">
      <div className="topic-tags">
        <span className="topic-tag">{entry.topic}</span>
      </div>
      <h3>{entry.title}</h3>
      <p className="thought-stat">{entry.stat}</p>
      <p className="muted small">{entry.summary}</p>
      <p className="muted small">
        <strong>Where AI could help:</strong> {entry.aiAngle}
      </p>
      <div className="small muted article-meta">
        <span>{entry.source}</span>
        <span>·</span>
        <span>{entry.year} data</span>
      </div>
    </a>
  );
}
