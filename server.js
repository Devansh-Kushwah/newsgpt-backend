// server.js
const app = require("./app");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
