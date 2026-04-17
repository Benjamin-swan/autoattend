"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-5" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-black" />
            </div>
            <span className="text-white font-semibold">AutoAttend</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">다시 오셨군요</h1>
          <p className="text-zinc-500 text-sm mt-1">계정에 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wide">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wide">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-semibold rounded-lg min-h-[52px] text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-1 select-none active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-zinc-600 text-sm mt-6">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-zinc-300 hover:text-white transition">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
