const { fetchArticlesFromMultipleSources } = require("../service/rssFetcher");
const textChunker = require("../service/textChunker");
const embeddingService = require("../service/embeddingService");
const vectorStore = require("../service/vectorStore");

exports.ingestArticles = async (req, res) => {
  try {
    const articles = await fetchArticlesFromMultipleSources(50);
    let allChunks = [];
    let allEmbeddings = [];

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No articles could be fetched from any source",
      });
    }

    for (const article of articles) {
      try {
        const articleId = `${article.source}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const chunks = await textChunker.chunkText(article.content);
        const embeddings = await Promise.all(
          chunks.map((chunk) => embeddingService.generateEmbedding(chunk))
        );

        allChunks.push(...chunks);
        allEmbeddings.push(...embeddings);

        await vectorStore.storeEmbeddings(articleId, chunks, embeddings, {
          title: article.title,
          source: article.source,
          pubDate: article.pubDate,
          link: article.link,
        });
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error);
      }
    }

    res.json({
      success: true,
      articles,
      count: articles.length,
      message: "Articles processed and stored in vector database",
    });
  } catch (err) {
    console.error("Detailed error:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({
      success: false,
      error: "Ingestion failed",
      details: err.message,
    });
  }
};
