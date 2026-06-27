import { votesToVerify } from "../lib/verification";

interface Props {
  score: number;
  myVote: number; // -1, 0, or 1
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
  showNeeded?: boolean;
}

export function VoteButtons({ score, myVote, onVote, disabled, showNeeded }: Props) {
  const needed = votesToVerify(score);
  return (
    <div className="row" style={{ gap: 10 }}>
      <div className="vote">
        <button
          className={`up ${myVote === 1 ? "active" : ""}`}
          disabled={disabled}
          onClick={() => onVote(1)}
          title="Looks correct"
        >
          ▲
        </button>
        <span className="score">{score > 0 ? `+${score}` : score}</span>
        <button
          className={`down ${myVote === -1 ? "active" : ""}`}
          disabled={disabled}
          onClick={() => onVote(-1)}
          title="Looks wrong"
        >
          ▼
        </button>
      </div>
      {showNeeded && needed > 0 && (
        <span className="muted small">{needed} more to verify</span>
      )}
    </div>
  );
}
