import { DataPointStatus } from "../lib/types";

const MAP: Record<DataPointStatus, { cls: string; label: string }> = {
  verified: { cls: "badge-verified", label: "Verified" },
  pending: { cls: "badge-pending", label: "Pending" },
  rejected: { cls: "badge-rejected", label: "Rejected" },
};

export function StatusBadge({ status }: { status: DataPointStatus }) {
  const { cls, label } = MAP[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
