# Changelog

Todos los cambios importantes a este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-09-15

### Agregado
- **Sistema de Clasificación Inteligente de Consultas** (`lib/query-preprocessor.ts`)
  - Clasificación automática por categorías y subcategorías políticas usando taxonomy.json
  - Detección de tipo de consulta (general, específica, comparativa)
  - Expansión inteligente de consultas con palabras clave relacionadas
  - Sistema de caché para mejorar rendimiento
  - Filtros adaptativos basados en confianza de clasificación

- **Sistema de Testing Automatizado Completo**
  - 343 preguntas reales de ciudadanos para testing comprehensivo
  - Scripts de testing por categorías, muestras y masivo
  - Evaluación híbrida con IA y heurísticas 
  - Health checks del sistema
  - Testing de optimizaciones y rendimiento

- **Documentación Técnica Completa**
  - `TESTING.md` - Guía completa del sistema de testing
  - `PDR-Qdrant-Optimization.md` - Plan de optimización de búsquedas
  - `PDR-Taxonomy & Qdrant Integration.md` - Especificaciones del sistema de taxonomía
  - `estado_actual_proyecto.md` - Análisis técnico completo
  - `logica_de_negocio.md` - Especificación funcional para stakeholders

### Mejorado
- **Optimización Mayor del Sistema RAG**
  - Reranking híbrido con múltiples factores (diversidad, metadatos, similitud semántica)
  - Oversampling inteligente (30 candidatos → top 15 después de reranking)
  - Filtros graduales adaptativos basados en confianza de clasificación
  - Búsqueda multi-candidato paralela optimizada
  - Mejora significativa en recall y precision

- **Búsquedas por Candidatos Específicos**
  - Normalización de texto para manejo correcto de acentos (José → Jose)
  - Estrategia de filtros graduales para maximizar cobertura
  - Sistema de fallback automático para búsquedas sin resultados
  - Mapeo robusto de nombres y apellidos

- **Arquitectura del Chat API** (`app/api/chat/route.ts`)
  - Integración completa con sistema de clasificación inteligente
  - Manejo robusto de errores con logging detallado
  - Validación de entrada y salida mejorada
  - Optimización de prompts del sistema

### Corregido
- **Bug Crítico**: Consultas de candidatos específicos devolvían 0 resultados
  - Problema: Filtros demasiado restrictivos (candidate + taxonomy_path + topic_category)
  - Solución: Estrategia gradual flexible (candidate + topic_category → fallback a solo candidate)
  
- **Bug de Mapeo**: Candidatos con acentos no se mapeaban correctamente
  - Problema: "José Antonio Kast" no mapeaba a "Jose Antonio Kast" 
  - Solución: Función normalizeText() que elimina acentos en comparaciones

- **Problemas de Clasificación**: AI modelo enviaba query_type correcto pero sistema lo sobreescribía
  - Problema: classifyQuery() no respetaba el parámetro providedQueryType
  - Solución: Priorizar clasificación del modelo AI sobre detección interna

### Técnico
- **Dependencias Actualizadas**
  - Agregado: `dotenv: ^17.2.2` para manejo de variables de entorno
  - Agregado: `tsx: ^4.20.5` para ejecución de scripts TypeScript
  - Actualización de configuraciones de testing

- **Arquitectura**
  - Separación clara entre lógica de clasificación y búsqueda
  - Tipo de datos fuertemente tipado con TypeScript
  - Sistema modular y escalable
  - Principios SOLID aplicados consistentemente

### Métricas de Rendimiento
- **Cobertura de Candidatos**: Aumento de 12.5% a 87.5% para consultas generales
- **Precisión de Clasificación**: >95% usando sistema de taxonomía
- **Tiempo de Respuesta**: Optimizado con caché y búsquedas paralelas
- **Calidad de Respuestas**: Sistema de evaluación híbrida implementado

## [0.1.0] - 2024-XX-XX

### Agregado
- Versión inicial de Open Program IA
- Integración básica con OpenAI GPT-4o-mini
- Conexión con base de datos vectorial Qdrant
- Interfaz de chat usando assistant-ui
- Sistema básico de búsqueda semántica
- 8 candidatos presidenciales Chilean 2025
- Citas académicas automáticas
- Diseño responsive con dark/light mode