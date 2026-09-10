import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.CLAUDE_VISION_MODEL || 'claude-sonnet-5';

// Claude's vision endpoint accepts these image media types.
const SUPPORTED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const SYSTEM_PROMPT = `You are a nutrition-estimation assistant. You look at a photo of a meal and
estimate its contents. You are always approximate, never exact, since you cannot weigh or measure
food from a photo. Respond with your best single estimate per field, favoring realistic home/restaurant
portions over extremes.`;

const USER_PROMPT = `Identify the food item(s) in this photo and estimate its nutrition. Respond with ONLY
a JSON object (no markdown fences, no extra text) matching exactly this shape:

{
  "name": "short human-readable description of the meal, e.g. 'Grilled chicken breast with rice and broccoli'",
  "portion": "rough portion size description, e.g. '1 chicken breast (~6oz), 1 cup rice, 1 cup broccoli'",
  "calories": <number, kcal>,
  "protein_g": <number, grams>,
  "carbs_g": <number, grams>,
  "fat_g": <number, grams>,
  "confidence": "low" | "medium" | "high",
  "items": ["list", "of", "individual", "food", "items", "identified"]
}

If multiple distinct food items are visible, combine them into one meal-level estimate. If you truly
cannot identify any food in the image, set "name" to "Unrecognized food" and use your best guess for
the macros based on typical plate contents, with "confidence": "low".`;

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Claude response did not contain a JSON object');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function analyzeFoodPhoto({ filePath, mimeType }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error(
      'ANTHROPIC_API_KEY is not set on the server. Add it to backend/.env to enable photo analysis.'
    );
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  if (!SUPPORTED_MEDIA_TYPES.has(mimeType)) {
    const err = new Error(
      `Image type "${mimeType}" isn't supported for photo analysis. Try a JPEG, PNG, WEBP, or GIF, or enter the meal manually.`
    );
    err.code = 'UNSUPPORTED_MEDIA_TYPE';
    throw err;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Claude response contained no text content');
  }

  const parsed = extractJson(textBlock.text);

  return {
    name: parsed.name ?? 'Unrecognized food',
    portion: parsed.portion ?? '',
    calories: numberOrNull(parsed.calories),
    protein_g: numberOrNull(parsed.protein_g),
    carbs_g: numberOrNull(parsed.carbs_g),
    fat_g: numberOrNull(parsed.fat_g),
    confidence: parsed.confidence ?? 'low',
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
