"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut, CheckCircle2, Timer,
  LogIn, LogOut as LogOutIcon, AlertCircle, Loader2,
  Bell, UserX, TriangleAlert,
} from "lucide-react";

type AttendanceRecord = {
  clock_in: string;
  clock_out: string;
  work_hours: string;
  date: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [time, setTime] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchRecord();
  }, [status]);

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRecord() {
    const res = await fetch("/api/attendance");
    const data = await res.json();
    setRecord(data.record);
  }

  async function handleAttendance(type: "clock_in" | "clock_out") {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setIsError(true);
      setMessage(data.error);
    } else {
      setIsError(false);
      setMessage(type === "clock_in" ? "출근이 기록되었습니다." : "퇴근이 기록되었습니다.");
      await fetchRecord();
    }
  }

  async function handleDeleteAccount() {
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/login" });
    } else {
      setIsError(true);
      setMessage("탈퇴 처리 중 오류가 발생했습니다.");
      setShowDeleteConfirm(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const today = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const hasClockedIn = !!record?.clock_in;
  const hasClockedOut = !!record?.clock_out;

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-5 py-8" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))", paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
      <div className="w-full max-w-sm">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="AutoAttend" width={28} height={28} className="rounded-md" />
            <span className="text-white font-semibold text-sm tracking-tight">AutoAttend</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors min-h-[44px] min-w-[44px] justify-end"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>

        {/* 인사 */}
        <div className="mb-8">
          <p className="text-zinc-500 text-xs mb-1 tracking-wide">{today}</p>
          <h2 className="text-white text-xl font-semibold tracking-tight">
            {session.user?.name}님, 안녕하세요
          </h2>
        </div>

        {/* 시계 */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 text-center mb-4">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Timer className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500 text-xs tracking-wide">현재 시각 · KST</span>
          </div>
          <div className="text-4xl sm:text-5xl font-light text-white font-mono tracking-widest tabular-nums">{time}</div>
        </div>

        {/* 출퇴근 현황 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
              <LogIn className="w-3 h-3" />
              출근
            </div>
            <div className={`text-xl font-semibold font-mono tabular-nums ${hasClockedIn ? "text-white" : "text-zinc-600"}`}>
              {record?.clock_in || "--:--"}
            </div>
            {hasClockedIn && (
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-xs">완료</span>
              </div>
            )}
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
              <LogOutIcon className="w-3 h-3" />
              퇴근
            </div>
            <div className={`text-xl font-semibold font-mono tabular-nums ${hasClockedOut ? "text-white" : "text-zinc-600"}`}>
              {record?.clock_out || "--:--"}
            </div>
            {hasClockedOut && (
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-xs">완료</span>
              </div>
            )}
          </div>
        </div>

        {/* 근무시간 */}
        {hasClockedOut && record?.work_hours && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between mb-4">
            <span className="text-zinc-400 text-xs">오늘 근무시간</span>
            <span className="text-white text-sm font-semibold">{record.work_hours}</span>
          </div>
        )}

        {/* 버튼 — 모바일 터치 타겟 min-h-[56px] */}
        <div className="space-y-2 mt-2">
          <button
            onClick={() => handleAttendance("clock_in")}
            disabled={loading || hasClockedIn}
            className={`w-full font-medium rounded-xl min-h-[56px] text-sm transition-all duration-150 flex items-center justify-center gap-2 select-none ${
              hasClockedIn
                ? "bg-[#1a1a1a] text-zinc-500 border border-[#2a2a2a] cursor-not-allowed"
                : "bg-white text-black hover:bg-zinc-100 active:scale-[0.98] shadow-sm"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {hasClockedIn ? "출근 완료" : "출근하기"}
          </button>
          <button
            onClick={() => handleAttendance("clock_out")}
            disabled={loading || !hasClockedIn || hasClockedOut}
            className={`w-full font-medium rounded-xl min-h-[56px] text-sm transition-all duration-150 flex items-center justify-center gap-2 select-none ${
              hasClockedOut
                ? "bg-[#1a1a1a] text-zinc-500 border border-[#2a2a2a] cursor-not-allowed"
                : !hasClockedIn
                ? "bg-[#1a1a1a] text-zinc-600 border border-[#2a2a2a] cursor-not-allowed"
                : "bg-[#2a1a1a] text-[#f87171] border border-[#7f1d1d]/40 hover:bg-[#2e1a1a] active:scale-[0.98]"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOutIcon className="w-4 h-4" />}
            {hasClockedOut ? "퇴근 완료" : "퇴근하기"}
          </button>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`mt-3 flex items-center gap-2 text-xs rounded-xl px-3 py-3 ${
            isError
              ? "bg-red-950 border border-red-900 text-red-400"
              : "bg-emerald-950 border border-emerald-900 text-emerald-400"
          }`}>
            {isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            {message}
          </div>
        )}

        {/* 하단 */}
        <div className="flex items-center gap-1.5 text-zinc-600 text-xs mt-8">
          <Bell className="w-3 h-3 shrink-0" />
          출근/퇴근 시 관리자 카카오톡으로 알림이 전송됩니다
        </div>

        {/* 회원탈퇴 */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 mt-3 text-zinc-600 hover:text-red-400 text-xs transition-colors min-h-[44px]"
          >
            <UserX className="w-3 h-3" />
            회원탈퇴
          </button>
        ) : (
          <div className="mt-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-4">
            <div className="flex items-start gap-2 text-zinc-400 text-xs mb-4">
              <TriangleAlert className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-3 rounded-lg transition-colors min-h-[44px]"
              >
                <UserX className="w-3.5 h-3.5" />
                탈퇴 확인
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-[#2a2a2a] hover:bg-[#333] text-zinc-300 text-xs px-4 py-3 rounded-lg transition-colors min-h-[44px]"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
