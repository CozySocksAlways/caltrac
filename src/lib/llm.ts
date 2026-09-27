import type { CalorieEstimate, Settings } from './types'

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a short description of a \
meal or food item, estimate its total calories and macros (protein, carbs, fat in grams). \
Use your best judgement for typical portion sizes when not specified. \
Respond with ONLY a JSON object, no markdown fences, no prose, in this exact shape: \
{"calories": number, "macros": {"protein": number, "carbs": number, "fat": number}, "notes": string}. \
"notes" should briefly explain your assumptions (e.g. portion size).`

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1] : trimmed
}

export async function estimateCalories(
  description: string,
  settings: Pick<Settings, 'llmBaseUrl' | 'llmApiKey' | 'llmModel'>,
): Promise<CalorieEstimate> {
  const baseUrl = settings.llmBaseUrl.replace(/\/+$/, '')
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.llmApiKey}`,
    },
    body: JSON.stringify({
      model: settings.llmModel,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`LLM request failed (${res.status}): ${body.slice(0, 300)}`)
  }

  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('LLM response had no content')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFences(content))
  } catch {
    throw new Error(`Could not parse LLM response as JSON: ${content.slice(0, 300)}`)
  }

  const obj = parsed as Record<string, unknown>
  const calories = Number(obj.calories)
  if (!Number.isFinite(calories)) {
    throw new Error('LLM response missing a numeric "calories" field')
  }

  let macros: CalorieEstimate['macros']
  if (obj.macros && typeof obj.macros === 'object') {
    const m = obj.macros as Record<string, unknown>
    const protein = Number(m.protein)
    const carbs = Number(m.carbs)
    const fat = Number(m.fat)
    if (Number.isFinite(protein) && Number.isFinite(carbs) && Number.isFinite(fat)) {
      macros = { protein, carbs, fat }
    }
  }

  return {
    calories: Math.round(calories),
    macros,
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
  }
}
