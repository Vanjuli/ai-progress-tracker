// Pure verification rules — must mirror the Postgres trigger in supabase/schema.sql.
// Kept dependency-free so it can be unit-tested in isolation.

import { DataPointStatus } from "./types";

export const DEFAULT_VERIFY_THRESHOLD = 3;

/** Net vote score from a set of +1 / -1 votes. */
export function tallyVotes(votes: { value: number }[]): number {
  return votes.reduce((sum, v) => sum + v.value, 0);
}

export interface StatusInput {
  voteScore: number;
  threshold?: number;
  protectedRow?: boolean;
  currentStatus?: DataPointStatus;
}

/**
 * Decide a data point's status from its net vote score.
 * Crossing +threshold verifies it; crossing -threshold rejects it.
 * Protected (curated) rows keep their existing status.
 */
export function statusForVotes({
  voteScore,
  threshold = DEFAULT_VERIFY_THRESHOLD,
  protectedRow = false,
  currentStatus = "pending",
}: StatusInput): DataPointStatus {
  if (protectedRow) return currentStatus;
  if (voteScore >= threshold) return "verified";
  if (voteScore <= -threshold) return "rejected";
  return "pending";
}

/** Votes still needed to verify (0 once the threshold is met). */
export function votesToVerify(voteScore: number, threshold = DEFAULT_VERIFY_THRESHOLD): number {
  return Math.max(0, threshold - voteScore);
}
