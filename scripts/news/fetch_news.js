const fs = require('fs');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is missing!");
  process.exit(1);
}

async function generateNews() {
  const prompt = `Write 1 fresh, highly informative short article about today's trending development in AI or Cryptocurrency. 
Return ONLY a valid JSON object (no markdown formatting, no backticks, no wrap). 
JSON format:
{
  "category": "AI or Crypto",
  "headline": "Punchy headline here",
  "summary": "1-2 sentences summary",
  "content": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3 (around 15-25 lines total)",
  "sources": [{"name": "Source Name", "url": "https://example.com"}]
}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  const data = await res.json();
  const rawText = data.candidates[0].content.parts[0].text;
  const article = JSON.parse(rawText);

  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  article.date = now.toISOString().split('T')[0];
  article.expires = expires.toISOString();

  let currentNews = [];
  if (fs.existsSync('news.json')) {
    try {
      currentNews = JSON.parse(fs.readFileSync('news.json', 'utf8'));
    } catch (e) {
      currentNews = [];
    }
  }

  const activeNews = currentNews.filter(item => {
    return !item.expires || new Date(item.expires) > now;
  });

  activeNews.unshift(article);
  const finalList = activeNews.slice(0, 10);

  fs.writeFileSync('news.json', JSON.stringify(finalList, null, 2));
  console.log("Successfully generated and updated daily news!");
}

generateNews().catch(err => {
  console.error(err);
  process.exit(1);
});
