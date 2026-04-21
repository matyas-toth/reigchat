"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

import discordLogo from "@/public/discord.svg"
import googleLogo from "@/public/google.svg"
import githubLogo from "@/public/github.svg"

export default function LoginPage() {
  const handleSocialLogin = async (provider: "github" | "google" | "discord") => {
    await signIn.social({
      provider,
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Üdv itt, kalandor!</h1>
          <p className="text-sm text-muted-foreground">
            Jelentkezz be, hogy elérd a Reig Chat-et
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="outline" className="h-12 w-full relative group" onClick={() => handleSocialLogin("google")}>
            <Image src={googleLogo} alt="Google" width={20} height={20} className="absolute left-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Bejelentkezés Google fiókkal</span>
          </Button>
          <Button variant="outline" className="h-12 w-full relative group" onClick={() => handleSocialLogin("github")}>
            <Image src={githubLogo} alt="GitHub" width={20} height={20} className="absolute left-4 group-hover:scale-110 transition-transform dark:invert" />
            <span className="font-medium text-sm">Bejelentkezés GitHub fiókkal</span>
          </Button>
          <Button variant="outline" className="h-12 w-full relative group" onClick={() => handleSocialLogin("discord")}>
            <Image src={discordLogo} alt="Discord" width={20} height={20} className="absolute left-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Bejelentkezés Discord fiókkal</span>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Nincs még fiókod?{" "}
          <Link href="/register" className="text-primary hover:underline underline-offset-4">
            Hozd létre most!
          </Link>
        </p>
      </div>
    </div>
  );
}
