const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

class VectorStore {
  constructor() {
    this.initialized = false;
    this.baseUrl = null;
    this.headers = null;
    this.collectionName = "articles";
    this.vectorSize = 1024;
  }

  async initialize() {
    if (!this.initialized) {
      this.baseUrl = process.env.QDRANT_URL;
      this.headers = {
        "api-key": process.env.QDRANT_API_KEY,
      };
      await this.createCollectionIfNotExists();
      this.initialized = true;
    }
  }

  async createCollectionIfNotExists() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections/${this.collectionName}`,
        { headers: this.headers }
      );

      if (response.status === 200) {
        console.log(`Collection ${this.collectionName} already exists`);
        await this.checkCollectionPoints();
        return;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await this.createCollection();
      } else {
        throw error;
      }
    }
  }

  async checkCollectionPoints() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/collections/${this.collectionName}/points/count`,
        {},
        { headers: this.headers }
      );

      if (response.status === 200) {
        const count = response.data.result.count;
        if (!count || count === 0) {
          console.log(`Collection ${this.collectionName} is empty`);
        } else {
          console.log(`Collection ${this.collectionName} has ${count} points`);
        }
      }
    } catch (error) {
      console.error("Error checking collection points:", error);
      throw error;
    }
  }

  async createCollection() {
    try {
      const response = await axios.put(
        `${this.baseUrl}/collections/${this.collectionName}`,
        {
          vectors: {
            size: this.vectorSize,
            distance: "Dot",
          },
        },
        { headers: this.headers }
      );

      if (response.status === 200) {
        console.log(`Successfully created collection ${this.collectionName}`);
      } else {
        throw new Error(`Failed to create collection: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }

  async storeEmbeddings(articleId, chunks, embeddings, metadata) {
    await this.initialize();

    if (!embeddings || embeddings.length === 0 || embeddings[0].length === 0) {
      throw new Error(
        "Invalid embeddings: embeddings array is empty or contains empty vectors"
      );
    }

    const points = chunks.map((chunk, index) => {
      const vector = embeddings[index].map(Number);
      const cleanText = chunk.replace(/<[^>]*>/g, "").trim();

      if (vector.length !== 1024) {
        throw new Error(
          `Invalid vector size: expected 1024, got ${vector.length}`
        );
      }

      const numericId = parseInt(
        uuidv4().replace(/-/g, "").substring(0, 8),
        16
      );

      return {
        id: numericId,
        vector: vector,
        payload: {
          text: cleanText,
          metadata: {
            ...metadata,
            chunk: chunks[index],
            chunkIndex: index,
            articleId: articleId,
            originalId: `${articleId}_${index}`,
          },
        },
      };
    });

    try {
      const upsertResponse = await axios.put(
        `${this.baseUrl}/collections/${this.collectionName}/points`,
        {
          points: points,
        },
        {
          headers: this.headers,
        }
      );

      if (upsertResponse.status === 200) {
        console.log(
          `Successfully stored ${points.length} embeddings for article ${articleId}`
        );
      } else {
        throw new Error(
          `Failed to store embeddings: ${upsertResponse.statusText}`
        );
      }
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Qdrant API error: ${
            error.response.data.error || error.response.statusText
          }`
        );
      }
      throw error;
    }
  }
  // TODO: Uncomment this when we have a way to verify the points are stored
  // async verifyPointsStored(expectedCount) {
  //   try {
  //     for (let attempt = 1; attempt <= 3; attempt++) {
  //       const response = await axios.post(
  //         `${this.baseUrl}/collections/${this.collectionName}/points/scroll`,
  //         {
  //           limit: expectedCount,
  //           with_payload: false,
  //           with_vector: false,
  //         },
  //         { headers: this.headers }
  //       );

  //       if (response.status === 200) {
  //         const points = response.data.result.points;
  //         const actualCount = points ? points.length : 0;
  //         if (actualCount === expectedCount) {
  //           return; // Success!
  //         }

  //         // Wait before next attempt
  //         await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  //       }
  //     }

  //     // If we get here, all attempts failed
  //     throw new Error(
  //       `Not all points were stored. Expected ${expectedCount}, got 0 after 3 attempts`
  //     );
  //   } catch (error) {
  //     console.error("Error verifying points:", error);
  //     throw error;
  //   }
  // }

  async searchSimilar(queryEmbedding, limit = 5) {
    await this.initialize();

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Invalid query embedding: embedding vector is empty");
    }

    const vector = queryEmbedding.map(Number);

    try {
      const response = await axios.post(
        `${this.baseUrl}/collections/${this.collectionName}/points/search`,
        {
          vector: vector,
          limit: limit,
          with_payload: true,
          with_vector: false,
        },
        {
          headers: this.headers,
        }
      );

      if (response.status === 200) {
        const results = response.data.result;
        if (!results || results.length === 0) {
          console.log("No similar points found in the collection");
        }
        return results;
      } else {
        throw new Error(`Search failed: ${response.statusText}`);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 403) {
          throw new Error("Authentication failed: Invalid or missing API key");
        }
        throw new Error(
          `Qdrant API error: ${
            error.response.data.error || error.response.statusText
          }`
        );
      }
      throw error;
    }
  }
}

module.exports = new VectorStore();
