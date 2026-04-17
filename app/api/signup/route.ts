import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsers, addUser, initSheets } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password)
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });

  await initSheets();
  const users = await getUsers();
  if (users.find((u) => u.email === email))
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 10);
  await addUser({ name, email, password_hash, role: "employee" });
  return NextResponse.json({ ok: true });
}
