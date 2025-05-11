# NewsGPT Backend

A powerful backend service for NewsGPT that combines news aggregation, vector embeddings, and AI-powered chat capabilities.

## Features

- **News Ingestion**: Automatically fetches and processes news articles from multiple RSS sources
- **Vector Storage**: Stores article embeddings for semantic search capabilities
- **AI-Powered Chat**: Uses Google's Gemini AI for intelligent responses based on news context
- **Session Management**: Maintains chat history and sessions using Redis
- **Real-time Streaming**: Provides streaming responses for a better user experience

## Prerequisites

- Node.js (Latest LTS version recommended)
- Redis server
- Google Cloud API key (for Gemini AI)
- Qdrant vector database

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd newsgpt-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
REDIS_URL=your_redis_url
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=your_qdrant_url
```

## Project Structure

```
newsgpt-backend/
├── chat/
│   ├── controller/
│   │   └── chat.controller.js    # Chat endpoints and logic
│   ├── service/
│   │   └── geminiService.js      # Gemini AI integration
│   └── chat.routes.js            # Chat routes
├── ingestion/
│   ├── controller/
│   │   └── ingest.controller.js  # Article ingestion logic
│   ├── service/
│   │   ├── rssFetcher.js        # RSS feed fetching
│   │   ├── textChunker.js       # Text processing
│   │   ├── embeddingService.js  # Vector embeddings
│   │   └── vectorStore.js       # Vector database operations
│   └── ingest.routes.js         # Ingestion routes
└── server.js                    # Main application entry
```

## API Endpoints

### Chat Endpoints

- `POST /chat`
  - Body: `{ query: string, sessionId: string }`
  - Query params: `limit` (optional, default: 5)
  - Returns: Server-sent events stream with AI responses

- `POST /chat/history`
  - Body: `{ sessionId: string }`
  - Returns: Chat history for the specified session

- `POST /chat/sessions`
  - Body: `{ deviceId: string }`
  - Returns: List of chat sessions for the device

### Ingestion Endpoints

- `POST /ingest`
  - Fetches and processes news articles
  - Returns: Processing status and article count

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Dependencies

- `@google/genai`: Google's Generative AI SDK
- `@qdrant/js-client-rest`: Vector database client
- `express`: Web framework
- `redis`: Session management
- `rss-parser`: RSS feed parsing
- `axios`: HTTP client
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

## Error Handling

The application includes comprehensive error handling for:
- API failures
- Context retrieval issues
- Streaming errors
- Session management
- Database operations
