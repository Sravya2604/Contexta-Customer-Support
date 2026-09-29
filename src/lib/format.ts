export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'badge-danger';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-primary';
    case 'low': return 'badge-neutral';
    default: return 'badge-neutral';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'resolved': return 'badge-success';
    case 'open': return 'badge-primary';
    case 'in_progress': return 'badge-warning';
    case 'escalated': return 'badge-danger';
    default: return 'badge-neutral';
  }
}

export function statusLabel(status: string): string {
  return status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function planColor(plan: string): string {
  switch (plan) {
    case 'enterprise': return 'badge-primary';
    case 'pro': return 'badge-accent';
    default: return 'badge-neutral';
  }
}

export function avatarColor(name: string): string {
  const colors = [
    'bg-primary-500', 'bg-accent-500', 'bg-success-500',
    'bg-warning-500', 'bg-danger-500', 'bg-primary-700',
  'bg-accent-700', 'bg-success-700',
  'bg-primary-400', 'bg-accent-400',
  'bg-success-400', 'bg-warning-400',
  'bg-danger-400', 'bg-primary-600',
    'bg-accent-600', 'bg-success-600',
  'bg-warning-600', 'bg-danger-600',
    'bg-primary-300', 'bg-accent-300',
    'bg-success-300', 'bg-warning-300',
    'bg-danger-300', 'bg-primary-200',
    'bg-accent-200', 'bg-success-200',
    'bg-warning-200', 'bg-danger-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

export function durationBetween(start: string | Date, end: string | Date): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
