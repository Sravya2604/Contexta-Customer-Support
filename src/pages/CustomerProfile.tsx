import { useState, useEffect } from 'react';
import { useRoute, Link } from '@/lib/router';
import {
  getCustomer, getCustomerTickets, getCustomerMemoryEvents,
  getTicketConversations, getConversationMessages, getTicketOutcomes,
} from '@/lib/data';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge, StatusBadge, CategoryBadge, PlanBadge } from '@/components/ui/Badge';
import { timeAgo, formatDate, formatDateTime, truncate } from '@/lib/format';
import type { Customer, Ticket, MemoryEvent, Outcome, Message } from '@/types';
import {
  ArrowLeft, Mail, Building2, Package, Calendar, Brain,
  CheckCircle2, Search, MessageSquare, Tag, Zap, Clock,
} from 'lucide-react';

export function CustomerProfile() {
  const route = useRoute();
  const customerId = route.path.split('/')[2];
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [memoryEvents, setMemoryEvents] = useState<MemoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'memory' | 'tickets'>('timeline');

  useEffect(() => {
    load();
  }, [customerId]);

  const load = async () => {
    setLoading(true);
    try {
      const [c, t, m] = await Promise.all([
        getCustomer(customerId),
        getCustomerTickets(customerId),
        getCustomerMemoryEvents(customerId),
      ]);
      setCustomer(c);
      setTickets(t);
      setMemoryEvents(m);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="shimmer-bg h-32 rounded-xl mb-4" />
        <div className="shimmer-bg h-64 rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-ink-400">Customer not found</div>;
  }

  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const retainCount = memoryEvents.filter((e) => e.event_type === 'retain').length;
  const recallCount = memoryEvents.filter((e) => e.event_type === 'recall').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/customers" className="btn-ghost mb-4 -ml-2">
        <ArrowLeft size={16} />
        Back to Customers
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar name={customer.name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink-900">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-ink-500">
              <span className="flex items-center gap-1.5"><Mail size={14} />{customer.email}</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} />{customer.company}</span>
              <span className="flex items-center gap-1.5"><Package size={14} />{customer.product}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <PlanBadge plan={customer.plan} />
              <span className="badge-success">{customer.account_status}</span>
              <span className="text-xs text-ink-400 flex items-center gap-1">
                <Calendar size={12} />
                Since {formatDate(customer.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-ink-100">
          <Stat label="Tickets" value={tickets.length} />
          <Stat label="Open" value={openTickets} color="text-warning-600" />
          <Stat label="Resolved" value={resolvedTickets} color="text-success-600" />
          <Stat label="Memories" value={memoryEvents.length} color="text-primary-600" />
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-ink-200">
        {[
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'tickets', label: 'Tickets', icon: MessageSquare },
          { id: 'memory', label: 'Memory History', icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'timeline' && <TimelineView tickets={tickets} />}
      {activeTab === 'tickets' && <TicketsView tickets={tickets} />}
      {activeTab === 'memory' && <MemoryView events={memoryEvents} />}
    </div>
  );
}

function Stat({ label, value, color = 'text-ink-900' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

function TimelineView({ tickets }: { tickets: Ticket[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Record<string, Message[]>>({});
  const [ticketOutcomes, setTicketOutcomes] = useState<Record<string, Outcome[]>>({});

  const toggleExpand = async (ticketId: string) => {
    if (expanded === ticketId) {
      setExpanded(null);
      return;
    }
    setExpanded(ticketId);
    if (!ticketMessages[ticketId]) {
      const convs = await getTicketConversations(ticketId);
      if (convs.length > 0) {
        const [msgs, outcomes] = await Promise.all([
          getConversationMessages(convs[0].id),
          getTicketOutcomes(ticketId),
        ]);
        setTicketMessages((prev) => ({ ...prev, [ticketId]: msgs }));
        setTicketOutcomes((prev) => ({ ...prev, [ticketId]: outcomes }));
      }
    }
  };

  const sorted = [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-3">
      {sorted.map((ticket) => {
        const isExpanded = expanded === ticket.id;
        const msgs = ticketMessages[ticket.id] ?? [];
        const outcomes = ticketOutcomes[ticket.id] ?? [];
        return (
          <div key={ticket.id} className="card overflow-hidden">
            <button
              onClick={() => toggleExpand(ticket.id)}
              className="w-full text-left p-4 hover:bg-ink-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <CategoryBadge category={ticket.category} />
                  </div>
                  <h3 className="font-medium text-ink-900">{ticket.title}</h3>
                  {ticket.description && <p className="text-sm text-ink-500 mt-1">{ticket.description}</p>}
                </div>
                <span className="text-xs text-ink-400 flex-shrink-0">{formatDate(ticket.created_at)}</span>
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-ink-100 p-4 bg-ink-50 space-y-3 animate-fade-in">
                {msgs.length === 0 ? (
                  <p className="text-sm text-ink-400 text-center py-4">No messages in this ticket</p>
                ) : (
                  msgs.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'agent' ? '' : 'flex-row-reverse'}`}>
                      <div className={`max-w-[80%] rounded-lg p-2.5 text-sm ${
                        msg.role === 'agent' ? 'bg-white border border-ink-200 text-ink-700' : 'bg-primary-600 text-white'
                      }`}>
                        <p className="text-xs text-ink-400 mb-1">{msg.role === 'agent' ? 'Agent' : 'Customer'} · {formatDateTime(msg.created_at)}</p>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {outcomes.length > 0 && (
                  <div className="bg-success-50 border border-success-100 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={16} className="text-success-600" />
                      <span className="text-sm font-medium text-success-700">Resolution</span>
                    </div>
                    <p className="text-sm text-ink-700">{outcomes[0].solution_summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TicketsView({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div key={t.id} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                <CategoryBadge category={t.category} />
              </div>
              <h3 className="font-medium text-ink-900">{t.title}</h3>
              {t.description && <p className="text-sm text-ink-500 mt-1">{t.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                <span>Created {formatDate(t.created_at)}</span>
                {t.resolved_at && <span>Resolved {formatDate(t.resolved_at)}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MemoryView({ events }: { events: MemoryEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Brain size={48} className="mx-auto text-ink-200 mb-3" />
        <p className="text-ink-400">No memory events yet</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="card p-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              event.event_type === 'retain' ? 'bg-success-100 text-success-600' : 'bg-accent-100 text-accent-600'
            }`}>
              {event.event_type === 'retain' ? <CheckCircle2 size={16} /> : <Search size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold uppercase ${
                  event.event_type === 'retain' ? 'text-success-600' : 'text-accent-600'
                }`}>
                  {event.event_type === 'retain' ? 'Retained' : 'Recalled'}
                </span>
                <span className="text-xs text-ink-400">{timeAgo(event.created_at)}</span>
              </div>
              <p className="text-sm text-ink-700">{event.content}</p>
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-ink-100 text-ink-600 px-1.5 py-0.5 rounded">
                      <Tag size={10} className="inline mr-0.5" />
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
  );
}
