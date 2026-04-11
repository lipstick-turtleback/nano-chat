import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initSchema } from './db.js';
import { errorHandler } from './middleware/error.js';
import ollamaRoutes from './routes/ollama.js';
import gameRoutes from './routes/games.js';
import knowledgeRoutes from './routes/knowledge.js';
import sessionRoutes from './routes/sessions.js';
import challengeRoutes from './routes/challenges.js';
import healthRoutes from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database
initSchema();
console.log('✅ Database initialized');

// Routes
app.use('/api/challenges', challengeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/sessions', sessionRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LexiChat server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🦙 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
});

export default app;
