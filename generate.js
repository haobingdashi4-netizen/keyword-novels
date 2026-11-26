export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keywords, genre } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  // 安全対策：長すぎる入力をカット
  const safeKeywords = String(keywords).slice(0, 100);
  const safeGenre = String(genre).slice(0, 50);

  const prompt = `あなたはプロの小説家です。以下の条件で、読者の心に残る短編小説を1編執筆してください。

【条件】
・ジャンル：${safeGenre}
・必ず登場させるキーワード：${safeKeywords}
・文字数：800〜1200文字程度
・構成：最初に魅力的なタイトルをつけ、改行して本文を始めてください。説明や前置きは一切不要です。`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9 // 創造性を少し高めに設定
          }
        })
      }
    );

    const data = await response.json();
    const novel = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!novel) {
      return res.status(500).json({ error: '小説の生成に失敗しました' });
    }

    res.status(200).json({ novel });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}