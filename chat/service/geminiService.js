const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

exports.askGemini = async (context, query) => {
  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    config: {
      systemInstruction:
        "You are a news agent who answers questions about the news.",
    },
    history: [
      {
        role: "user",
        parts: [{ text: query }],
      },
      {
        role: "model",
        parts: [{ text: context }],
      },
    ],
  });

  const stream = await chat.sendMessageStream({
    message: "Answer:",
  });

  return stream;
};
