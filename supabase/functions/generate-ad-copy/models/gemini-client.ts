// Gemini API client wrapper

export async function callGeminiJSON({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  jsonSchema,
  temperature = 0.7,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: object;
  temperature?: number;
}): Promise<any> {
  // Strip "google/" prefix if present
  const cleanModel = model.startsWith("google/") ? model.slice(7) : model;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON response: ${text}`);
  }
}
