import { describe, expect, it, vi } from "vitest";
import {
  OPEN_ASR_LEADERBOARD_URL,
  fetchAsrLeaderboardRows,
  mapAsrLeaderboardRows,
  parseAsrCsv,
} from "../scripts/asr-leaderboard.mjs";

const csv = `model,RTFx,License,Size (B),# Languages,Encoder,Decoder,AMI WER,Earnings22 WER,Gigaspeech WER,LS Clean WER,LS Other WER,SPGISpeech WER,Voxpopuli WER
slow/model,12.5,apache-2.0,1,1,enc,dec,10,,20,30,,,
best/model,,mit,1,1,enc,dec,5,6,7,8,9,10,11
blank/model,1.0,bsd,1,1,enc,dec,,,,,,,
`; 

describe("Open ASR leaderboard helpers", () => {
  it("parses CSV rows with Open ASR leaderboard columns", () => {
    const rows = parseAsrCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ model: "slow/model", "AMI WER": "10", "Gigaspeech WER": "20" });
  });

  it("averages available WER columns, ignores blanks, normalizes nullable fields, and sorts lower first", () => {
    const rows = mapAsrLeaderboardRows(parseAsrCsv(csv), "https://example.test/asr.csv");

    expect(rows).toEqual([
      {
        model: "best/model",
        avg_wer: 8,
        rtfx: null,
        license: "mit",
        datasets_count: 7,
        source_url: "https://example.test/asr.csv",
      },
      {
        model: "slow/model",
        avg_wer: 20,
        rtfx: 12.5,
        license: "apache-2.0",
        datasets_count: 3,
        source_url: "https://example.test/asr.csv",
      },
    ]);
  });

  it("fetches with a descriptive User-Agent, follows redirects, and maps rows", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      text: async () => csv,
    }));

    const rows = await fetchAsrLeaderboardRows(fetchImpl, console);

    expect(fetchImpl).toHaveBeenCalledWith(
      OPEN_ASR_LEADERBOARD_URL,
      expect.objectContaining({
        redirect: "follow",
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("AIProgressTracker"),
          Accept: expect.stringContaining("text/csv"),
        }),
      })
    );
    expect(rows[0].model).toBe("best/model");
  });

  it("logs a warning and returns an empty list if fetch fails", async () => {
    const logger = { warn: vi.fn() };
    const rows = await fetchAsrLeaderboardRows(async () => {
      throw new Error("network down");
    }, logger);

    expect(rows).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Open ASR Leaderboard fetch failed"));
  });
});
