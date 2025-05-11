class Article {
  constructor({ title, content, link, pubDate, source }) {
    this.title = title;
    this.content = content;
    this.link = link;
    this.pubDate = pubDate;
    this.source = source;
  }
}

module.exports = Article;
