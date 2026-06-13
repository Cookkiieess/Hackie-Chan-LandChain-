export default function StatusBadge({ approved, comment }) {
  if (approved === true) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
        Approved
      </span>
    );
  }

  if (approved === false) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
        Declined {comment ? `- ${comment}` : ""}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-600">
      Pending
    </span>
  );
}
