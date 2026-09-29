import { supabase } from './supabase';
import type {
  Customer,
  CustomerWithStats,
  DashboardStats,
  MemoryEvent,
  Message,
  Outcome,
  Ticket,
  TicketWithCustomer,
  Conversation,
} from '@/types';

export async function getCustomers(): Promise<CustomerWithStats[]> {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!customers) return [];

  const enriched = await Promise.all(
    customers.map(async (c: Customer) => {
      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', c.id);

      const { count: openTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', c.id)
        .in('status', ['open', 'in_progress']);

      const { count: resolvedTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', c.id)
        .eq('status', 'resolved');

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .eq('conversation_id', (
          await supabase
            .from('conversations')
            .select('id')
            .eq('customer_id', c.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single()
        ).data?.id ?? '');

      return {
        ...c,
        ticket_count: ticketCount ?? 0,
        open_tickets: openTickets ?? 0,
        resolved_tickets: resolvedTickets ?? 0,
        last_interaction: lastMsg?.[0]?.created_at ?? null,
      };
    }),
  );

  return enriched;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getCustomerTickets(customerId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCustomerMemoryEvents(customerId: string): Promise<MemoryEvent[]> {
  const { data, error } = await supabase
    .from('memory_events')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTicketConversations(ticketId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTicketOutcomes(ticketId: string): Promise<Outcome[]> {
  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllTickets(): Promise<TicketWithCustomer[]> {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, customer:customers(*)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (tickets ?? []) as TicketWithCustomer[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [customersRes, ticketsRes, memoryRes] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*'),
    supabase.from('memory_events').select('*'),
  ]);

  const totalCustomers = customersRes.count ?? 0;
  const tickets = ticketsRes.data ?? [];
  const memoryEvents = memoryRes.data ?? [];

  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const escalatedTickets = tickets.filter((t) => t.status === 'escalated').length;

  const resolvedWithTimes = tickets.filter((t) => t.status === 'resolved' && t.resolved_at);
  let avgResolutionTime: string | null = null;
  if (resolvedWithTimes.length > 0) {
    const totalMs = resolvedWithTimes.reduce((sum, t) => {
      return sum + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime());
    }, 0);
    const avgMs = totalMs / resolvedWithTimes.length;
    const hours = Math.floor(avgMs / (1000 * 60 * 60));
    const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
    avgResolutionTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  const recallCount = memoryEvents.filter((e) => e.event_type === 'recall').length;
  const retainCount = memoryEvents.filter((e) => e.event_type === 'retain').length;

  const categoryBreakdown: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] ?? 0) + 1;
  });

  const recentTickets = (tickets
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5) as TicketWithCustomer[]);

  return {
    totalCustomers,
    totalTickets: tickets.length,
    openTickets,
    resolvedTickets,
    escalatedTickets,
    avgResolutionTime,
    memoryEventsCount: memoryEvents.length,
    recallCount,
    retainCount,
    recentTickets,
    categoryBreakdown,
  };
}

export async function getMemoryEvents(): Promise<MemoryEvent[]> {
  const { data, error } = await supabase
    .from('memory_events')
    .select('*, customer:customers(*)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function createConversation(ticketId: string, customerId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ ticket_id: ticketId, customer_id: customerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertMessage(
  conversationId: string,
  role: string,
  content: string,
  memoryRecalled?: unknown,
  memoryRetained?: unknown,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      memory_recalled: memoryRecalled ?? null,
      memory_retained: memoryRetained ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
  }
  const { error } = await supabase.from('tickets').update(updates).eq('id', ticketId);
  if (error) throw error;
}

export async function searchAll(query: string): Promise<{
  customers: Customer[];
  tickets: TicketWithCustomer[];
}> {
  const [customersRes, ticketsRes] = await Promise.all([
    supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
      .limit(10),
    supabase
      .from('tickets')
      .select('*, customer:customers(*)')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10),
  ]);

  return {
    customers: customersRes.data ?? [],
    tickets: (ticketsRes.data ?? []) as TicketWithCustomer[],
  };
}
