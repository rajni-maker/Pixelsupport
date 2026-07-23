"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import {
  Building2,
  Bot,
  Ticket,
  Users,
  ArrowRight,
  Play,
  Check,
  MessageSquare,
  Sparkles,
  Layers,
  Mail,
  // lucide v1 dropped brand icons (Github/Twitter), so the social links use
  // neutral equivalents with accessible labels.
  MessageCircle,
  Globe,
} from "lucide-react";

/* ───────────────────────────────────────────
   PARTICLE BACKGROUND
   ─────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Bind the narrowed context to its own const: TypeScript drops the
    // non-null narrowing inside the hoisted `animate()` below, so give it a
    // reference that is non-null by declaration.
    const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const count = 60;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
        ctx.fill();
      });

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

/* ───────────────────────────────────────────
   FLOATING GLASS CARD
   ─────────────────────────────────────────── */
function GlassCard({
  children,
  className = "",
  delay = 0,
  x = 0,
  y = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${className}`}
      style={{ x, y }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        // Derive the float duration from `delay` rather than Math.random():
        // random during render is impure and would resync on every re-render,
        // while this still de-syncs the cards from each other.
        transition={{
          duration: 4 + ((delay * 3) % 2),
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-2xl shadow-purple-500/5"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────────────────────────
   TOP NAV
   ─────────────────────────────────────────── */
function TopNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0a0a1a]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Brand doubles as the "back to landing" link from anywhere. */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/25">
            <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
          </span>
          <span className="text-[19px] font-bold tracking-tight text-white">
            PixelSupport
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25"
              >
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────────────────────
   HERO SECTION
   ─────────────────────────────────────────── */
function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  // Second argument is spring config, not another motion value.
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth / 2) * 0.02);
      mouseY.set((e.clientY - window.innerHeight / 2) * 0.02);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Built for Agencies
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              One Workspace.
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Every Conversation.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed"
          >
            Manage support for multiple client companies with AI-assisted
            ticketing, smart summaries, Slack notifications, and faster
            resolutions&mdash;all from a single workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <a
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              Book Demo
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex items-center gap-6 text-sm text-slate-500 justify-center lg:justify-start"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Cancel anytime
            </span>
          </motion.div>
        </div>

        {/* Right: AI Command Center */}
        <motion.div
          style={{ x: springX, y: springY }}
          className="relative h-[600px] hidden lg:block"
        >
          {/* Central AI Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Bot className="w-14 h-14 text-white" />
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/30 animate-ping" style={{ animationDuration: "3s" }} />
            </motion.div>
          </div>

          {/* Floating Company Cards */}
          <GlassCard className="top-8 left-8" delay={0.2} x={-20}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ashoka</p>
                <p className="text-xs text-slate-400">12 tickets</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="top-4 right-12" delay={0.3} x={20}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">BigBadBikes</p>
                <p className="text-xs text-slate-400">8 tickets</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bottom-24 left-4" delay={0.4} x={-30}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">NamanHR</p>
                <p className="text-xs text-slate-400">5 tickets</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bottom-16 right-8" delay={0.5} x={25}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Zell Education</p>
                <p className="text-xs text-slate-400">3 tickets</p>
              </div>
            </div>
          </GlassCard>

          {/* Floating Labels */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-0 bg-purple-500/10 backdrop-blur-md border border-purple-500/20 rounded-full px-4 py-2 text-xs font-medium text-purple-300"
          >
            🏢 Client Companies
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-1/3 -left-4 bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 rounded-full px-4 py-2 text-xs font-medium text-cyan-300"
          >
            🤖 AI Summary
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 -right-4 bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-full px-4 py-2 text-xs font-medium text-amber-300"
          >
            🎫 Smart Ticketing
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-32 left-1/4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full px-4 py-2 text-xs font-medium text-emerald-300"
          >
            👥 Support Team
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 right-0 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full px-4 py-2 text-xs font-medium text-blue-300"
          >
            📊 Live Analytics
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            className="absolute bottom-8 left-1/3 bg-rose-500/10 backdrop-blur-md border border-rose-500/20 rounded-full px-4 py-2 text-xs font-medium text-rose-300"
          >
            ⚡ Faster Resolution
          </motion.div>

          {/* Connection lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <motion.line
              x1="50%" y1="50%" x2="20%" y2="15%"
              stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.line
              x1="50%" y1="50%" x2="80%" y2="10%"
              stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.line
              x1="50%" y1="50%" x2="15%" y2="75%"
              stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.line
              x1="50%" y1="50%" x2="85%" y2="70%"
              stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   HOW IT WORKS SECTION
   ─────────────────────────────────────────── */
function HowItWorksSection() {
  // Label and description live together so the two can't drift apart.
  const steps = [
    {
      icon: Layers,
      label: "Organization",
      desc: "Your agency workspace",
      color: "from-purple-500 to-violet-500",
    },
    {
      icon: Building2,
      label: "Client Company",
      desc: "Your customer organization",
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: Ticket,
      label: "Ticket Created",
      desc: "Support request received",
      color: "from-rose-500 to-pink-500",
    },
    {
      icon: MessageCircle,
      label: "Slack Notification",
      desc: "Your team is alerted in real time",
      color: "from-amber-400 to-yellow-500",
    },
    {
      icon: Sparkles,
      label: "AI Summary",
      desc: "Issue analyzed instantly",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: Check,
      label: "Support Review",
      desc: "Review & edit AI draft",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: MessageSquare,
      label: "Reply Sent",
      desc: "Response delivered to client",
      color: "from-violet-500 to-fuchsia-500",
    },
  ];

  return (
    <section className="py-32 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            How PixelSupport Works
          </h2>
          <p className="text-slate-400 text-lg">From ticket to resolution in one seamless workflow</p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-cyan-500/30 to-transparent hidden md:block" />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`flex items-center gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"} text-center`}>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.label}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   FEATURES SECTION
   ─────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Ticket Summary",
      description: "Automatically summarize support requests into concise insights so your team understands the issue instantly.",
      color: "from-purple-500 to-violet-600",
      glow: "shadow-purple-500/20",
    },
    {
      icon: Users,
      title: "Smart Assignment",
      description: "Assign tickets to the right support representative for faster resolution.",
      color: "from-cyan-500 to-blue-600",
      glow: "shadow-cyan-500/20",
    },
    {
      icon: MessageSquare,
      title: "AI Draft Replies",
      description: "Generate contextual reply drafts that your support team can review, edit, and send.",
      color: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/20",
    },
    {
      icon: Layers,
      title: "Multi-Company Workspace",
      description: "Manage multiple client companies from a single organization dashboard.",
      color: "from-orange-500 to-amber-600",
      glow: "shadow-orange-500/20",
    },
    {
      icon: MessageCircle,
      title: "Slack Notifications",
      description: "Receive instant Slack notifications whenever a new ticket is created or assigned.",
      color: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20",
    },
    {
      icon: Mail,
      title: "Email Notifications",
      description: "Keep clients informed with automatic email updates as tickets progress.",
      color: "from-indigo-500 to-purple-600",
      glow: "shadow-indigo-500/20",
    },
  ];

  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-slate-400 text-lg">Powerful features designed for modern support teams</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] transition-all duration-300 h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   BUILT FOR AGENCIES SECTION
   ─────────────────────────────────────────── */
