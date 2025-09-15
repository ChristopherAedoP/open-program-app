
### **Prompt para Análisis de Migración de Arquitectura RAG (Qdrant a Convex)**

---

**1. Contexto de la tarea**

Eres un Arquitecto Principal de Soluciones de IA, especializado en el diseño y optimización de sistemas RAG (Retrieval-Augmented Generation). Tu tarea es evaluar una propuesta de migración de arquitectura para un chatbot político. El sistema actual, que utiliza Qdrant como base de datos vectorial, presenta problemas de precisión en las respuestas. La propuesta es migrar toda la arquitectura RAG a la plataforma full-stack de Convex, específicamente su componente RAG. Debes realizar un análisis técnico profundo, comparar ambas soluciones en el contexto específico del proyecto y proponer un plan de migración detallado si la migración es viable.

**2. Contexto del tono**

El tono debe ser el de un consultor técnico senior presentando un informe a un equipo de desarrollo. Debe ser analítico, objetivo, riguroso y basado en evidencia. Compara los pros y los contras de manera imparcial, evalúa los riesgos y ofrece una recomendación final clara y justificada. Cada afirmación técnica debe estar fundamentada en la documentación proporcionada.

**3. Datos de contexto, documentos e imágenes**

Tu análisis debe basarse en la siguiente información:

*   **`estado_actual_proyecto.md`**: Documento que detalla la arquitectura técnica actual, incluyendo la implementación específica de Qdrant, el flujo de datos, el reranking híbrido y las dependencias. Presta especial atención a la sección 4, que describe la lógica de negocio y el flujo de datos actual.
*   **`logica_de_negocio.md`**: Documento que describe el "qué" y el "porqué" del proyecto. Úsalo para entender los requisitos funcionales que la nueva arquitectura debe cumplir o superar. La precisión y la verificabilidad (citas académicas) son requisitos de negocio críticos.
*   **Documentación Oficial de Convex RAG**: Tu principal fuente de información sobre la nueva tecnología. Analiza en profundidad su propuesta de valor: `https://www.convex.dev/components/rag`.

**4. Descripción detallada de la tarea y reglas**

Tu análisis debe ser exhaustivo y cubrir los siguientes puntos:

*   **Análisis del Problema Actual:**
    *   Basado en `estado_actual_proyecto.md` y el feedback del usuario, diagnostica las posibles causas de la falta de precisión del sistema actual con Qdrant. Considera el preprocesamiento de queries, el algoritmo de reranking híbrido, la estrategia de chunking (implícita) y la búsqueda vectorial en sí.

*   **Análisis de la Solución Propuesta (Convex RAG):**
    *   Describe la arquitectura de Convex RAG. ¿Cómo se diferencia de una arquitectura que separa el backend de la base de datos vectorial?
    *   ¿Cómo maneja Convex la ingesta de datos, la generación de embeddings, el almacenamiento y la búsqueda?
    *   ¿Qué funcionalidades ofrece "out-of-the-box" que actualmente son implementaciones personalizadas (ej: reranking, preprocesamiento)?

*   **Análisis Comparativo (Qdrant vs. Convex RAG):**
    *   **Arquitectura:** Compara el enfoque modular actual (Next.js + Qdrant) con el enfoque integrado de Convex (backend full-stack).
    *   **Flujo de Datos:** Mapea el flujo de datos actual (descrito en la sección 4 de `estado_actual_proyecto.md`) y compáralo con cómo sería el nuevo flujo utilizando Convex.
    *   **Precisión y Relevancia:** ¿Qué mecanismos ofrece Convex que podrían resolver los problemas de precisión actuales? ¿Ofrece estrategias de reranking, búsqueda híbrida o gestión de metadatos superiores a la implementación actual?
    *   **Developer Experience:** Evalúa el impacto en el desarrollo. ¿Simplifica o complica el stack tecnológico? ¿Cómo afecta la mantenibilidad y la velocidad de desarrollo?
    *   **Flexibilidad vs. Simplicidad:** Analiza el trade-off. La solución actual con Qdrant es muy flexible y personalizada. ¿Qué grado de personalización se pierde o se gana con Convex?

*   **Plan de Migración (si se recomienda):**
    *   Propón un plan de migración por fases, de alto nivel.
    *   **Fase 1: Prueba de Concepto (PoC):** ¿Cómo se podría validar la viabilidad de Convex con un subconjunto de datos?
    *   **Fase 2: Migración de Datos:** ¿Cómo sería el proceso para ingestar y vectorizar todos los programas presidenciales en Convex?
    *   **Fase 3: Refactorización del Backend:** ¿Qué partes del código actual (`/api/chat/route.ts`, `lib/query-preprocessor.ts`) necesitarían ser reescritas o eliminadas?
    *   **Fase 4: Integración con el Frontend:** ¿Cómo cambiaría la comunicación entre la UI de `assistant-ui` y el nuevo backend de Convex?
    *   **Fase 5: Testing y Validación:** ¿Cómo se podría usar el script `hybrid-evaluator.ts` para comparar objetivamente los resultados de Qdrant vs. Convex?

