const Parser = require("rss-parser");
const parser = new Parser();
const Article = require("../entity/article.entity");

exports.fetchArticlesFromMultipleSources = async (limit = 50) => {
  const newsSources = require("../config/newsSources");

  const fetchArticles = async (source) => {
    try {
      let feed = await parser.parseURL(source.url);
      const articles = [];
      feed.items.forEach((item) => {
        articles.push(
          new Article({
            title: item.title,
            link: item.link,
            content: item.content,
            pubDate: item.pubDate,
            source: source.name,
          })
        );
      });
      return articles;
    } catch (error) {
      console.error(`Error fetching articles from ${source.name}:`, error);
      return [];
    }
  };

  const articles = await Promise.all(
    newsSources.map((source) => fetchArticles(source))
  );

  return articles.flat();
};
