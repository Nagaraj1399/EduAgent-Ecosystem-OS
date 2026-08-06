import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [
        { role: 'user', parts: [{ text: 'hello' }] },
      ],
      config: {
        systemInstruction: "You are a helpful assistant.",
        temperature: 0.3
      }
    });
    console.log("SUCCESS", res.text);
  } catch (e) {
    console.error("ERROR", e.status, e.message);
  }
}
run();
