import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { getMemoryEvents } from '@/lib/data';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo, truncate } from '@/lib/format';
import type { MemoryEvent, Customer } from '@/types';
import { Brain, Search, Tag, CheckCircle2, Zap, Filter } from 'lucide-react';

type MemoryEventWithCustomer = MemoryEvent & { customer: Customer | null };

export function Memory() {
  const [events, setEvents] = useState<MemoryEventWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'retain' | 'recall'>('all');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getMemoryEvents();
      setEvents(data as MemoryEventWithCustomer[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((e) => filter === 'all' || e.event_type === filter);
  const retainCount = events.filter((e) => e.event_type === 'retain').length;
  const recallCount = events.filter((e) => e.event_type === 'recall').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2 mb-1">
        <Brain size={24} />
        Memory Insights
      </h1>
      <p className="text-sm text-ink-500 mb-6">Every memory retained and recalled across all customers</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-success-600" />
            <span className="text-sm text-ink-500">Retained</span>
          </div>
          <p className="text-2xl font-bold text-success-600">{retainCount}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search size={18} className="text-accent-600" />
            <span className="text-sm text-ink-500">Recalled</span>
          </div>
          <p className="text-2xl font-bold text-accent-600">{recallCount}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-primary-600" />
            <span className="text-sm text-ink-500">Total Events</span>
          </div>
          <p className="text-2xl font-bold text-primary-600">{events.length}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {[
          { id: 'all', label: 'All' },
          { id: 'retain', label: 'Retained' },
          { id: 'recall', label: 'Recalled' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-ink-500 hover:bg-ink-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="shimmer-bg h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Brain size={48} className="mx-auto text-ink-200 mb-3" />
          <p className="text-ink-400">No memory events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <div key={event.id} className="card p-4 animate-fade-in-up">
              <div className="flex items-start gap-3">
                {event.customer && <Avatar name={event.customer.name} size="md" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {event.customer && (
                        <Link to={`/customers/${event.customer.id}`}>
                          <span className="font-medium text-sm text-ink-900 hover:text-primary-600">{event.customer.name}</span>
                        </Link>
                      )}
                      <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                        event.event_type === 'retain'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-accent-100 text-accent-700'
                      }`}>
                        {event.event_type === 'retain' ? 'Retained' : 'Recalled'}
                      </span>
                    </div>
                    <span className="text-xs text-ink-400 flex-shrink-0">{timeAgo(event.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink-700 mt-1">{event.content}</p>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-ink-100 text-ink-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
