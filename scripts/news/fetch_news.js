const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateNews() {
  if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable is missing.");
    process.exit(1);
  }

  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + GEMINI_API_KEY;

  const promptText = "Generate 5 latest concise news updates covering Tech, AI, and Web Development. Output strictly a JSON array of objects without Markdown formatting or backticks: [{\"id\": 1, \"title\": \"Title\", \"summary\": \"Summary\", \"category\": \"Tech\", \"date\": \"2026-11-04\"}]";

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error("API error " + response.status + ": " + errText);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error("Malformed API response:", JSON.stringify(data, null, 2));
      throw new Error("Invalid structure from Gemini API");
    }

    const rawText = data.candidates[0].content.parts[0].text.trim();
    const newsData = JSON.parse(rawText);

    const outputPath = path.join(process.cwd(), 'news.json');
    fs.writeFileSync(outputPath, JSON.stringify(newsData, null, 2), 'utf-8');
    console.log("Successfully wrote news to " + outputPath);

  } catch (err) {
    console.error("Execution failed:", err.message);
    process.exit(1);
  }
}

generateNews();
