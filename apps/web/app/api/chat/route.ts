import { NextRequest, NextResponse } from "next/server";
const api_key = process.env.LLM_API_KEY;
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${api_key}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "minimaxai/minimax-m3",
        messages,
        max_tokens: 8192,
        temperature: 1.0,
        top_p: 0.95,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: errText }, { status: response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}