const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateNews() {
  if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not defined in environment variables.");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = \`Generate 5 latest concise news updates covering Tech, AI, and Web Development. 
Output strictly valid JSON array of objects without Markdown formatting or backticks:
[
  {
    "id": 1,
    "title": "Title here",
    "summary": "Short summary",
    "category": "Tech",
    "date": "\${new Date().toISOString().split('T')[0]}"
  }
]\`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(\`API responded with status \${response.status}: \${errText}\`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error("Unexpected API response structure:", JSON.stringify(data, null, 2));
      throw new Error("Invalid response format received from Gemini API");
    }

    const rawText = data.candidates[0].content.parts[0].text.trim();
    let newsData;

    try {
      newsData = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Raw response text was not valid JSON:", rawText);
      throw parseErr;
    }

    const outputPath = path.join(process.cwd(), 'news.json');
    fs.writeFileSync(outputPath, JSON.stringify(newsData, null, 2), 'utf-8');
    console.log(\`Successfully generated and wrote news to \${outputPath}\`);

  } catch (error) {
    console.error("Execution failed in generateNews:", error.message);
    process.exit(1);
  }
}

generateNews();
