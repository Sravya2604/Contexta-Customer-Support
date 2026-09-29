import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { getCustomers } from '@/lib/data';
import { Avatar } from '@/components/ui/Avatar';
import { PlanBadge } from '@/components/ui/Badge';
import { timeAgo, truncate } from '@/lib/format';
import type { CustomerWithStats } from '@/types';
import { Search, Users, Loader2 } from 'lucide-react';

export function Customers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <Users size={24} />
            Customers
          </h1>
          <p className="text-sm text-ink-500 mt-1">{customers.length} customers with persistent memory</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          className="input pl-9"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="shimmer-bg h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} to={`/customers/${c.id}`}>
              <div className="card p-5 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer h-full">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={c.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 truncate">{c.name}</h3>
                    <p className="text-sm text-ink-500 truncate">{c.company}</p>
                    <p className="text-xs text-ink-400 truncate">{c.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <PlanBadge plan={c.plan} />
                  <span className="text-xs text-ink-400">{timeAgo(c.created_at)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-ink-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-ink-900">{c.ticket_count}</p>
                    <p className="text-xs text-ink-400">Tickets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-warning-600">{c.open_tickets}</p>
                    <p className="text-xs text-ink-400">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success-600">{c.resolved_tickets}</p>
                    <p className="text-xs text-ink-400">Resolved</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
