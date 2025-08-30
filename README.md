# Chatbot Político Web

Chatbot web con IA para consultar programas de candidatos presidenciales chilenos.

## 🚀 Tecnologías

- **Frontend**: Next.js + Assistant UI (interface tipo ChatGPT)
- **Backend**: Vercel AI SDK + herramienta personalizada Qdrant
- **LLM**: OpenAI GPT-4o-mini 
- **Base de datos vectorial**: Qdrant Cloud (3,274 documentos políticos)
- **Embeddings**: all-MiniLM-L6-v2 (384 dimensiones)

## 🔧 Setup

### 1. Configurar credenciales

Edita `.env.local`:
```bash
OPENAI_API_KEY=tu_openai_api_key
QDRANT_URL=https://tu-cluster-url.qdrant.tech  
QDRANT_API_KEY=qdt_tu_qdrant_api_key
```

### 2. Ejecutar desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 💬 Ejemplo de Uso

**Preguntas que puedes hacer:**
- "¿Qué propone Jeannette Jara para pensiones?"
- "Compara las políticas de salud de los candidatos"
- "¿Qué dice el programa sobre educación pública?"
- "Propuestas de vivienda en la página 25"

**El chatbot responderá con:**
- Información extraída de documentos reales
- Citas precisas: candidato, página, sección
- Fuentes verificables de programas oficiales

## 🏗️ Arquitectura

### Backend (`/api/chat`)
- Recibe pregunta del usuario
- Genera embedding de la query
- Busca documentos relevantes en Qdrant Cloud
- Envía contexto a OpenAI GPT-4o-mini
- Streaming de respuesta en tiempo real

### Frontend  
- Interface de chat profesional con Assistant UI
- Componente Thread (tipo ChatGPT) automático
- Styling customizado para contexto político
- Responsive design

### Base de Datos
- **3,274 documentos** políticos procesados
- **Metadatos**: candidato, partido, página, tema, tipo propuesta
- **9 temas**: salud, pensiones, educación, seguridad, etc.
- **Búsqueda semántica** con filtros políticos

## 🔍 Funcionalidades

✅ **Búsqueda semántica** en programas políticos  
✅ **Respuestas con fuentes** (candidato + página)  
✅ **Interface tipo ChatGPT** profesional  
✅ **Streaming en tiempo real**  
✅ **Filtros automáticos** por candidato/tema  
✅ **Citas precisas** para verificación