function AgenciesSection() {
  return (
    <section className="py-32 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            One Dashboard for Every Client
          </h2>
          <p className="text-slate-400 text-lg">One workspace. Multiple clients. Complete control.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-10 md:p-16"
        >
          {/* Tree visualization */}
          <div className="flex flex-col items-center">
            {/* Root: Organization */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl px-8 py-5 shadow-xl shadow-purple-500/20">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-white" />
                  <span className="text-xl font-bold text-white">Pixelmattic</span>
                </div>
                <p className="text-purple-200 text-sm mt-1">Your Agency</p>
              </div>
            </div>

            {/* Connector */}
            <div className="w-px h-10 bg-gradient-to-b from-purple-500/50 to-transparent" />

            {/* Branch line */}
            <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-8" />

            {/* Client Companies */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {[
                { name: "BigBadBikes", tickets: "12 open", color: "from-orange-500 to-amber-500" },
                { name: "Ashoka", tickets: "8 open", color: "from-emerald-500 to-teal-500" },
                { name: "Zell Education", tickets: "5 open", color: "from-pink-500 to-rose-500" },
                { name: "NamanHR", tickets: "3 open", color: "from-blue-500 to-cyan-500" },
              ].map((company, i) => (
                <motion.div
                  key={company.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center mb-3`}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-white text-sm">{company.name}</p>
                  <p className="text-slate-500 text-xs mt-1">{company.tickets}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-slate-500 text-sm mt-10 max-w-md text-center">
              Each company has separate tickets and contacts while the agency manages everything from one unified workspace.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   DASHBOARD PREVIEW SECTION
   ─────────────────────────────────────────── */
function DashboardPreviewSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    // id="demo" is the target of the "Book Demo" buttons in the hero and CTA.
    <section id="demo" className="py-32 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Your Command Center
          </h2>
          <p className="text-slate-400 text-lg">Dark, fast, and designed for focus</p>
        </motion.div>

        <motion.div
          style={{ y }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Browser chrome */}
          <div className="bg-[#0f0f23] rounded-t-2xl border border-white/[0.08] border-b-0 p-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white/5 rounded-lg px-4 py-1.5 text-xs text-slate-500 text-center">
                pixelsupport.app/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-[#0a0a1a] rounded-b-2xl border border-white/[0.08] border-t-0 p-6 overflow-hidden">
            {/* Nav */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500" />
                  <span className="font-bold text-white text-sm">PixelSupport</span>
                </div>
                <div className="flex gap-1">
                  {["Dashboard", "Tickets", "Companies", "Team"].map((item) => (
                    <div
                      key={item}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        item === "Dashboard"
                          ? "bg-purple-500/10 text-purple-300"
                          : "text-slate-500"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10" />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                  RG
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Open Tickets", value: "24", change: "+12%", color: "text-purple-400" },
                { label: "Resolved Today", value: "18", change: "+8%", color: "text-emerald-400" },
                { label: "Avg Response", value: "14m", change: "-2m", color: "text-amber-400" },
                { label: "CSAT Score", value: "4.8", change: "+0.3", color: "text-cyan-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-2">{stat.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                    <span className={`text-xs font-medium ${stat.color}`}>{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + Activity */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white">Ticket Volume</span>
                  <div className="flex gap-1">
                    {["7d", "30d", "90d"].map((f) => (
                      <span
                        key={f}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${
                          f === "7d" ? "bg-purple-500/10 text-purple-300" : "text-slate-600"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <svg viewBox="0 0 400 100" className="w-full h-24">
                  <defs>
                    <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 L40,70 L80,75 L120,50 L160,45 L200,55 L240,40 L280,35 L320,42 L360,38 L400,30 L400,100 L0,100 Z"
                    fill="url(#chartArea)"
                  />
                  <path
                    d="M0,80 L40,70 L80,75 L120,50 L160,45 L200,55 L240,40 L280,35 L320,42 L360,38 L400,30"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <span className="text-sm font-semibold text-white block mb-4">Activity</span>
                <div className="space-y-3">
                  {[
                    { name: "Amit Kumar", action: "resolved #4821", time: "2m" },
                    { name: "Sneha Patel", action: "assigned #4823", time: "15m" },
                    { name: "Rajni Garg", action: "noted Acme Corp", time: "1h" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white">
                        {item.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300 truncate">
                          <span className="font-medium text-white">{item.name}</span> {item.action}
                        </p>
                        <p className="text-[10px] text-slate-600">{item.time} ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   CTA SECTION
   ─────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />
      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Ready to transform your support?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Join agencies already using PixelSupport to deliver faster, smarter customer experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              Talk to Sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────
   FOOTER
   ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">PixelSupport</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              AI-powered support platform built for agencies managing multiple client companies.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-500 text-sm hover:text-purple-300 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-500 text-sm hover:text-purple-300 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {["Privacy", "Terms", "Security"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-500 text-sm hover:text-purple-300 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06]">
          <p className="text-slate-600 text-sm">
            © 2026 PixelSupport. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a
              href="#"
              aria-label="Social"
              className="text-slate-600 hover:text-purple-300 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="Website"
              className="text-slate-600 hover:text-purple-300 transition-colors"
            >
              <Globe className="w-5 h-5" />
            </a>
            <a
              href="#"
              aria-label="Email us"
              className="text-slate-600 hover:text-purple-300 transition-colors"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────────────────────────
   MAIN PAGE
   ─────────────────────────────────────────── */
export default function LandingPage({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <main className="bg-[#0a0a1a] text-white min-h-screen overflow-x-hidden">
      <ParticleField />
      <TopNav loggedIn={loggedIn} />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <AgenciesSection />
      <DashboardPreviewSection />
      <CTASection />
      <Footer />
    </main>
  );
}
