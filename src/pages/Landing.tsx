import { Link } from '@/lib/router';
import { Logo } from '@/components/ui/Logo';
import {
  Brain, Zap, Shield, ArrowRight, CheckCircle2, MessageSquare,
  Clock, Sparkles, Users, TrendingUp, Eye, Repeat,
} from 'lucide-react';

export function Landing() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <Problem />
      <HowItWorks />
      <DemoPreview />
      <Features />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative gradient-mesh bg-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6 animate-fade-in-down">
            <Sparkles size={14} />
            Powered by Hindsight persistent memory
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 text-balance animate-fade-in-up">
            Customer support that
            <span className="block gradient-text">actually remembers</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-600 text-balance animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Contexta gives your support agents durable memory across every conversation.
            Customers explain their problem once. Never again.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/workspace" className="btn-primary px-6 py-3 text-base">
              Enter Workspace
              <ArrowRight size={18} />
            </Link>
            <Link to="/demo" className="btn-secondary px-6 py-3 text-base">
              <Eye size={18} />
              See the Demo
            </Link>
          </div>
        </div>

        <div className="mt-16 relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="card p-6 max-w-4xl mx-auto shadow-xl shadow-primary-900/5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-ink-100">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">P</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">Priya Sharma</p>
                <p className="text-xs text-ink-400">BrightPath Solutions · Enterprise</p>
              </div>
              <span className="badge-warning">In Progress</span>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 text-xs flex-shrink-0">P</div>
                <div className="flex-1 bg-ink-50 rounded-lg p-3">
                  <p className="text-sm text-ink-700">I'm having trouble uploading a document again.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white flex-shrink-0">
                  <Brain size={16} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-accent-600 bg-accent-50 rounded-md px-2 py-1 w-fit">
                    <Sparkles size={12} className="animate-pulse" />
                    Recalled 2 memories: previous PDF upload issue + your environment (Windows 11, Chrome)
                  </div>
                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-3">
                    <p className="text-sm text-ink-700">
                      Hi Priya, I see you've had upload issues before. Last time, updating the Contexta desktop app to v3.4.2 resolved it on your Windows 11 / Chrome setup. Have you tried uploading after the latest update?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">The repeat problem</h2>
          <p className="mt-3 text-lg text-ink-600">Every support conversation starts from zero. Your customers pay the price.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Repeat, title: 'Repeat questions', desc: 'What browser are you using? What OS? Have you tried clearing cache?' },
            { icon: Clock, title: 'Longer resolutions', desc: 'Re-diagnosing known issues wastes time for customers and agents.' },
            { icon: Users, title: 'Impersonal service', desc: 'Customers feel like ticket numbers, not people with history.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-danger-500" />
                </div>
                <h3 className="font-semibold text-ink-900 mb-2">{item.title}</h3>
                <p className="text-sm text-ink-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: MessageSquare, title: 'Customer reaches out', desc: 'A customer starts a new conversation. The agent picks it up in the workspace.' },
    { icon: Brain, title: 'Contexta recalls memory', desc: 'Before responding, the agent queries Hindsight for everything it knows about this customer.' },
    { icon: Zap, title: 'Agent responds with context', desc: 'The response references past issues, environment, and preferences. No repeat questions.' },
    { icon: CheckCircle2, title: 'Memory persists', desc: 'New facts from the conversation are retained for next time. The agent gets smarter.' },
  ];
  return (
    <section className="py-20 bg-ink-50 bg-dots">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">How it works</h2>
          <p className="mt-3 text-lg text-ink-600">Four steps. Zero repeated context.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative">
                <div className="card p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white">
                      <Icon size={20} />
                    </div>
                    <span className="text-3xl font-bold text-ink-200">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-ink-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-500">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-ink-300">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DemoPreview() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">See the difference</h2>
          <p className="mt-3 text-lg text-ink-600">Same customer, same problem. Memory ON vs OFF.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 border-2 border-ink-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-ink-300" />
              <span className="text-sm font-semibold text-ink-500">Memory OFF</span>
            </div>
            <div className="space-y-3">
              <div className="bg-ink-50 rounded-lg p-3 text-sm text-ink-700">
                "My uploads keep failing again."
              </div>
              <div className="bg-ink-50 rounded-lg p-3 text-sm text-ink-700">
                "I'm sorry to hear that. Can you tell me what operating system and browser you're using? What file type and size?"
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400 pt-2">
                <Clock size={14} />
                4+ questions before diagnosis
              </div>
            </div>
          </div>
          <div className="card p-6 border-2 border-primary-300 shadow-lg shadow-primary-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-sm font-semibold text-primary-700">Memory ON</span>
            </div>
            <div className="space-y-3">
              <div className="bg-ink-50 rounded-lg p-3 text-sm text-ink-700">
                "My uploads keep failing again."
              </div>
              <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 text-sm text-ink-700">
                "Hi Priya — this looks like the same upload issue from September 12. Last time, updating the desktop app to v3.4.2 fixed it on your Windows 11 / Chrome setup. Still on that version?"
              </div>
              <div className="flex items-center gap-2 text-xs text-success-600 pt-2">
                <CheckCircle2 size={14} />
                1 question. Immediate context.
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link to="/demo" className="btn-primary">
            Try it yourself
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Brain, title: 'Persistent memory', desc: 'Every fact about a customer is retained in Hindsight memory banks. Recalled instantly on new conversations.' },
    { icon: Eye, title: 'Full transparency', desc: 'See exactly what memories were recalled and retained for every message. No black boxes.' },
    { icon: Zap, title: 'Instant context', desc: 'Agents start every conversation already knowing the customer history, environment, and past solutions.' },
    { icon: Shield, title: 'Per-customer isolation', desc: 'Each customer gets their own memory bank. No cross-contamination. Complete privacy.' },
    { icon: TrendingUp, title: 'Gets smarter', desc: 'Every resolved ticket adds to the knowledge base. The agent improves with every interaction.' },
    { icon: Users, title: 'Team workspace', desc: 'A shared inbox where agents pick up conversations, see context, and resolve tickets faster.' },
  ];
  return (
    <section className="py-20 bg-ink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">Built for support teams</h2>
          <p className="mt-3 text-lg text-ink-600">Everything you need to deliver contextual, personalized support at scale.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-ink-900 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary-800 to-accent-700 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: '73%', label: 'Faster resolution' },
            { value: '0', label: 'Repeat questions' },
            { value: '100%', label: 'Context retention' },
            { value: '24/7', label: 'Always available' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-bold">{stat.value}</p>
              <p className="text-sm text-primary-200 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">Ready to remember?</h2>
        <p className="mt-3 text-lg text-ink-600">Step into the workspace and see memory-powered support in action.</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/workspace" className="btn-primary px-6 py-3 text-base">
            Enter Workspace
            <ArrowRight size={18} />
          </Link>
          <Link to="/dashboard" className="btn-secondary px-6 py-3 text-base">
            View Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-sm text-ink-400">Powered by Hindsight persistent memory · Built with Supabase</p>
      </div>
    </footer>
  );
}