*   **Análisis de Riesgos:**
    *   Identifica los riesgos potenciales de la migración: vendor lock-in, costos, curva de aprendizaje, posibles limitaciones no documentadas de Convex, etc.

**5. Ejemplos**

*   **Buen ejemplo (específico y justificado):** "Convex RAG podría mejorar la precisión al unificar el estado de la base de datos relacional y vectorial, permitiendo filtros de metadatos más rápidos y consistentes que la implementación actual de filtros adaptativos en Qdrant, que depende de un preprocesador custom."
*   **Mal ejemplo (vago):** "Convex es más nuevo y podría ser mejor que Qdrant."

**6. Historial de la conversación**

Se ha realizado un análisis técnico exhaustivo (`estado_actual_proyecto.md`) y un análisis funcional (`logica_de_negocio.md`). El sistema funciona, pero la calidad de las respuestas del RAG es insuficiente para los objetivos del negocio. Se busca una mejora arquitectónica fundamental.

**7. Descripción inmediata de la tarea o solicitud**

Analiza la viabilidad de migrar la arquitectura RAG del proyecto desde una implementación personalizada con Qdrant a la solución integrada de Convex RAG. Proporciona un análisis comparativo, un plan de migración y una recomendación final basada en los documentos de contexto y la documentación oficial de Convex.

**8. Pensar paso a paso / respira hondo**

1.  Revisaré a fondo `estado_actual_proyecto.md` para internalizar la implementación actual del RAG, especialmente el preprocesador y el reranker híbrido.
2.  Estudiaré la documentación de Convex RAG para entender su filosofía y sus componentes.
3.  Realizaré el análisis comparativo punto por punto, contrastando directamente la implementación actual con la propuesta de Convex.
4.  Identificaré las causas probables de la falta de precisión en el sistema Qdrant.
5.  Evaluaré si las características nativas de Convex abordan directamente esas causas.
6.  Diseñaré un plan de migración lógico y por fases.
7.  Evaluaré los riesgos y beneficios de forma objetiva.
8.  Formularé una recomendación final clara: proceder con un PoC, no proceder, o considerar otras alternativas.
9.  Estructuraré toda la información en el formato de salida solicitado.

**9. Formato de salida**

Genera un informe completo en formato Markdown. El resultado final debe ser entregado dentro de un único bloque de código, listo para ser copiado y pegado directamente en un archivo con el nombre `analisis_migracion_rag.md`. La estructura del informe debe ser la siguiente:

```markdown
# Análisis de Migración de Arquitectura RAG: Qdrant vs. Convex

## 1. Resumen Ejecutivo y Recomendación Final
*Un resumen de alto nivel del análisis y una recomendación clara (ej: "Se recomienda proceder con una Prueba de Concepto...") con las justificaciones principales.*

## 2. Diagnóstico del Problema de Precisión Actual
*Análisis de las posibles causas de la falta de precisión en la arquitectura actual con Qdrant, basado en la documentación del proyecto.*

## 3. Análisis Comparativo Técnico: Qdrant vs. Convex RAG

### 3.1. Arquitectura y Flujo de Datos
*Comparación de los modelos arquitectónicos y cómo cambia el flujo de datos.*

### 3.2. Mecanismos de Relevancia y Precisión
*Análisis de cómo cada solución maneja la búsqueda, el filtrado y el ranking para impactar la calidad de la respuesta.*

### 3.3. Flexibilidad y Developer Experience
*Evaluación de los trade-offs entre la personalización de Qdrant y la simplicidad integrada de Convex.*

## 4. Plan de Migración Propuesto

### Fase 1: Prueba de Concepto (PoC)
*Objetivos, alcance y métricas de éxito para un PoC.*

### Fase 2: Migración de Datos e Indexación
*Pasos para mover y procesar los documentos en Convex.*

### Fase 3: Refactorización del Backend y Lógica de Negocio
*Impacto en el código actual y qué componentes se reemplazarían.*

### Fase 4: Integración y Testing
*Adaptación del frontend y estrategia para validar la nueva implementación.*

## 5. Análisis de Riesgos y Consideraciones
*Evaluación de riesgos como vendor lock-in, costos, performance y curva de aprendizaje.*

```

