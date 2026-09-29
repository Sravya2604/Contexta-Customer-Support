import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { getDashboardStats } from '@/lib/data';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { timeAgo, truncate } from '@/lib/format';
import type { DashboardStats } from '@/types';
import {
  LayoutDashboard, Users, Inbox, CheckCircle2, AlertTriangle,
  Brain, Clock, TrendingUp, Search, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="shimmer-bg h-24 rounded-xl mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer-bg h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2 mb-1">
        <LayoutDashboard size={24} />
        Dashboard
      </h1>
      <p className="text-sm text-ink-500 mb-6">Real-time metrics from your support operations</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Users} label="Customers" value={stats.totalCustomers} color="primary" />
        <MetricCard icon={Inbox} label="Total Tickets" value={stats.totalTickets} color="accent" />
        <MetricCard icon={AlertTriangle} label="Open" value={stats.openTickets} color="warning" />
        <MetricCard icon={CheckCircle2} label="Resolved" value={stats.resolvedTickets} color="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-ink-400" />
            <h3 className="font-semibold text-ink-900">Avg Resolution</h3>
          </div>
          <p className="text-3xl font-bold text-ink-900">{stats.avgResolutionTime ?? '—'}</p>
          <p className="text-xs text-ink-400 mt-1">Across {stats.resolvedTickets} resolved tickets</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-primary-500" />
            <h3 className="font-semibold text-ink-900">Memory Events</h3>
          </div>
          <p className="text-3xl font-bold text-primary-600">{stats.memoryEventsCount}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-success-600">{stats.retainCount} retained</span>
            <span className="text-accent-600">{stats.recallCount} recalled</span>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-danger-500" />
            <h3 className="font-semibold text-ink-900">Escalated</h3>
          </div>
          <p className="text-3xl font-bold text-danger-600">{stats.escalatedTickets}</p>
          <p className="text-xs text-ink-400 mt-1">Tickets needing senior attention</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-ink-400" />
            Recent Tickets
          </h3>
          <div className="space-y-2">
            {stats.recentTickets.map((t) => (
              <Link key={t.id} to="/workspace" className="block p-3 rounded-lg hover:bg-ink-50 transition-colors">
                <div className="flex items-center gap-3">
                  {t.customer && <Avatar name={t.customer.name} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{t.title}</p>
                    <p className="text-xs text-ink-500">{t.customer?.name} · {timeAgo(t.updated_at)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-ink-400" />
            Tickets by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const pct = (count / stats.totalTickets) * 100;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-ink-600 capitalize">{cat}</span>
                      <span className="text-ink-400 font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'warning' | 'success';
}) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    warning: 'bg-warning-50 text-warning-600',
    success: 'bg-success-50 text-success-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400 mt-0.5">{label}</p>
    </div>
  );
}
