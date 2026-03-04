import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Slide Data ───────────────────────────────────────────────────────────────

const slides = [
  {
    id: 1,
    label: 'The Hook',
    component: Slide1,
  },
  {
    id: 2,
    label: 'The Problem',
    component: Slide2,
  },
  {
    id: 3,
    label: 'The Solution',
    component: Slide3,
  },
  {
    id: 4,
    label: 'Market',
    component: Slide4,
  },
  {
    id: 5,
    label: 'Traction',
    component: Slide5,
  },
  {
    id: 6,
    label: 'Revenue',
    component: Slide6,
  },
];

// ─── Slide Components ─────────────────────────────────────────────────────────

function SlideWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Slide1() {
  return (
    <SlideWrapper className="bg-[#0a0f0d] text-white">
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      {/* Green radial glow */}
      <div className="absolute top-0 right-0 w-2/3 h-2/3 rounded-full opacity-20" style={{
        background: 'radial-gradient(ellipse at top right, #22c55e 0%, transparent 70%)'
      }} />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full opacity-10" style={{
        background: 'radial-gradient(ellipse at bottom left, #16a34a 0%, transparent 70%)'
      }} />

      <div className="relative z-10 flex flex-col justify-center h-full px-16 md:px-24">
        {/* Tag */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-10 bg-green-500" />
          <span className="text-green-500 text-sm font-bold uppercase tracking-[0.3em]">Investor Pitch · 2026</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          The Mechanic's<br />
          <span className="text-green-500">Truth.</span>
        </h1>

        <div className="h-1 w-32 bg-green-500 mb-8 rounded-full" />

        <p className="text-xl md:text-2xl text-white/60 max-w-2xl leading-relaxed mb-12">
          Small service providers lose{' '}
          <span className="text-white font-bold">15–20% of revenue</span> to invoice friction—
          disputed hours, forgotten parts, and late payments.
        </p>

        <div className="flex items-center gap-4 p-5 rounded-2xl border border-green-500/30 bg-green-500/5 max-w-lg">
          <div className="text-3xl">🔧</div>
          <div>
            <div className="text-green-400 font-black text-lg">The Vision</div>
            <div className="text-white/70 text-sm leading-snug">Building the "Stripe for the Trades"—where transparency is baked into the code.</div>
          </div>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-8 right-10 text-white/20 font-black text-6xl select-none">01</div>
    </SlideWrapper>
  );
}

