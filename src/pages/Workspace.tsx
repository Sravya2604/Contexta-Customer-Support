import { useState, useEffect, useCallback } from 'react';
import { useRoute, Link } from '@/lib/router';
import { getAllTickets, getCustomer, getTicketConversations, getConversationMessages, createConversation, insertMessage } from '@/lib/data';
import { sendAgentMessage } from '@/lib/agent';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge, StatusBadge, CategoryBadge } from '@/components/ui/Badge';
import { timeAgo, formatTime, truncate } from '@/lib/format';
import type { TicketWithCustomer, Customer, Conversation, Message, MemoryRecallResult, MemoryRetainResult } from '@/types';
import {
  Inbox, Search, Brain, Send, Sparkles, ArrowLeft,
  CheckCircle2, AlertCircle, User, Tag, Zap, Eye, Loader2,
} from 'lucide-react';

export function Workspace() {
  const route = useRoute();
  const [tickets, setTickets] = useState<TicketWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const matchesSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className={`w-full lg:w-80 xl:w-96 border-r border-ink-200 bg-white flex flex-col ${selectedTicketId ? 'hidden lg:flex' : ''}`}>
        <div className="p-4 border-b border-ink-200">
          <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <Inbox size={18} />
            Inbox
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {['all', 'open', 'in_progress', 'resolved', 'escalated'].map((s) => (
              <button
                key={s}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-ink-500 hover:bg-ink-50'
                }`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'in_progress' ? 'Active' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shimmer-bg h-20 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-ink-400 text-sm">
              No tickets found
            </div>
          ) : (
            filtered.map((ticket) => (
              <TicketListItem
                key={ticket.id}
                ticket={ticket}
                isSelected={ticket.id === selectedTicketId}
                onClick={() => setSelectedTicketId(ticket.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 ${selectedTicketId ? '' : 'hidden lg:flex'} flex-col bg-ink-50`}>
        {selectedTicket ? (
          <ConversationPanel
            ticket={selectedTicket}
            customer={selectedTicket.customer ?? null}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-400">
            <div className="text-center">
              <Inbox size={48} className="mx-auto mb-3 text-ink-300" />
              <p>Select a ticket to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketListItem({ ticket, isSelected, onClick }: {
  ticket: TicketWithCustomer;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-ink-100 transition-all hover:bg-ink-50 ${
        isSelected ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {ticket.customer && <Avatar name={ticket.customer.name} size="sm" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm text-ink-900 truncate">{ticket.customer?.name ?? 'Unknown'}</p>
            <span className="text-xs text-ink-400 flex-shrink-0">{timeAgo(ticket.updated_at)}</span>
          </div>
          <p className="text-sm text-ink-600 truncate mt-0.5">{ticket.title}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
          </div>
        </div>
      </div>
    </button>
  );
}

function ConversationPanel({ ticket, customer, onBack }: {
  ticket: TicketWithCustomer;
  customer: Customer | null;
  onBack: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [ticket.id]);

  const loadConversations = async () => {
    setLoadingMessages(true);
    try {
      const convs = await getTicketConversations(ticket.id);
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConversation(convs[0]);
        const msgs = await getConversationMessages(convs[0].id);
        setMessages(msgs);
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !customer || sending) return;

    let conversation = activeConversation;
    if (!conversation) {
      try {
        conversation = await createConversation(ticket.id, customer.id);
        setActiveConversation(conversation);
        setConversations([conversation, ...conversations]);
      } catch (err) {
        setError('Failed to create conversation');
        return;
      }
    }

    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: conversation.id,
      role: 'customer',
      content: input.trim(),
      memory_recalled: null,
      memory_retained: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const messageText = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    try {
      const result = await sendAgentMessage(conversation.id, customer.id, messageText, memoryEnabled);
      const agentMessage: Message = {
        id: result.messageId,
        conversation_id: conversation.id,
        role: 'agent',
        content: result.response,
        memory_recalled: result.recalledMemories ?? null,
        memory_retained: result.memoryRetained ?? null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastAgentMessage = [...messages].reverse().find((m) => m.role === 'agent');
  const recalledMemories = lastAgentMessage?.memory_recalled ?? [];
  const retainedMemories = lastAgentMessage?.memory_retained ?? [];

  return (
    <div className="flex flex-1 h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-ink-200 p-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="lg:hidden btn-ghost p-2">
              <ArrowLeft size={18} />
            </button>
            {customer && <Avatar name={customer.name} size="md" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link to={`/customers/${customer?.id ?? ''}`}>
                  <h2 className="font-semibold text-ink-900 hover:text-primary-600 transition-colors">{customer?.name ?? 'Unknown'}</h2>
                </Link>
                <span className="text-ink-300">·</span>
                <span className="text-sm text-ink-500">{customer?.company}</span>
              </div>
              <p className="text-sm text-ink-500 truncate">{ticket.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>
            </div>
            <MemoryToggle enabled={memoryEnabled} onToggle={() => setMemoryEnabled(!memoryEnabled)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 bg-ink-50">
          {loadingMessages ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="shimmer-bg h-16 rounded-lg" />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <MessageSquareIcon />
              <p className="mt-2 text-sm">No messages yet. Send the first message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} customerName={customer?.name ?? 'Customer'} />)
          )}
          {sending && <TypingIndicator memoryEnabled={memoryEnabled} />}
          {error && (
            <div className="flex items-center gap-2 text-sm text-danger-600 bg-danger-50 rounded-lg p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="bg-white border-t border-ink-200 p-4">
          <div className="flex items-end gap-2">
            <textarea
              className="input flex-1 resize-none"
              rows={1}
              placeholder="Type a message as the customer..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              className="btn-primary px-4 py-2.5"
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-ink-400 mt-2">
            You're simulating the customer. The AI agent responds with memory-powered context.
          </p>
        </div>
      </div>

      <div className="hidden xl:w-80 border-l border-ink-200 bg-white overflow-y-auto scrollbar-thin">
        <ContextPanel
          customer={customer}
          recalledMemories={recalledMemories}
          retainedMemories={retainedMemories}
          memoryEnabled={memoryEnabled}
        />
      </div>
    </div>
  );
}

function MessageBubble({ message, customerName }: { message: Message; customerName: string }) {
  const isAgent = message.role === 'agent';
  return (
    <div className={`flex gap-3 animate-fade-in-up ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
      {isAgent ? (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white flex-shrink-0">
          <Brain size={16} />
        </div>
      ) : (
        <Avatar name={customerName} size="sm" className="w-8 h-8" />
      )}
      <div className={`max-w-[75%] ${isAgent ? '' : 'text-right'}`}>
        {isAgent && message.memory_recalled && message.memory_recalled.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-accent-600 bg-accent-50 rounded-md px-2 py-1 w-fit">
            <Sparkles size={12} />
            Recalled {message.memory_recalled.length} memor{message.memory_recalled.length === 1 ? 'y' : 'ies'}
          </div>
        )}
        <div className={`rounded-lg p-3 text-sm ${
          isAgent
            ? 'bg-white border border-ink-200 text-ink-700'
            : 'bg-primary-600 text-white'
        }`}>
          {message.content}
        </div>
        {isAgent && message.memory_retained && message.memory_retained.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-success-600 bg-success-50 rounded-md px-2 py-1 w-fit">
            <CheckCircle2 size={12} />
            Retained {message.memory_retained.length} new memor{message.memory_retained.length === 1 ? 'y' : 'ies'}
          </div>
        )}
        <p className="text-xs text-ink-400 mt-1">{formatTime(message.created_at)}</p>
      </div>
    </div>
  );
}

function TypingIndicator({ memoryEnabled }: { memoryEnabled: boolean }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white flex-shrink-0">
        <Brain size={16} />
      </div>
      <div className="bg-white border border-ink-200 rounded-lg p-3">
        {memoryEnabled && (
          <div className="flex items-center gap-2 text-xs text-accent-600 mb-2">
            <Sparkles size={12} className="animate-pulse" />
            Searching memory...
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function MemoryToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        enabled
          ? 'bg-primary-50 text-primary-700 border border-primary-200'
          : 'bg-ink-100 text-ink-500 border border-ink-200'
      }`}
    >
      <Brain size={14} className={enabled ? 'text-primary-600' : 'text-ink-400'} />
      Memory {enabled ? 'ON' : 'OFF'}
      <div className={`w-8 h-4 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-ink-300'} relative`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

function ContextPanel({
  customer,
  recalledMemories,
  retainedMemories,
  memoryEnabled,
}: {
  customer: Customer | null;
  recalledMemories: MemoryRecallResult[];
  retainedMemories: MemoryRetainResult[];
  memoryEnabled: boolean;
}) {
  if (!customer) return null;
  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <User size={14} />
          Customer
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={customer.name} size="md" />
          <div>
            <Link to={`/customers/${customer.id}`}>
              <p className="font-medium text-sm text-ink-900 hover:text-primary-600">{customer.name}</p>
            </Link>
            <p className="text-xs text-ink-500">{customer.email}</p>
          </div>
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between"><dt className="text-ink-400">Company</dt><dd className="text-ink-700 font-medium">{customer.company}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-400">Product</dt><dd className="text-ink-700 font-medium">{customer.product}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-400">Plan</dt><dd className="text-ink-700 font-medium capitalize">{customer.plan}</dd></div>
        </dl>
      </div>

      <div className="border-t border-ink-100 pt-4">
        <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Brain size={14} />
          Memory Status
        </h3>
        {memoryEnabled ? (
          <div className="flex items-center gap-2 text-sm text-success-600 bg-success-50 rounded-lg p-2.5">
            <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            Memory active — recalling context
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-ink-500 bg-ink-100 rounded-lg p-2.5">
            <div className="w-2 h-2 rounded-full bg-ink-400" />
            Memory disabled — no context recalled
          </div>
        )}
      </div>

      {recalledMemories.length > 0 && (
        <div className="border-t border-ink-100 pt-4 animate-fade-in-up">
          <h3 className="text-xs font-semibold text-accent-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Sparkles size={14} />
            Recalled ({recalledMemories.length})
          </h3>
          <div className="space-y-2">
            {recalledMemories.map((mem, i) => (
              <div key={i} className="bg-accent-50 border border-accent-100 rounded-lg p-2.5 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-xs text-ink-700">{truncate(mem.text, 150)}</p>
                {mem.tags && mem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {mem.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {retainedMemories.length > 0 && (
        <div className="border-t border-ink-100 pt-4 animate-fade-in-up">
          <h3 className="text-xs font-semibold text-success-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Retained ({retainedMemories.length})
          </h3>
          <div className="space-y-2">
            {retainedMemories.map((mem, i) => (
              <div key={i} className="bg-success-50 border border-success-100 rounded-lg p-2.5">
                <p className="text-xs text-ink-700">{truncate(mem.text, 150)}</p>
                {mem.tags && mem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {mem.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-success-100 text-success-700 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {memoryEnabled && recalledMemories.length === 0 && retainedMemories.length === 0 && (
        <div className="border-t border-ink-100 pt-4 text-center">
          <Brain size={32} className="mx-auto text-ink-200 mb-2" />
          <p className="text-xs text-ink-400">No memories recalled yet. Send a message to see memory in action.</p>
        </div>
      )}
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-ink-300">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
