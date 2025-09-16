<!-- @format -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Open Program IA** is a specialized Next.js 15 political chatbot application that democratizes access to political information in Chile. Built with assistant-ui and powered by a RAG (Retrieval-Augmented Generation) system, it enables citizens to query, compare and understand Chilean presidential candidates' government programs for the 2025 elections through natural conversation in Spanish.

### Core Business Value
- **Problem Solved**: Transforms extensive technical political documents (50-200 pages) into an accessible conversational interface
- **Target User**: Average Chilean citizen who wants to make informed voting decisions without reading complete programs
- **Key Differentiator**: Provides impartial analysis with precise academic citations and automatic candidate comparisons

### Current Status
Fully functional application with complete vector search implementation, query classification, taxonomic processing, and contextual response generation. Includes performance optimizations, structured SEO, and automated testing systems.

## IMPORTANT

    - Never add sensitive or private information in comments or code.
    - Always review and sanitize input data to prevent code injection.
    - Maintain consistency in coding style and follow best practices.
    - Document code clearly and concisely.
    - Never add emoticons, emojis, or informal language in comments or code.
    - Never add emoticons or emojis in logs.
    - Use descriptive and consistent variable and function names.
    - Avoid redundant or unnecessary comments.
    - Group related code into functions or classes.
    - Use consistent naming conventions.
    - Keep logs clear and concise to aid debugging, but avoid excessive verbosity or logging in all cases.
    - Whenever a significant change is made to the code, update the corresponding documentation, README.md, or similar.
    - Do not maintain legacy code; if an improvement is implemented, modify the existing code instead of adding new code.
    - README.md must always reflect the current state of the system. Do not add comparisons such as "before it was like this, now it is like that," or comments like "previously it worked this way, now it works this way," "X optimized," "Z improved."
    - Never add code or features that are not requested.
    - Never add tests or similar unless explicitly requested.
    - Never add unnecessary comments.
    - Never add features that have not been requested.
    - Never add code that has not been requested.
    - Never add test functions unless explicitly requested.
    - Never add unnecessary logic.
    - Never add duplicate code.
    - Never add performance measurement functions, stats, or similar unless explicitly requested.
    - All development plans must be documented in a `.md` file using the PDR format, including objectives, scope, and deliverables, before starting to implement any changes.
    - never add performance logs, "optimized data" logs, or similar metrics
    - never add performance logs, "optimized" logs, or similar metrics

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

### Testing Commands

```bash
# Health check - verify all systems
npm run test:health

# Quick test - sample queries (Pensiones category)
npm run test:quick

# Category test - specific themes
npm run test:sample

# Full test suite - all 343 citizen questions
npm run test:massive
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
├── (main)/            # Main route group
│   ├── layout.tsx     # Layout with sidebar
│   ├── page.tsx       # Main page with Assistant
│   ├── about/         # Informational pages
│   └── programs/      # Program pages
├── api/chat/route.ts  # Chat API endpoint with tool integration
├── layout.tsx         # Root layout with theme provider
├── globals.css        # Global styles
└── sitemap.ts         # Sitemap generation

components/
├── assistant-ui/      # Chat interface components
│   ├── thread.tsx     # Main chat thread with messages
│   ├── markdown-text.tsx
│   └── tool-fallback.tsx
├── ui/               # shadcn/ui components
├── assistant.tsx     # Main assistant component
├── app-sidebar.tsx   # Application sidebar
├── site-header.tsx   # Header with theme toggle
├── site-footer.tsx   # Site footer
└── seo.tsx          # SEO component

lib/
├── query-preprocessor.ts  # Query classification system
├── taxonomy.json         # Political taxonomy structure
└── utils.ts             # General utilities

scripts/
├── test-runner.ts       # Massive testing system
├── health-check.ts      # System health verification
└── hybrid-evaluator.ts  # Response quality evaluation
```

### Key Architecture Patterns

#### 1. Assistant-UI Integration

- Uses `AssistantRuntimeProvider` with `useChatRuntime()` hook
- Implements custom thread components with motion animations
- Handles message states (user, assistant, error, loading)
- Spanish language interface with Chilean political context