function Slide2() {
  const problems = [
    {
      icon: '📄',
      headline: 'Invoicing is broken',
      body: 'Most apps are just digital paper. They don\'t prove work was done.',
      stat: '68%',
      statLabel: 'of disputes are over undocumented labor',
    },
    {
      icon: '🤝',
      headline: 'The "Dishonest" Reality',
      body: 'Clients are skeptical of mystery charges, leading to held payments and awkward job-site negotiations.',
      stat: '$12B+',
      statLabel: 'in disputed invoices annually',
    },
    {
      icon: '💸',
      headline: 'Cash Flow Killers',
      body: 'Traditional invoicing takes days to process, but parts and fuel cost money today.',
      stat: '47 days',
      statLabel: 'average payment delay in trades',
    },
  ];

  return (
    <SlideWrapper className="bg-[#0f0a0a] text-white">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 flex flex-col h-full px-12 md:px-20 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-red-500" />
            <span className="text-red-500 text-xs font-bold uppercase tracking-[0.3em]">The Problem</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            The <span className="text-red-500">Trust Gap.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
          {problems.map((p) => (
            <div key={p.headline} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4 group hover:border-red-500/40 transition-colors">
              <div className="text-4xl">{p.icon}</div>
              <div>
                <h3 className="font-black text-lg text-white mb-1">{p.headline}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.body}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-white/10">
                <div className="text-3xl font-black text-red-400">{p.stat}</div>
                <div className="text-white/40 text-xs mt-0.5">{p.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-10 text-white/10 font-black text-6xl select-none">02</div>
    </SlideWrapper>
  );
}

function Slide3() {
  const solutions = [
    {
      icon: '📸',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      headline: 'Live Proof-of-Work',
      body: 'Photo/video timestamps integrated directly into line items. Every charge has evidence.',
    },
    {
      icon: '👁️',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      headline: 'Automated Transparency',
      body: 'A "Client View" that updates in real-time as the mechanic checks off tasks—no more surprises.',
    },
    {
      icon: '⚡',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      headline: 'Frictionless Settlement',
      body: 'One-click payments triggered the moment the job is marked complete. No more "I\'ll pay you when I get home."',
    },
  ];

  return (
    <SlideWrapper className="bg-[#060f0a] text-white">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 via-green-400 to-green-600" />
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-10" style={{
        background: 'radial-gradient(ellipse at right, #22c55e 0%, transparent 60%)'
      }} />

      <div className="relative z-10 flex flex-col h-full px-12 md:px-20 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-green-500" />
            <span className="text-green-500 text-xs font-bold uppercase tracking-[0.3em]">The Solution</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Honest Invoice.<br />
            <span className="text-green-500">Built Different.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
          {solutions.map((s) => (
            <div key={s.headline} className={`rounded-2xl border ${s.border} ${s.bg} p-7 flex flex-col gap-4`}>
              <div className={`w-14 h-14 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center text-2xl`}>{s.icon}</div>
              <h3 className={`font-black text-xl ${s.color}`}>{s.headline}</h3>
              <p className="text-white/60 text-sm leading-relaxed flex-1">{s.body}</p>
              <div className={`h-1 w-12 rounded-full ${s.color.replace('text', 'bg')}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-10 text-white/10 font-black text-6xl select-none">03</div>
    </SlideWrapper>
  );
}

function Slide4() {
  return (
    <SlideWrapper className="bg-[#09090f] text-white">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600" />
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(135deg, #7c3aed 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 flex flex-col h-full px-12 md:px-20 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-purple-500" />
            <span className="text-purple-500 text-xs font-bold uppercase tracking-[0.3em]">Market Opportunity</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            The <span className="text-purple-400">Why Now.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {/* Left: Big numbers */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-7 flex-1">
              <div className="text-5xl md:text-6xl font-black text-purple-400 mb-2">$1.8T</div>
              <div className="text-white font-bold text-lg mb-2">US Trades & Field Services Market</div>
              <div className="text-white/50 text-sm">Mechanics, detailers, HVAC, plumbing, IV drips, pet grooming—all moving mobile-first.</div>
            </div>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-7 flex-1">
              <div className="text-5xl md:text-6xl font-black text-indigo-400 mb-2">73%</div>
              <div className="text-white font-bold text-lg mb-2">Still on paper or spreadsheets</div>
              <div className="text-white/50 text-sm">Massive untapped digital conversion opportunity with low existing competition in trust-layer tooling.</div>
            </div>
          </div>

          {/* Right: Trends */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-2xl mb-3">🔵</div>
              <h3 className="font-black text-lg text-white mb-1">Blue Collar Digitization</h3>
              <p className="text-white/50 text-sm leading-relaxed">The skilled trades are finally moving away from paper. New generation of tradespeople expect mobile-first tools as good as the apps they use personally.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="font-black text-lg text-white mb-1">The Mobile Economy</h3>
              <p className="text-white/50 text-sm leading-relaxed">More services come to the consumer. These mobile pros need a mobile-first HQ that handles proof, payment, and client trust in one shot.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-10 text-white/10 font-black text-6xl select-none">04</div>
    </SlideWrapper>
  );
}

function Slide5() {
  return (
    <SlideWrapper className="bg-[#0a0d07] text-white">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, #eab308 1px, transparent 1px)',
        backgroundSize: '35px 35px'
      }} />

      <div className="relative z-10 flex flex-col h-full px-12 md:px-20 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-yellow-500" />
            <span className="text-yellow-500 text-xs font-bold uppercase tracking-[0.3em]">Traction & Dogfooding</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Built in the <span className="text-yellow-400">Field.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {/* Main highlight */}
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/5 p-8 flex flex-col">
            <div className="text-5xl mb-4">🔩</div>
            <h3 className="font-black text-2xl text-yellow-400 mb-3">The Mobile Mechanic Lab</h3>
            <p className="text-white/70 text-base leading-relaxed flex-1">
              This software is being <span className="text-white font-bold">built and tested in the field</span> by an actual mechanic—not a startup in a conference room. Every feature solves a real problem encountered on real job sites.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-1">Strategic Moat</div>
              <div className="text-white/60 text-sm">Dogfooding creates features competitors can't guess. The product roadmap is a direct transcript of daily field friction.</div>
            </div>
          </div>

          {/* Unit Economics */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-white/40 text-xs uppercase tracking-wider font-bold mb-4">Unit Economics — Before / After</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">Payment delay (avg)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 line-through text-xs">14 days</span>
                      <span className="text-green-400 font-bold">Same day</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[90%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">Disputed invoices</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 line-through text-xs">~20%</span>
                      <span className="text-green-400 font-bold">~2%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[90%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">Avg ticket size</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 line-through text-xs">$280</span>
                      <span className="text-green-400 font-bold">$340+</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex-1">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="text-white font-black text-lg mb-1">Better Docs = Bigger Tickets</h3>
              <p className="text-white/50 text-sm leading-relaxed">When every line item has photo proof, clients approve premium work more readily. Trust translates directly to revenue.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-10 text-white/10 font-black text-6xl select-none">05</div>
    </SlideWrapper>
  );
}

function Slide6() {
  const tiers = [
    {
      icon: '📦',
      name: 'SaaS Subscription',
      color: 'text-green-400',
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      price: '$29–$79/mo',
      description: 'Pro CRM, scheduling, client portal, team accounts. Recurring, predictable revenue.',
    },
    {
      icon: '💳',
      name: 'Transaction Fee',
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      price: '1.5% per invoice',
      description: 'Small cut of every Honest Invoice processed. Aligns incentives—we win when they win.',
    },
    {
      icon: '🏦',
      name: 'Trade Financing (Future)',
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/5',
      price: 'Revenue share',
      description: 'BNPL for expensive repairs (e.g. a $2,000 engine swap). Invoice data is the underwriting. Massive TAM expansion.',
    },
  ];

  return (
    <SlideWrapper className="bg-[#07090f] text-white">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(45deg, #22c55e 1px, transparent 1px), linear-gradient(-45deg, #7c3aed 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 flex flex-col h-full px-12 md:px-20 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-green-500" />
            <span className="text-green-500 text-xs font-bold uppercase tracking-[0.3em]">Revenue Model</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Three Ways to <span className="text-green-400">Win.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border ${t.border} ${t.bg} p-7 flex flex-col`}>
              <div className="text-4xl mb-4">{t.icon}</div>
              <div className={`text-xs font-bold uppercase tracking-widest ${t.color} mb-1`}>{t.name}</div>
              <div className="text-3xl font-black text-white mb-3">{t.price}</div>
              <p className="text-white/55 text-sm leading-relaxed flex-1">{t.description}</p>
              <div className={`mt-5 h-1 w-full rounded-full ${t.color.replace('text', 'bg')} opacity-40`} />
            </div>
          ))}
        </div>

        {/* Closing note */}
        <div className="mt-6 flex items-center justify-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <img src={logoLight} className="h-8 w-8 opacity-80" alt="Honest Invoice" />
          <span className="text-white/50 text-sm">
            <span className="text-white font-bold">Honest Invoice</span> — The Stripe for the Trades. Built by a mechanic. Trusted by the field.
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 right-10 text-white/10 font-black text-6xl select-none">06</div>
    </SlideWrapper>
  );
}

// ─── Main Deck ────────────────────────────────────────────────────────────────

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;
  const total = slides.length;

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const SlideComponent = slides[current].component;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Honest Invoice" className="h-7 w-7" />
          <span className="text-white/70 text-sm font-bold tracking-wide">Honest Invoice · Investor Pitch</span>
        </div>
        {/* Pill nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                i === current
                  ? 'bg-green-500 text-black'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Exit
        </Link>
      </div>

      {/* Slide area */}
      <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 110px)' }}>
        <SlideComponent />
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/80 backdrop-blur z-20">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 text-white/50 hover:text-white disabled:opacity-20 text-sm font-medium transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-6 h-2 bg-green-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === total - 1}
          className="flex items-center gap-2 text-white/50 hover:text-white disabled:opacity-20 text-sm font-medium transition-all"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
