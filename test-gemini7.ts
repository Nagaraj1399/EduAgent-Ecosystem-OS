import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        { role: 'user', parts: [{ text: 'hello' }] },
      ]
    });
    console.log("SUCCESS", res.text);
  } catch (e) {
    console.error("ERROR", e.status, e.message);
  }
}
run();
