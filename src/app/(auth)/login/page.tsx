"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#0d0d0d] md:flex-row">
      {/* Left: brand */}
      <div className="relative order-1 flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-14 md:order-none md:py-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(201,168,76,0.22) 0%, transparent 62%)",
          }}
        />
        <div className="relative z-10 max-w-md text-center">
          <p className="mb-5 text-3xl md:text-4xl" aria-hidden>
            ✂️
          </p>
          <div
            className="mx-auto inline-block rounded-2xl px-2 pb-1 pt-2"
            style={{
              boxShadow:
                "0 0 0 1px rgba(201,168,76,0.12), 0 0 60px 28px rgba(201,168,76,0.18), 0 0 120px 48px rgba(201,168,76,0.08)",
            }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-[#C9A84C] md:text-5xl">
              Salon Envy<sup className="text-2xl align-super">®</sup>
            </h1>
          </div>
          <p className="mt-6 text-base leading-relaxed text-neutral-400 md:text-lg">
            Empowering Your Salon. Elevating Your Team.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="order-2 flex w-full flex-1 items-center justify-center px-4 pb-14 pt-2 md:w-auto md:max-w-[min(100%,520px)] md:pb-0 md:pr-10 md:pt-0">
        <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#161616] p-8 shadow-2xl md:rounded-l-3xl md:rounded-r-2xl md:border-l-0 md:pl-10 md:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)]">
          <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-neutral-500">Sign in to the management portal</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-sm text-neutral-400">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2.5 text-neutral-100 outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-400">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2.5 text-neutral-100 outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40"
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#C9A84C] py-3 text-base font-semibold text-[#0d0d0d] transition hover:bg-[#b89642] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link href="#" className="text-sm font-medium text-[#C9A84C] hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