#### 2. Tool-Based AI Architecture

The chat API implements a sophisticated tool-based approach:

- **`searchPoliticalDocs` tool**: Semantic search in Qdrant with hybrid reranking
- **Query Classification**: Automatic categorization using structured taxonomy (10 categories, 43 subcategories)
- **Embedding Generation**: OpenAI text-embedding-3-small (1536 dimensions)
- **Hybrid Search**: Vector similarity + metadata filtering + candidate diversity
- **Academic Formatting**: Structured responses with precise citations

#### 3. Advanced Query Processing

```typescript
// Query preprocessing with taxonomy classification
const classification = await classifyQuery(query);
const expandedQuery = expandQuery(query, classification);
const queryEmbedding = await generateEmbedding(expandedQuery);

// Optimized vector search with oversampling
const queryResult = await qdrantClient.query(collection, {
	query: queryEmbedding,
	filter: adaptiveFilters(classification),
	limit: 30, // Oversampling for better recall
	with_vector: true,
	with_payload: true,
	params: {
		hnsw_ef: 128, // Optimized for better recall
		exact: false
	}
});

// Hybrid reranking with metadata
const rerankedResults = rerankWithMetadata(queryResult, query, classification);
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

1. **User Input**: Message entered in thread composer with Spanish suggestions
2. **Query Classification**: Automatic categorization using taxonomy system
3. **Query Expansion**: Enhancement with relevant keywords from taxonomy
4. **API Processing**: POST to `/api/chat/route.ts` with tool integration
5. **Vector Search**: Optimized Qdrant query with oversampling and adaptive filters
6. **Hybrid Reranking**: Results reordered using metadata and diversity scores
7. **Response Generation**: OpenAI GPT-4o-mini processes context with political analyst persona
8. **Academic Formatting**: Citations added with precise page and section references
9. **UI Rendering**: Streamed response with markdown support and animations

### Custom Features

#### Spanish Political Context

- Chilean presidential candidate focus
- Professional political analysis terminology
- Academic citation format: `*(Programa [Candidato] 2025, Pág. X, Sección: "[Título de Sección]")*`
- Structured analysis methodology (Panorama General, Análisis por Candidato, etc.)

#### Political Taxonomy System

- **Hierarchical Classification**: 10 main categories (Pensiones, Salud, Educación, etc.)
- **43 Subcategories**: Specific political topics (AFP, Isapres, CAE, etc.)
- **Adaptive Filtering**: Confidence-based filter selection
- **Query Expansion**: Automatic enhancement using taxonomy keywords
- **343 Test Questions**: Real citizen queries covering all political areas

#### Vector Database Integration

- **Rich Metadata**: Source tracking with candidate, party, page, section info
- **Hybrid Search**: Vector similarity + metadata scoring + diversity boosting
- **Academic Citations**: Precise references with *(Programa [Candidato] 2025, Pág. X)*
- **Oversampling Strategy**: Retrieves 30 candidates, reranks to top 15
- **Fallback Mechanisms**: Automatic retry without filters for better recall

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

- Comprehensive logging in API routes with structured output
- Graceful degradation for tool failures with automatic fallbacks
- User-friendly error messages in Spanish
- Fallback responses when search returns no results
- Query classification confidence scoring for quality control

### Testing and Quality Assurance

- **Automated Testing**: 343 real citizen questions with hybrid evaluation
- **Health Checks**: System verification before testing runs
- **Quality Metrics**: Pass rate ≥60%, AI evaluation + heuristics + pattern detection
- **Performance Monitoring**: Response time, document retrieval, classification accuracy
- **Continuous Improvement**: Failure analysis and recommendation system

### Key Project Documents

- **`estado_actual_proyecto.md`**: Complete technical analysis and architecture documentation
- **`logica_de_negocio.md`**: Business logic and functional specification for stakeholders
- **`PDR-Qdrant-Optimization.md`**: Search optimization and performance improvement plan
- **`PDR-Taxonomy & Qdrant Integration.md`**: Political taxonomy system and integration specs
- **`set-preguntas.md`**: 343 real citizen questions used for testing and development
- **`TESTING.md`**: Automated testing system documentation and usage guide
