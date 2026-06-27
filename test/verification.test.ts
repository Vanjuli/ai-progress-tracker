import { describe, it, expect } from "vitest";
import {
  statusForVotes,
  tallyVotes,
  votesToVerify,
  DEFAULT_VERIFY_THRESHOLD,
} from "../src/lib/verification";

describe("tallyVotes", () => {
  it("sums +1 / -1 votes", () => {
    expect(tallyVotes([{ value: 1 }, { value: 1 }, { value: -1 }])).toBe(1);
    expect(tallyVotes([])).toBe(0);
  });
});

describe("statusForVotes", () => {
  it("stays pending below the threshold", () => {
    expect(statusForVotes({ voteScore: 2 })).toBe("pending");
  });

  it("verifies at or above the threshold", () => {
    expect(statusForVotes({ voteScore: DEFAULT_VERIFY_THRESHOLD })).toBe("verified");
    expect(statusForVotes({ voteScore: 5 })).toBe("verified");
  });

  it("rejects at or below the negative threshold", () => {
    expect(statusForVotes({ voteScore: -DEFAULT_VERIFY_THRESHOLD })).toBe("rejected");
    expect(statusForVotes({ voteScore: -9 })).toBe("rejected");
  });

  it("respects a custom threshold", () => {
    expect(statusForVotes({ voteScore: 2, threshold: 2 })).toBe("verified");
    expect(statusForVotes({ voteScore: 1, threshold: 2 })).toBe("pending");
  });

  it("keeps protected (curated) rows unchanged regardless of votes", () => {
    expect(
      statusForVotes({ voteScore: -10, protectedRow: true, currentStatus: "verified" })
    ).toBe("verified");
  });
});

describe("votesToVerify", () => {
  it("counts remaining votes needed", () => {
    expect(votesToVerify(0)).toBe(DEFAULT_VERIFY_THRESHOLD);
    expect(votesToVerify(2)).toBe(1);
    expect(votesToVerify(3)).toBe(0);
    expect(votesToVerify(5)).toBe(0);
  });
});
