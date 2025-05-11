const axios = require("axios");

class EmbeddingService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      // Validate API key is present
      if (!process.env.JINA_API_KEY) {
        throw new Error("JINA_API_KEY environment variable is not set");
      }
      this.initialized = true;
    }
  }

  async generateEmbedding(text) {
    await this.initialize();

    // Validate input text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Invalid input text for embedding generation");
    }

    const apiUrl = "https://api.jina.ai/v1/embeddings";
    const data = {
      model: "jina-clip-v2",
      task: "retrieval.query",
      input: [{ text: text }],
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    };

    try {
      const response = await axios.post(apiUrl, data, {
        headers: headers,
      });

      // Check if response has the expected structure
      if (
        !response.data ||
        !response.data.data ||
        !response.data.data[0] ||
        !response.data.data[0].embedding
      ) {
        throw new Error("Invalid response format from Jina API");
      }

      // Return the embedding vector
      return response.data.data[0].embedding;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error(
            "Authentication failed: Invalid or missing Jina API key"
          );
        }
        throw new Error(
          `Jina API error: ${
            error.response.data.error || error.response.statusText
          }`
        );
      }
      throw error;
    }
  }
}

module.exports = new EmbeddingService();
