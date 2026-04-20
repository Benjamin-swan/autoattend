import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { clockIn, clockOut, getLatestAttendance } from "@/lib/sheets";
import { sendKakaoMessage } from "@/lib/kakao";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  const record = await getLatestAttendance(session.user.email);
  return NextResponse.json({ record });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { type } = await req.json();
  if (type !== "clock_in" && type !== "clock_out")
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const name = session.user.name ?? session.user.email;
  const email = session.user.email;
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
  const today = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

  if (type === "clock_in") {
    const existing = await getLatestAttendance(email);
    if (existing && !existing.clock_out) return NextResponse.json({ error: "이미 출근 중입니다." }, { status: 400 });
    if (existing && existing.date === today) return NextResponse.json({ error: "이미 오늘 출근했습니다." }, { status: 400 });
    await clockIn(email, name);
    await sendKakaoMessage(`[AutoAttend - 스마트 출퇴근]\n${name}님이 ${today} ${now} 에 출근했습니다 ✅`);
    return NextResponse.json({ ok: true });
  }

  if (type === "clock_out") {
    const existing = await getLatestAttendance(email);
    if (!existing) return NextResponse.json({ error: "출근 기록이 없습니다." }, { status: 400 });
    if (existing.clock_out) return NextResponse.json({ error: "이미 퇴근했습니다." }, { status: 400 });
    await clockOut(email);
    await sendKakaoMessage(`[AutoAttend - 스마트 출퇴근]\n${name}님이 ${today} ${now} 에 퇴근했습니다 🏠`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
}
