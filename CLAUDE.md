# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 political chatbot application built with assistant-ui, designed to analyze Chilean political programs using OpenAI and Qdrant vector database. The app provides an AI assistant interface for querying and comparing political proposals from presidential candidates.

## Development Commands

### Core Commands
```bash
# Development server with turbopack
npm run dev
# or
yarn dev
# or 
pnpm dev
# or
bun dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Environment Setup
Create `.env.local` with:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=your_collection_name
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router and React 19
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4o-mini
- **UI Framework**: assistant-ui library for chat interface
- **Vector Database**: Qdrant for semantic search of political documents
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Built-in React state with assistant-ui runtime

### Project Structure

```
app/
├── layout.tsx          # Root layout with theme provider
├── page.tsx           # Main page routing to Assistant
├── assistant.tsx      # Main assistant component with sidebar layout
└── api/chat/route.ts  # Chat API endpoint with tool integration

components/
├── assistant-ui/      # Chat interface components
│   ├── thread.tsx     # Main chat thread with messages
│   ├── markdown-text.tsx
│   └── tool-fallback.tsx
├── ui/               # shadcn/ui components
└── app-sidebar.tsx   # Application sidebar
└── site-header.tsx   # Header with theme toggle
```

### Key Architecture Patterns

#### 1. Assistant-UI Integration
- Uses `AssistantRuntimeProvider` with `useChatRuntime()` hook
- Implements custom thread components with motion animations
- Handles message states (user, assistant, error, loading)
- Spanish language interface with Chilean political context

#### 2. Tool-Based AI Architecture
The chat API implements a tool-based approach:
- `searchPoliticalDocs` tool for semantic search in Qdrant
- Embedding generation using OpenAI text-embedding-3-small
- Structured search results with metadata (candidate, party, page numbers, sections)
- Professional political analyst persona with academic formatting

#### 3. Vector Search Implementation
```typescript
// Key pattern for vector search
const queryEmbedding = await generateEmbedding(query);
const queryResult = await qdrantClient.query(collection, {
    query: queryEmbedding,
    filter: filters,
    limit: 15,
    with_vector: true,
    with_payload: true
});
```

#### 4. Responsive Layout System
- Sidebar-based layout using shadcn/ui sidebar components
- Dark/light theme support with next-themes
- Responsive design with mobile-first approach
- Custom CSS variables for thread width and padding

### Component Architecture

#### Thread Component (`components/assistant-ui/thread.tsx`)
- Main chat interface with welcome screen
- Animated message rendering using Framer Motion  
- Spanish welcome suggestions for political queries
- Integrated composer with send/cancel states
- Branch picker for conversation alternatives

#### Assistant Component (`app/assistant.tsx`)
- Layout orchestration with sidebar and header
- Runtime provider setup
- Full-height responsive container

#### API Route (`app/api/chat/route.ts`)
- Streaming text generation with tool integration
- Professional political analyst system prompt in Spanish
- Comprehensive error handling and logging
- Tool result processing and validation

### Data Flow

1. **User Input**: Message entered in thread composer
2. **API Processing**: POST to `/api/chat/route.ts`
3. **Tool Execution**: `searchPoliticalDocs` queries Qdrant
4. **Response Generation**: OpenAI processes results with political analyst persona
5. **UI Rendering**: Streamed response with markdown support

### Custom Features

#### Spanish Political Context
- Chilean presidential candidate focus
- Professional political analysis terminology
- Academic citation format: `*(Programa [Candidato] 2025, Pág. X, Sección: "[Título de Sección]")*`
- Structured analysis methodology (Panorama General, Análisis por Candidato, etc.)

#### Vector Database Integration
- Metadata-rich search results with source tracking
- Section hierarchy and header information
- Candidate and party filtering capabilities
- Academic reference generation from search results

## Development Guidelines

### Adding New Tools
When extending the AI capabilities:
1. Define tool schema in `/api/chat/route.ts`
2. Implement tool execution logic with error handling
3. Update system prompt to reference new tool
4. Test with various query types

### Component Development
- Follow assistant-ui patterns for chat components
- Use Framer Motion for animations
- Implement proper accessibility attributes
- Maintain responsive design principles

### Styling Approach
- Uses Tailwind CSS with custom CSS variables
- shadcn/ui component system
- Dark mode support via next-themes
- Custom thread sizing with CSS variables

### Error Handling
- Comprehensive logging in API routes
- Graceful degradation for tool failures
- User-friendly error messages in Spanish
- Fallback responses when search returns no results