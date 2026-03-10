import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type Mood = 'cool' | 'boring' | 'anger' | 'hurry' | 'sad' | 'neutral';

export interface ReminderMessage {
  message: string;
  songSuggestion: string;
  vibe: string;
}

export async function generateMoodMessage(
  reminderTitle: string,
  mood: Mood,
  type: 'belonging' | 'action'
): Promise<ReminderMessage> {
  const prompt = `
    You are a supportive, empathetic friend and guider for a student or professional.
    Your task is to remind them about: "${reminderTitle}" (Type: ${type}).
    The user's current mood is: ${mood}.

    Tone Guidelines:
    - Cool/Boring: Be funny, crack a light joke, keep it casual.
    - Anger/Hurry: Use very pleasant, calming words. Be the "peace in the storm".
    - Sad: Be deeply encouraging, use "class and mass" (soulful yet energetic) vibes.
    - Neutral: Be helpful and friendly.

    Return a JSON object with:
    - message: The reminder text.
    - songSuggestion: A specific song title and artist that fits the mood (e.g., "Weightless by Marconi Union" for calm, or something upbeat for sad).
    - vibe: A short description of the vibe (e.g., "Chill & Fun", "Calm & Serene").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}') as ReminderMessage;
  } catch (error) {
    console.error("Error generating mood message:", error);
    return {
      message: `Hey! Don't forget your ${reminderTitle}. You've got this!`,
      songSuggestion: "Your favorite playlist",
      vibe: "Friendly Reminder"
    };
  }
}
