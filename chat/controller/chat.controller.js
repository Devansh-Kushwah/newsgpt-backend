const embeddingService = require("../../ingestion/service/embeddingService");
const vectorStore = require("../../ingestion/service/vectorStore");
const { askGemini } = require("../service/geminiService");
const redis = require("../../config/redis");

exports.chat = async (req, res) => {
  try {
    const { limit } = req.query;
    const { query, sessionId } = req.body;
    const sessionKey = `chatSession:${sessionId}`;

    const exists = await redis.exists(sessionKey);

    if (!exists) {
      const session = { messages: [] };
      await redis.set(sessionKey, JSON.stringify(session));
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query parameter is required",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.write("data: \n\n");

    let context;

    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const results = await vectorStore.searchSimilar(
        queryEmbedding,
        parseInt(limit) || 5
      );

      if (!results || results.length === 0) {
        res.write(
          `data: ${JSON.stringify({
            error: "No relevant context found",
            details:
              "Could not find any relevant news articles for your query.",
          })}\n\n`
        );
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      context = results.map((result) => result.payload.text).join("\n");
    } catch (contextError) {
      console.error("Context retrieval error:", contextError);
      res.write(
        `data: ${JSON.stringify({
          error: "Failed to retrieve context",
          details: contextError.message,
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    try {
      const stream = await askGemini(context, query);

      /** start of saving user message to session*/
      const session = await redis.get(sessionKey);
      const sessionData = JSON.parse(session);
      sessionData.messages.push({
        role: "user",
        content: query,
        timestamp: new Date(),
      });
      await redis.set(sessionKey, JSON.stringify(sessionData));
      /** end of saving user message to session*/

      let streamData = "";
      for await (const chunk of stream) {
        if (chunk.text) {
          const text = chunk.text.replace(/\n/g, "\\n");
          streamData += text;
          res.write(`data: ${text}\n\n`);
        }
      }

      /** start of saving assistant message to session*/
      sessionData.messages.push({
        role: "assistant",
        content: streamData,
        timestamp: new Date(),
      });
      await redis.set(sessionKey, JSON.stringify(sessionData));
      /** end of saving assistant message to session*/
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      res.write(
        `data: ${JSON.stringify({
          error: "Streaming failed",
          details: streamError.message,
        })}\n\n`
      );
    }

    // Send completion signal
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Search error:", error);
    res.write(
      `data: ${JSON.stringify({
        error: "Search failed",
        details: error.message,
      })}\n\n`
    );
    res.end();
  }
};

exports.chatHistory = async (req, res) => {
  const { sessionId } = req.body;
  const sessionKey = `chatSession:${sessionId}`;
  const session = await redis.get(sessionKey);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: "Session not found",
    });
  }
  const sessionData = JSON.parse(session);
  res.json(sessionData.messages);
};

exports.chatSessions = async (req, res) => {
  try {
    const keys = await redis.keys("chatSession:*");
    const sessions = await Promise.all(
      keys.map(async (key) => {
        const session = await redis.get(key);
        const sessionData = JSON.parse(session);
        const messages = sessionData.messages || [];
        let title = messages.length > 0 ? messages[0].content : "New Chat";

        if (title.length > 20) {
          title = title.substring(0, 20) + "...";
        }

        return {
          sessionId: key.split(":")[1],
          lastMessage: title,
          timestamp:
            messages.length > 0
              ? messages[0].timestamp
              : new Date().toISOString(),
        };
      })
    );

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    res.status(500).json({ error: "Failed to fetch chat sessions" });
  }
};
