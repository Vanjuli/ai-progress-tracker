import { parse } from "csv-parse/sync";

export const OPEN_ASR_LEADERBOARD_URL =
  "https://huggingface.co/datasets/hf-audio/open-asr-leaderboard-results/resolve/main/english_short_latest.csv";
export const OPEN_ASR_AUTO_MARKER = "auto-collected:open-asr-leaderboard";
export const ASR_WER_COLUMNS = [
  "AMI WER",
  "Earnings22 WER",
  "Gigaspeech WER",
  "LS Clean WER",
  "LS Other WER",
  "SPGISpeech WER",
  "Voxpopuli WER",
];

export function parseAsrCsv(text) {
  return parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function parseNullableNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const number = Number.parseFloat(trimmed.replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

export function mapAsrLeaderboardRows(csvRows, sourceUrl = OPEN_ASR_LEADERBOARD_URL) {
  const rows = [];

  for (const row of csvRows) {
    const model = String(row.model ?? "").trim();
    if (!model) continue;

    const werValues = ASR_WER_COLUMNS.map((column) => parseNullableNumber(row[column])).filter(
      (value) => value !== null
    );
    if (werValues.length === 0) continue;

    const avgWer = werValues.reduce((sum, value) => sum + value, 0) / werValues.length;
    rows.push({
      model,
      avg_wer: Number(avgWer.toFixed(4)),
      rtfx: parseNullableNumber(row.RTFx),
      license: String(row.License ?? "").trim() || null,
      datasets_count: werValues.length,
      source_url: sourceUrl,
    });
  }

  return rows.sort((a, b) => a.avg_wer - b.avg_wer || a.model.localeCompare(b.model));
}

export async function fetchAsrLeaderboardRows(fetchImpl = fetch, logger = console) {
  try {
    const response = await fetchImpl(OPEN_ASR_LEADERBOARD_URL, {
      redirect: "follow",
      headers: {
        "User-Agent": "AIProgressTracker/1.0 (+https://aiprogresstracker.org; Open ASR Leaderboard collector)",
        Accept: "text/csv, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return mapAsrLeaderboardRows(parseAsrCsv(await response.text()), OPEN_ASR_LEADERBOARD_URL);
  } catch (error) {
    logger.warn(`[asr] Open ASR Leaderboard fetch failed; skipping current ASR ranking: ${error?.message ?? error}`);
    return [];
  }
}
