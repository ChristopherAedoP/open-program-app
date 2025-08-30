# Chatbot Político Web - Contexto para Qwen Code

## Descripción General del Proyecto

Este proyecto es una aplicación web de chatbot impulsada por inteligencia artificial diseñada para consultar programas electorales de candidatos presidenciales chilenos. Permite a los usuarios hacer preguntas sobre propuestas específicas en áreas como salud, pensiones, educación, etc., y obtener respuestas basadas en documentos oficiales, con citas precisas y fuentes verificables.

Key technologies and libraries used:
- **Framework**: Next.js 15 (App Router, potentially using Turbopack as indicated by the dev script)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style), Radix UI primitives
- **AI Integration**: 
  - `@assistant-ui/react` and related packages for the chat UI.
  - `ai` and `@ai-sdk/openai` for interacting with the OpenAI API.
- **State Management/Chat Runtime**: `@assistant-ui/react-ai-sdk`
- **Vector Database**: Qdrant (`@qdrant/js-client-rest`, `qdrant-client`) - likely used for storing/retrieving political program data or chat history.
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons
- **Herramienta `searchPoliticalDocs`:**
    - Toma la consulta del usuario y genera un embedding vectorial usando el modelo `text-embedding-3-small`.
    - Realiza una búsqueda semántica en una colección de Qdrant Cloud.
    - Devuelve los  documentos más relevantes, incluyendo su contenido y metadatos (candidato, partido, página, tema, etc.).
    5. El LLM recibe el contexto de los documentos recuperados y genera una respuesta informativa, citando siempre las fuentes.
    6. La respuesta se transmite al cliente en tiempo real usando Server-Sent Events (SSE).


### Backend (`/src/app/api/chat/route.ts`)

- **Punto Final:** `POST /api/chat`
- **Funcionalidad:**
    1. Recibe mensajes del usuario desde el frontend.
    2. Utiliza el Vercel AI SDK (`streamText`) con el modelo `gpt-4o-mini`.
    3. Define una herramienta personalizada `searchPoliticalDocs` que el LLM puede invocar.
    4. **Herramienta `searchPoliticalDocs`:**
        - Toma la consulta del usuario y genera un embedding vectorial usando el modelo `text-embedding-3-small`.
        - Realiza una búsqueda semántica en una colección de Qdrant Cloud.
        - Permite filtrar por candidato (`candidate`) y tema (`topic`).
        - Devuelve los 5 documentos más relevantes, incluyendo su contenido y metadatos (candidato, partido, página, tema, etc.).
    5. El LLM recibe el contexto de los documentos recuperados y genera una respuesta informativa, citando siempre las fuentes.
    6. La respuesta se transmite al cliente en tiempo real usando Server-Sent Events (SSE).
                
The application features a main chat interface (`/`) with a sidebar for navigation. The sidebar includes links to sections for political programs (`/programs`) and information about the project (`/about`). The chat interface uses a custom `Thread` component from `assistant-ui` to display the conversation.

## Building and Running

1.  **Environment Setup**: Add your OpenAI API key to a `.env.local` file:
    ```
    OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```
2.  **Install Dependencies**: Use `npm`, `yarn`, `pnpm`, or `bun` to install dependencies:
    ```bash
    pnpm install # or npm install, yarn install, bun install
    ```
3.  **Development Server**: Start the development server:
    ```bash
    pnpm dev # or npm run dev, yarn dev, bun dev
    ```
    This will start the server, likely on [http://localhost:3000](http://localhost:3000).
4.  **Build**: To create a production build:
    ```bash
    pnpm build # or npm run build, yarn build, bun run build
    ```
5.  **Start Production Build**: To run the production build locally:
    ```bash
    pnpm start # or npm run start, yarn start, bun run start
    ```
6.  **Linting**: To check for linting errors:
    ```bash
    pnpm lint # or npm run lint, yarn lint, bun run lint
    ```

## Development Conventions

- **Structure**: The project follows the standard Next.js 15 App Router structure with `app/` for pages and layouts, `components/` for reusable UI components, `lib/` for utilities, and `hooks/` for custom React hooks.
- **UI Components**: UI components are built using Tailwind CSS and shadcn/ui components, which are Radix UI primitives styled with Tailwind.
- **Styling**: Tailwind CSS v4 is used for styling, configured via `postcss.config.mjs` and `tailwind.config.js` (likely, though not explicitly read here).
- **AI Chat**: The chat functionality is implemented using the `assistant-ui` library, with the core logic residing in `app/assistant.tsx` and the UI components in `components/assistant-ui/`.
- **Routing**: Uses Next.js file-based routing within the `app/` directory.
- **TypeScript**: The project uses TypeScript for type safety (`tsconfig.json` is present).