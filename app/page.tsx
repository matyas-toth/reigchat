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
    <div className="min-h-screen w-full flex flex-col justify-start items-center">

      <div className="container w-full min-h-screen flex flex-col justify-center items-start">
        <h1 className="text-7xl leading-20 font-medium tracking-tighter">Stop Managing Tasks.<br /> <span className="tracking-tight">Just Say What You Did.</span></h1>
        <p className="text-2xl font-medium tracking-tight opacity-70 mt-8">Your personal AI-powered second brain. Chat naturally, organize automatically.</p>
        <div className="flex justify-start items-center gap-4 mt-10">
          <Button size="lg" className="rounded-full px-8 py-6 text-lg font-medium">
            Build My Second Brain For Free
          </Button>
          <Button size="lg" variant={"outline"} className="rounded-full px-8 py-6 text-lg font-medium">

            See How It Works
          </Button>
        </div>
      </div>

    </div>
  );
}
