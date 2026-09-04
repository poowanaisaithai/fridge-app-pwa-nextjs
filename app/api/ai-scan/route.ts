import { NextRequest, NextResponse } from 'next/server';

/**
 * Optional AI Scan Endpoint using Free Tier Gemini Flash
 * (Only active if GEMINI_API_KEY is provided, otherwise client-side Tesseract is used directly).
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        available: false,
        message: 'No GEMINI_API_KEY configured. Using client-side Tesseract.js OCR.',
      });
    }

    const { base64Image, mimeType = 'image/jpeg' } = await req.json();
    if (!base64Image) {
      return NextResponse.json({ error: 'Missing base64Image' }, { status: 400 });
    }

    // Call Gemini 1.5 Flash (Generative Language API free tier)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Analyze this food packaging image. Extract the following in JSON format:
{
  "name": "Suggested Thai or English food item name",
  "expirationDate": "YYYY-MM-DD or null if not found",
  "category": "one of: dairy, produce, meat, seafood, bakery, beverages, condiments, leftovers, snacks, other",
  "notes": "any storage notes"
}
Return ONLY valid JSON.`;

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json({
      available: true,
      result: parsed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
