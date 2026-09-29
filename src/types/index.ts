export type AccountStatus = 'active' | 'inactive' | 'trial';
export type Plan = 'standard' | 'pro' | 'enterprise';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type MessageRole = 'customer' | 'agent' | 'system';
export type OutcomeType = 'resolved' | 'partial' | 'unresolved' | 'escalated';
export type MemoryEventType = 'retain' | 'recall';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  product: string;
  account_status: AccountStatus;
  plan: Plan;
  created_at: string;
}

export interface Ticket {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Conversation {
  id: string;
  ticket_id: string;
  customer_id: string;
  started_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  memory_recalled: MemoryRecallResult[] | null;
  memory_retained: MemoryRetainResult[] | null;
  created_at: string;
}

export interface Outcome {
  id: string;
  ticket_id: string;
  outcome: OutcomeType;
  solution_summary: string;
  created_at: string;
}

export interface MemoryEvent {
  id: string;
  customer_id: string;
  event_type: MemoryEventType;
  content: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MemoryRecallResult {
  text: string;
  context?: string;
  score?: number;
  type?: string;
  tags?: string[];
  occurred_start?: string;
  occurred_end?: string;
}

export interface MemoryRetainResult {
  text: string;
  tags: string[];
  context?: string;
}

export interface AgentResponse {
  response: string;
  recalledMemories: MemoryRecallResult[];
  memoryRetained: MemoryRetainResult[];
  messageId: string;
}

export interface AgentRequest {
  customerId: string;
  conversationId: string;
  message: string;
  memoryEnabled: boolean;
}

export interface CustomerWithStats extends Customer {
  ticket_count: number;
  open_tickets: number;
  resolved_tickets: number;
  last_interaction: string | null;
}

export interface TicketWithCustomer extends Ticket {
  customer?: Customer;
  message_count?: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  avgResolutionTime: string | null;
  memoryEventsCount: number;
  recallCount: number;
  retainCount: number;
  recentTickets: TicketWithCustomer[];
  categoryBreakdown: Record<string, number>;
}
