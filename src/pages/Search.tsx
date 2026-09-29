import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { searchAll } from '@/lib/data';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { truncate } from '@/lib/format';
import type { Customer, TicketWithCustomer } from '@/types';
import { Search, Users, Inbox, ArrowRight } from 'lucide-react';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ customers: Customer[]; tickets: TicketWithCustomer[] }>({ customers: [], tickets: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.trim().length >= 2) {
        doSearch(query);
      } else {
        setResults({ customers: [], tickets: [] });
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const doSearch = async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchAll(q);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results.customers.length > 0 || results.tickets.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2 mb-4">
        <Search size={24} />
        Search
      </h1>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          autoFocus
          className="input pl-10 py-3 text-base"
          placeholder="Search customers, tickets, companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer-bg h-16 rounded-xl" />)}
        </div>
      ) : !searched ? (
        <div className="text-center py-12 text-ink-400">
          <Search size={48} className="mx-auto mb-3 text-ink-200" />
          <p>Start typing to search across customers and tickets</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-12 text-ink-400">
          <p>No results for "{query}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.customers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Users size={14} />
                Customers ({results.customers.length})
              </h2>
              <div className="space-y-2">
                {results.customers.map((c) => (
                  <Link key={c.id} to={`/customers/${c.id}`}>
                    <div className="card p-3 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer flex items-center gap-3">
                      <Avatar name={c.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink-900">{c.name}</p>
                        <p className="text-sm text-ink-500">{c.company} · {c.email}</p>
                      </div>
                      <ArrowRight size={16} className="text-ink-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.tickets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Inbox size={14} />
                Tickets ({results.tickets.length})
              </h2>
              <div className="space-y-2">
                {results.tickets.map((t) => (
                  <Link key={t.id} to="/workspace">
                    <div className="card p-3 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-ink-900 truncate">{t.title}</p>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-500">
                        {t.customer && <Avatar name={t.customer.name} size="xs" />}
                        <span>{t.customer?.name ?? 'Unknown'}</span>
                        {t.description && (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="truncate">{truncate(t.description, 60)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
