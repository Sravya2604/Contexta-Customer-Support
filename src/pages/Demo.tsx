import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { getCustomer, getCustomerTickets, getTicketConversations, getConversationMessages, createConversation, insertMessage } from '@/lib/data';
import { sendAgentMessage } from '@/lib/agent';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo, truncate } from '@/lib/format';
import type { Customer, Ticket, Message, MemoryRecallResult, MemoryRetainResult } from '@/types';
import {
  Brain, Send, Sparkles, ArrowRight, ArrowLeft, CheckCircle2,
  AlertCircle, Zap, Eye, Repeat, Lightbulb, Play, RotateCcw,
} from 'lucide-react';

const DEMO_CUSTOMER_ID = 'c1000001-0000-0000-0000-000000000001';
const DEMO_TICKET_ID = 'a1000001-0000-0000-0000-000000000003';

const SCENARIO_STEPS = [
  { title: 'Meet Priya', desc: 'Priya has 2 previous resolved issues. She\'s coming back with a similar problem.' },
  { title: 'Send a message', desc: 'Type: "I\'m having trouble uploading a document again." and watch the agent respond.' },
  { title: 'Toggle memory OFF', desc: 'Turn off memory and send the same message. See the difference.' },
  { title: 'Toggle memory ON', desc: 'Turn memory back on. The agent recalls everything it knows about Priya.' },
];

