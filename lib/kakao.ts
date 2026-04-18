async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.KAKAO_REFRESH_TOKEN;
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!refreshToken || !restApiKey) return null;

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: restApiKey,
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    return data.access_token;
  }
  console.error("카카오 토큰 갱신 실패:", data);
  return null;
}

async function sendWithToken(text: string, token: string): Promise<{ result_code: number }> {
  const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: "text",
        text,
        link: { web_url: process.env.NEXTAUTH_URL ?? "http://localhost:3000" },
      }),
    }),
  });
  return res.json();
}

export async function sendKakaoMessage(text: string) {
  let token = process.env.KAKAO_ACCESS_TOKEN;
  if (!token) {
    console.error("KAKAO_ACCESS_TOKEN 없음");
    return;
  }

  let data = await sendWithToken(text, token);

  // 401 (토큰 만료) 시 갱신 후 재시도
  if (data.result_code !== 0) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      data = await sendWithToken(text, newToken);
    }
  }

  if (data.result_code !== 0) {
    console.error("카카오 메시지 전송 실패:", data);
  }
  return data;
}
