class TextChunker {
  constructor() {
    this.chunkSize = 1000;
    this.chunkOverlap = 200;
  }

  chunkText(text) {
    try {
      // Clean the text
      text = text.replace(/\s+/g, " ").trim();

      // Split into sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

      const chunks = [];
      let currentChunk = "";

      for (const sentence of sentences) {
        // If adding this sentence would exceed chunk size, save current chunk and start new one
        if (currentChunk.length + sentence.length > this.chunkSize) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            // Start new chunk with overlap
            currentChunk =
              currentChunk.slice(-this.chunkOverlap) + " " + sentence;
          } else {
            // If a single sentence is longer than chunk size, split it
            const words = sentence.split(" ");
            currentChunk = "";
            for (const word of words) {
              if (currentChunk.length + word.length + 1 > this.chunkSize) {
                chunks.push(currentChunk.trim());
                currentChunk = word;
              } else {
                currentChunk += (currentChunk ? " " : "") + word;
              }
            }
          }
        } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
        }
      }

      // Add the last chunk if it's not empty
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      return chunks;
    } catch (error) {
      console.error("Error chunking text:", error);
      throw error;
    }
  }
}

module.exports = new TextChunker();
