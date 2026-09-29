import { priorityColor, statusColor, statusLabel, planColor } from '@/lib/format';

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={priorityColor(priority)}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={statusColor(status)}>{statusLabel(status)}</span>;
}

export function PlanBadge({ plan }: { plan: string }) {
  return <span className={planColor(plan)}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>;
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="badge bg-ink-100 text-ink-600 capitalize">
      {category}
    </span>
  );
}
