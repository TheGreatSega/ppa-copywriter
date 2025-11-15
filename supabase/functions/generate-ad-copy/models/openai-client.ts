// OpenAI API client wrapper

export async function callOpenAIJSON({
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
  const isGPT5OrHigher =
    model.includes("gpt-5") ||
    model.includes("gpt-4.5") ||
    model.includes("gpt-4.1") ||
    model.includes("o1") ||
    model.includes("o3");

  const requestBody: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ad_copy_response",
        strict: true,
        schema: jsonSchema,
      },
    },
  };

  // GPT-5/4.1+ use max_completion_tokens, no temperature
  if (isGPT5OrHigher) {
    requestBody.max_completion_tokens = 3000;
  } else {
    requestBody.max_tokens = 3000;
    requestBody.temperature = temperature;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error("OpenAI returned empty response");
  }

  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse OpenAI JSON response: ${content}`);
  }
}
