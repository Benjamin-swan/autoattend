import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteUser } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  await deleteUser(session.user.email);
  return NextResponse.json({ ok: true });
}
