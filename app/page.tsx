"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { BrainIcon, ArrowRight02Icon, SparklesIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MotionCard = motion.create(Card);

  // Stagger variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground font-sans">
      
      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={BrainIcon} size={28} className="text-foreground" />
            <span className="font-bold text-xl tracking-tight">Second Brain</span>
          </div>

          <div className="flex items-center gap-4">
            {mounted && (
              <div className="flex w-fit items-center rounded-md border border-border/50 bg-background/50 p-0.5">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-sm p-1.5 text-xs transition-colors",
                    theme === "light" ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  title="Light Mode"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-sm p-1.5 text-xs transition-colors",
                    theme === "system" ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  title="System Mode"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-sm p-1.5 text-xs transition-colors",
                    theme === "dark" ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  title="Dark Mode"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </button>
              </div>
            )}
            
            {session ? (
              <Button onClick={() => router.push("/dashboard")} variant="default">
                Go to Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={() => router.push("/login")} variant="ghost" className="hidden sm:inline-flex">
                  Log in
                </Button>
                <Button onClick={() => router.push("/register")} variant="default">
                  Start for Free
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* ── Hero Section ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 mb-32 relative">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
          
          <motion.div 
            initial={{ opacity: 0, filter: "blur(10px)", y: 30 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center pt-8 pb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              DeepSeek AI integration live
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl text-foreground mb-6 leading-[1.1]">
              Stop organizing. <br className="hidden md:block"/>
              <span className="text-muted-foreground">Start executing.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Dump your scattered thoughts, chaotic meeting notes, and half-baked ideas into a chat. We instantly map them into projects, kanban boards, and an infinite knowledge vault.
            </p>
            
            <form className="flex w-full max-w-md items-center gap-2 shadow-xl shadow-primary/5 rounded-xl border border-border bg-card p-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <input 
                type="email" 
                placeholder="Enter your email to start maping..." 
                className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
                readOnly
              />
              <Button onClick={(e) => { e.preventDefault(); router.push("/register"); }} className="h-11 px-8 rounded-lg">
                Build My Brain <HugeiconsIcon icon={ArrowRight02Icon} size={18} className="ml-2" />
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground font-medium">Join 10,000+ operators shipping faster.</p>
          </motion.div>

          {/* Hero Simulated UI */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 30 }}
            className="relative mx-auto mt-10 max-w-5xl rounded-2xl border border-border bg-muted/20 p-2 shadow-2xl backdrop-blur-sm"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-10" />
            <div className="grid md:grid-cols-2 gap-4 rounded-xl bg-background border border-border/50 p-4 relative overflow-hidden h-[500px]">
              
              {/* Left Side: The Chat dump */}
              <div className="flex flex-col h-full border-r border-border/50 pr-4">
                <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                  <span className="text-sm font-semibold tracking-tight">Vercel AI Stream</span>
                  <HugeiconsIcon icon={SparklesIcon} size={16} className="text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-4 overflow-hidden h-full relative">
                  <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                    "Hey, I need to restructure the marketing page. Put 'Update Hero' as a task, and also save a note that competitors are using darker aesthetics."
                  </div>
                  <div className="flex items-center gap-2 max-w-[85%]">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border">
                      <HugeiconsIcon icon={BrainIcon} size={12} className="text-muted-foreground" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-card-foreground shadow-sm">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                           <div className="h-3 w-3 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center"><div className="h-1 w-1 bg-primary rounded-full animate-ping"></div></div>
                           Extracting intent...
                         </div>
                         <p>I've mapped out your request. The project has been updated.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: The Orderly Output */}
              <div className="flex flex-col h-full pl-2">
                 <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                  <span className="text-sm font-semibold tracking-tight flex items-center gap-2 text-muted-foreground">✨ Auto-Generated Structure</span>
                </div>
                <div className="flex flex-col gap-4">
                  {/* Task Card */}
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Task · Marketing</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium border border-border/50">TO DO</span>
                    </div>
                    <h3 className="font-medium text-sm">Update Hero Section Aesthetics</h3>
                  </div>
                  {/* Note Card */}
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-foreground/20"></div>
                    <div className="flex items-center justify-between mb-3 ml-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Note · Competitor Intel</span>
                    </div>
                    <h3 className="font-medium text-sm ml-2">Competitors are utilizing darker, monolithic tech aesthetics rather than vibrant gradients.</h3>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Problem Section ───────────────────────────────────────────────────── */}
        <section className="bg-foreground text-background py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center w-full max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">You don't have a focus problem. <br/>You have an organization tax.</h2>
              <p className="text-lg text-background/70 leading-relaxed">
                Every time you have a great idea, you have to decide where it belongs. Does it go in Notion? Trello? Apple Notes? By the time you organize it, the momentum is gone.
              </p>
            </div>

            <motion.div 
              variants={containerVars}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-3 gap-6"
            >
              <MotionCard variants={itemVars} className="bg-background/5 border-border/10 text-background border-none shadow-none ring-0">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
                    <span className="text-2xl opacity-60">📑</span>
                  </div>
                  <CardTitle className="text-background text-xl">The Tab Graveyard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-background/60 leading-relaxed">
                    You leave tabs open because if you close them, you'll lose the thought. 
                    Your browser is essentially your to-do list, hoarding memory and stressing you out.
                  </p>
                </CardContent>
              </MotionCard>
              
              <MotionCard variants={itemVars} className="bg-background/5 border-border/10 text-background border-none shadow-none ring-0">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
                    <span className="text-2xl opacity-60">🗂️</span>
                  </div>
                  <CardTitle className="text-background text-xl">The Notion Labyrinth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-background/60 leading-relaxed">
                    You spent 4 hours building the perfect dashboard with relations and rollups. 
                    Now it takes 14 clicks just to add a single note. You stopped using it a week ago.
                  </p>
                </CardContent>
              </MotionCard>

              <MotionCard variants={itemVars} className="bg-background/5 border-border/10 text-background border-none shadow-none ring-0">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
                    <span className="text-xl opacity-60 line-through">✓</span>
                  </div>
                  <CardTitle className="text-background text-xl">The Ghost Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-background/60 leading-relaxed">
                    Scattered post-its, unread Slack messages saved for later, and mental notes that fall through the cracks. The friction of logging tasks prevents them from getting done.
                  </p>
                </CardContent>
              </MotionCard>
            </motion.div>
          </div>
        </section>

        {/* ── Feature Bento Grid ────────────────────────────────────────────────── */}
        <section className="py-32 bg-muted/30 border-y border-border/50">
          <div className="mx-auto max-w-7xl px-6">
             <div className="mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Built for velocity.</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Just type what's on your mind. Large Language Models classify, structure, and link everything instantly in the background.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 auto-rows-[340px]">
              {/* Feature 1: The Chat */}
              <Card className="md:col-span-2 overflow-hidden flex flex-col group border-border">
                <CardHeader className="p-6 pb-2 z-10 shrink-0 bg-gradient-to-b from-card to-transparent">
                  <CardTitle className="text-2xl font-bold tracking-tight">Conversational Interface</CardTitle>
                  <CardDescription className="text-base break-words max-w-sm mt-2">
                    No forms. No dropdowns. Tell your brain what's happening and it puts everything in its right place.
                  </CardDescription>
                </CardHeader>
                <div className="flex-1 w-full bg-muted/50 rounded-tl-3xl ml-6 mt-4 border-l border-t border-border/50 p-6 flex flex-col justify-end gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                   <div className="max-w-[90%] self-end rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm">
                    "I just talked to Sarah. We're pivoting the landing page to target developers. Can you make a project for this and add 'research shadcn competitors' as a task?"
                  </div>
                  <div className="max-w-[70%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                    Got it. Created project "Landing Page Pivot" and added the task.
                  </div>
                </div>
              </Card>

              {/* Feature 2: Kanban */}
              <Card className="overflow-hidden flex flex-col group border-border">
                 <CardHeader className="shrink-0 relative z-10 bg-card">
                  <CardTitle className="text-xl">Auto-Kanban</CardTitle>
                  <CardDescription>Tasks sort themselves automatically based on context.</CardDescription>
                </CardHeader>
                <div className="flex-1 p-6 pt-0 bg-muted/20 relative">
                  <div className="absolute inset-x-6 top-4 flex flex-col gap-2 group-hover:-translate-y-4 transition-transform duration-700">
                    <div className="rounded border border-border bg-card p-3 shadow-sm h-12 flex items-center justify-between">
                      <div className="w-2/3 h-2 bg-muted rounded"></div>
                      <div className="w-4 h-4 rounded-full border border-border"></div>
                    </div>
                    <div className="rounded border border-border bg-card p-3 shadow-sm flex flex-col gap-2">
                       <div className="w-1/2 h-2 bg-muted rounded"></div>
                       <div className="w-full h-2 bg-muted rounded"></div>
                       <div className="mt-2 w-full h-6 rounded bg-primary/10 border border-primary/20 text-[8px] flex items-center justify-center font-bold text-primary">IN PROGRESS</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Feature 3: Deep Memory */}
              <Card className="overflow-hidden flex flex-col group border-border">
                <CardHeader className="shrink-0 bg-card">
                  <CardTitle className="text-xl">Infinite Memory Vault</CardTitle>
                  <CardDescription>Retrieve any idea instantly.</CardDescription>
                </CardHeader>
                <div className="flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center relative p-6">
                  <div className="w-full bg-card border border-border rounded-lg shadow-xl p-3 flex items-center gap-2 group-hover:scale-105 transition-transform duration-500">
                    <HugeiconsIcon icon={SparklesIcon} size={14} className="text-primary" />
                    <span className="text-xs font-mono text-muted-foreground w-full">Search: "What did Sarah say about..."</span>
                  </div>
                </div>
              </Card>

              {/* Feature 4: Context Awareness */}
              <Card className="md:col-span-2 overflow-hidden flex flex-col md:flex-row items-center border-border">
                 <div className="p-8 md:w-1/2 shrink-0">
                  <CardTitle className="text-2xl font-bold tracking-tight mb-2">Contextual Intelligence</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    The AI remembers what you were talking about yesterday. It bridges connections between separate projects so you never duplicate work.
                  </CardDescription>
                </div>
                <div className="w-full h-full min-h-[200px] border-l border-border/50 bg-muted/30 relative flex items-center justify-center p-8">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-xl">💡</div>
                    <div className="w-12 h-[2px] bg-border relative"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-ping"></div></div>
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-xl">🎯</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Social Proof / Testimonials ───────────────────────────────────────── */}
        <section className="py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Reclaim your mental bandwidth.</h2>
              <p className="text-muted-foreground text-lg">Don't just take our word for it.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "I deleted Todoist, Obsidian, and Trello in the same afternoon. Being able to just talk to my database feels fundamentally like magic.", author: "Alex K.", roll: "Founder" },
                { quote: "It’s like having an incredibly diligent chief of staff who takes my brain-dumps and turns them into actionable sprint boards instantly.", author: "Sarah M.", roll: "Product Manager" },
                { quote: "Finally, a productivity tool that doesn't feel like doing chores. The organization tax is completely gone.", author: "David T.", roll: "Software Engineer" }
              ].map((t, i) => (
                <Card key={i} className="bg-muted/10 border-border/50">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground leading-relaxed italic mb-6">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center font-bold text-foreground/50 border border-border">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.author}</p>
                        <p className="text-xs text-muted-foreground">{t.roll}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing Hook & FAQs ───────────────────────────────────────────────── */}
        <section className="py-24 bg-muted/30 border-t border-border/50">
          <div className="mx-auto max-w-3xl px-6">
             <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-semibold">How much does it cost?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  You start completely for **Free** with a generous 50,000 token lifetime allowance to map out your initial ideas. Once you're hooked, our **Pro tier is $12/month** giving you 250,000 output tokens every 8 hours. We also have an **Ultra tier** for extreme power users.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-semibold">Which AI model do you use?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We use state-of-the-art models like DeepSeek running through the Vercel AI SDK. We continually evaluate and pipe in the most logically sound models to ensure your data is classified and structured immaculately.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-semibold">How is this different from ChatGPT?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  ChatGPT is a general conversationalist that forgets you when you close the window. **Second Brain** has a persistent, fully relational memory vault. When you talk to Second Brain, it actively writes to a database, updating statuses, sorting lists, and connecting ideas across weeks of time.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-semibold">Can I use my phone?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, the web application is fully responsive. You can dump thoughts while walking using voice-to-text on your keyboard, and it will be perfectly organized when you sit back down at your desk.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ── Final Large CTA ───────────────────────────────────────────────────── */}
        <section className="py-40">
          <div className="mx-auto max-w-4xl px-6 text-center flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-2xl text-foreground">
              Your mind is for having ideas, not holding them.
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-xl">
              Join thousands of high performers outsourcing their executive function to AI.
            </p>
            <Button size="lg" className="h-14 px-10 text-base font-medium rounded-full shadow-lg shadow-primary/20" onClick={() => router.push("/register")}>
              Start for Free
            </Button>
            <p className="mt-6 text-sm text-muted-foreground font-medium">No credit card required. Cancel anytime.</p>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/50 py-12 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HugeiconsIcon icon={BrainIcon} size={20} />
          <span className="font-semibold tracking-tight text-foreground">Second Brain SaaS</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Second Brain Inc. Built for velocity.</p>
      </footer>
    </div>
  );
}