export function Demo() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [c, t] = await Promise.all([
        getCustomer(DEMO_CUSTOMER_ID),
        getCustomerTickets(DEMO_CUSTOMER_ID),
      ]);
      setCustomer(c);
      setTickets(t);

      const convs = await getTicketConversations(DEMO_TICKET_ID);
      if (convs.length > 0) {
        setConversationId(convs[0].id);
        const msgs = await getConversationMessages(convs[0].id);
        setMessages(msgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const messageText = (overrideMessage ?? input).trim();
    if (!messageText || !customer || sending) return;

    let convId = conversationId;
    if (!convId) {
      try {
        const conv = await createConversation(DEMO_TICKET_ID, DEMO_CUSTOMER_ID);
        convId = conv.id;
        setConversationId(conv.id);
      } catch (err) {
        setError('Failed to create conversation');
        return;
      }
    }

    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: convId,
      role: 'customer',
      content: messageText,
      memory_recalled: null,
      memory_retained: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const result = await sendAgentMessage(convId, customer.id, messageText, memoryEnabled);
      const agentMessage: Message = {
        id: result.messageId,
        conversation_id: convId,
        role: 'agent',
        content: result.response,
        memory_recalled: result.recalledMemories ?? null,
        memory_retained: result.memoryRetained ?? null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setStep((s) => Math.min(s + 1, SCENARIO_STEPS.length - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const resetDemo = () => {
    setMessages([]);
    setStep(0);
    setError(null);
    setMemoryEnabled(true);
  };

  const lastAgentMessage = [...messages].reverse().find((m) => m.role === 'agent');
  const recalledMemories = (lastAgentMessage?.memory_recalled ?? []) as MemoryRecallResult[];
  const retainedMemories = (lastAgentMessage?.memory_retained ?? []) as MemoryRetainResult[];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="shimmer-bg h-32 rounded-xl mb-4" />
        <div className="shimmer-bg h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-4">
          <Play size={14} />
          Guided Demo
        </div>
        <h1 className="text-3xl font-bold text-ink-900">See memory in action</h1>
        <p className="text-lg text-ink-600 mt-2">Follow the steps to experience the difference memory makes.</p>
      </div>

      <div className="card p-4 mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white flex-shrink-0">
            <Lightbulb size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900">Step {step + 1}: {SCENARIO_STEPS[step].title}</p>
            <p className="text-sm text-ink-600 mt-0.5">{SCENARIO_STEPS[step].desc}</p>
          </div>
          <div className="flex gap-1">
            {SCENARIO_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i <= step ? 'bg-primary-500' : 'bg-ink-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="bg-white border-b border-ink-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {customer && <Avatar name={customer.name} size="md" />}
                <div>
                  <Link to={`/customers/${customer?.id ?? ''}`}>
                    <h3 className="font-semibold text-ink-900 hover:text-primary-600">{customer?.name}</h3>
                  </Link>
                  <p className="text-xs text-ink-500">{customer?.company} · {tickets.length} tickets</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetDemo}
                  className="btn-ghost p-2"
                  title="Reset demo"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setMemoryEnabled(!memoryEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    memoryEnabled
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'bg-ink-100 text-ink-500 border border-ink-200'
                  }`}
                >
                  <Brain size={14} className={memoryEnabled ? 'text-primary-600' : 'text-ink-400'} />
                  Memory {memoryEnabled ? 'ON' : 'OFF'}
                  <div className={`w-8 h-4 rounded-full transition-colors ${memoryEnabled ? 'bg-primary-500' : 'bg-ink-300'} relative`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${memoryEnabled ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 bg-ink-50">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-ink-400">
                <Brain size={48} className="mx-auto mb-3 text-ink-300" />
                <p className="text-sm">Send a message to start the demo</p>
                <p className="text-xs mt-1">Try: "I'm having trouble uploading a document again."</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.role === 'agent' ? '' : 'flex-row-reverse'}`}>
                  {msg.role === 'agent' ? (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white flex-shrink-0">
                      <Brain size={16} />
                    </div>
                  ) : (
                    customer && <Avatar name={customer.name} size="sm" className="w-8 h-8" />
                  )}
                  <div className={`max-w-[75%] ${msg.role === 'agent' ? '' : 'text-right'}`}>
                    {msg.role === 'agent' && msg.memory_recalled && msg.memory_recalled.length > 0 && (
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-accent-600 bg-accent-50 rounded-md px-2 py-1 w-fit">
                        <Sparkles size={12} />
                        Recalled {msg.memory_recalled.length} memor{msg.memory_recalled.length === 1 ? 'y' : 'ies'}
                      </div>
                    )}
                    <div className={`rounded-lg p-3 text-sm ${
                      msg.role === 'agent' ? 'bg-white border border-ink-200 text-ink-700' : 'bg-primary-600 text-white'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'agent' && msg.memory_retained && msg.memory_retained.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-success-600 bg-success-50 rounded-md px-2 py-1 w-fit">
                        <CheckCircle2 size={12} />
                        Retained {msg.memory_retained.length} new memor{msg.memory_retained.length === 1 ? 'y' : 'ies'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
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
            )}
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
                placeholder="Type as the customer..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sending}
              />
              <button
                className="btn-primary px-4 py-2.5"
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => { setInput("I'm having trouble uploading a document again."); }}
                className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded transition-all"
              >
                "I'm having trouble uploading a document again."
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Brain size={14} />
              Memory Status
            </h3>
            {memoryEnabled ? (
              <div className="flex items-center gap-2 text-sm text-success-600 bg-success-50 rounded-lg p-2.5">
                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Active — recalling context
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-ink-500 bg-ink-100 rounded-lg p-2.5">
                <div className="w-2 h-2 rounded-full bg-ink-400" />
                Disabled — no context
              </div>
            )}
          </div>

          {recalledMemories.length > 0 && (
            <div className="card p-4 animate-fade-in-up">
              <h3 className="text-xs font-semibold text-accent-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles size={14} />
                Recalled ({recalledMemories.length})
              </h3>
              <div className="space-y-2">
                {recalledMemories.map((mem, i) => (
                  <div key={i} className="bg-accent-50 border border-accent-100 rounded-lg p-2.5 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <p className="text-xs text-ink-700">{truncate(mem.text, 150)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {retainedMemories.length > 0 && (
            <div className="card p-4 animate-fade-in-up">
              <h3 className="text-xs font-semibold text-success-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} />
                Retained ({retainedMemories.length})
              </h3>
              <div className="space-y-2">
                {retainedMemories.map((mem, i) => (
                  <div key={i} className="bg-success-50 border border-success-100 rounded-lg p-2.5">
                    <p className="text-xs text-ink-700">{truncate(mem.text, 150)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {memoryEnabled && recalledMemories.length === 0 && retainedMemories.length === 0 && (
            <div className="card p-4 text-center">
              <Brain size={32} className="mx-auto text-ink-200 mb-2" />
              <p className="text-xs text-ink-400">No memories yet. Send a message to see memory in action.</p>
            </div>
          )}

          <div className="card p-4 bg-ink-50">
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
              Previous Issues
            </h3>
            <div className="space-y-2">
              {tickets.filter((t) => t.status === 'resolved').map((t) => (
                <div key={t.id} className="text-xs">
                  <div className="flex items-center gap-1.5 text-ink-600">
                    <CheckCircle2 size={12} className="text-success-500" />
                    {t.title}
                  </div>
                  <p className="text-ink-400 ml-4">{timeAgo(t.resolved_at ?? t.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link to="/workspace" className="btn-primary">
          Go to Full Workspace
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
