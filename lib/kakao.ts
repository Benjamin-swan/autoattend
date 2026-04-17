export async function sendKakaoMessage(text: string) {
  const token = process.env.KAKAO_ACCESS_TOKEN;
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
  const data = await res.json();
  if (data.result_code !== 0) {
    console.error("카카오 메시지 전송 실패:", data);
  }
  return data;
}
