import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export async function initSheets() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const titles = res.data.sheets?.map((s) => s.properties?.title) ?? [];

  if (!titles.includes("users")) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "users" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "users!A1:F1",
      valueInputOption: "RAW",
      requestBody: { values: [["id", "name", "email", "password_hash", "role", "created_at"]] },
    });
  }

  if (!titles.includes("attendance")) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "attendance" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "attendance!A1:G1",
      valueInputOption: "RAW",
      requestBody: { values: [["id", "user_email", "name", "date", "clock_in", "clock_out", "work_hours"]] },
    });
  }

  if (!titles.includes("config")) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "config" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "config!A1:B1",
      valueInputOption: "RAW",
      requestBody: { values: [["key", "value"]] },
    });
    // 초기 토큰값 환경변수에서 삽입
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "config!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          ["kakao_access_token", process.env.KAKAO_ACCESS_TOKEN ?? ""],
          ["kakao_refresh_token", process.env.KAKAO_REFRESH_TOKEN ?? ""],
        ],
      },
    });
  }
}

export async function getConfig(key: string): Promise<string | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "config!A2:B",
  });
  const row = (res.data.values ?? []).find((r) => r[0] === key);
  return row?.[1] ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "config!A2:B",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === key);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "config!A:B",
      valueInputOption: "RAW",
      requestBody: { values: [[key, value]] },
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `config!B${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: { values: [[value]] },
    });
  }
}

export async function getUsers(): Promise<any[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "users!A2:F",
  });
  return (res.data.values ?? []).map((row) => ({
    id: row[0],
    name: row[1],
    email: row[2],
    password_hash: row[3],
    role: row[4],
    created_at: row[5],
  }));
}

export async function addUser(user: { name: string; email: string; password_hash: string; role: string }) {
  const sheets = getSheets();
  const users = await getUsers();
  const id = users.length + 1;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "users!A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [[id, user.name, user.email, user.password_hash, user.role, new Date().toISOString()]],
    },
  });
}

export async function getTodayAttendance(email: string): Promise<any | null> {
  const sheets = getSheets();
  const today = getKSTDate();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "attendance!A2:G",
  });
  const rows = res.data.values ?? [];
  const row = rows.find((r) => r[1] === email && r[3] === today);
  if (!row) return null;
  return { id: row[0], user_email: row[1], name: row[2], date: row[3], clock_in: row[4], clock_out: row[5], work_hours: row[6] };
}

export async function clockIn(email: string, name: string) {
  const sheets = getSheets();
  const rows = await getAllAttendance();
  const id = rows.length + 1;
  const today = getKSTDate();
  const now = getKSTTime();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "attendance!A:G",
    valueInputOption: "RAW",
    requestBody: { values: [[id, email, name, today, now, "", ""]] },
  });
}

export async function clockOut(email: string) {
  const sheets = getSheets();
  const today = getKSTDate();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "attendance!A2:G",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[1] === email && r[3] === today);
  if (rowIndex === -1) throw new Error("출근 기록 없음");

  const clockInTime = rows[rowIndex][4];
  const now = getKSTTime();
  const workHours = calcWorkHours(clockInTime, now);
  const sheetRow = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `attendance!F${sheetRow}:G${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[now, workHours]] },
  });
}

export async function deleteUser(email: string) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "users!A2:F",
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[2] === email);
  if (rowIndex === -1) throw new Error("사용자 없음");

  const sheetRow = rowIndex + 2;
  const sheetId = await getUsersSheetId();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: sheetRow - 1, endIndex: sheetRow },
        },
      }],
    },
  });
}

async function getUsersSheetId(): Promise<number> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = res.data.sheets?.find((s) => s.properties?.title === "users");
  return sheet?.properties?.sheetId ?? 0;
}

async function getAllAttendance(): Promise<any[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "attendance!A2:G",
  });
  return res.data.values ?? [];
}

function getKSTDate(): string {
  return new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "");
}

function getKSTTime(): string {
  return new Date().toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
}

function calcWorkHours(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) return "-";
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}
