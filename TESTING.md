# 🧪 Sistema de Testing Masivo - Chatbot Político

Sistema automatizado para evaluar la calidad de respuestas del chatbot político usando las 343 preguntas ciudadanas de `set-preguntas.md`.

## 🎯 Características

- **Testing Masivo**: Ejecuta automáticamente las 343 preguntas ciudadanas
- **Evaluación Híbrida**: Combina IA + heurísticas + patrones para scoring preciso
- **Logging Estructurado**: Genera logs detallados en JSON y reportes markdown
- **Análisis por Categorías**: Performance breakdown por tema político
- **Detección de Fallos**: Identifica problemas específicos automáticamente
- **Recomendaciones**: Sugiere mejoras basadas en resultados

## 📋 Prerequisitos

1. **Servidor de desarrollo activo**:
   ```bash
   npm run dev
   ```

2. **Variables de entorno configuradas**:
   - `OPENAI_API_KEY`: Para evaluación con IA
   - `QDRANT_URL`: URL de Qdrant
   - `QDRANT_API_KEY`: API key de Qdrant
   - `QDRANT_COLLECTION`: Nombre de la colección

3. **Dependencias instaladas**:
   ```bash
   npm install
   ```

## 🚀 Uso Rápido

### Health Check
```bash
npm run test:health
```
Verifica que todos los sistemas estén funcionando correctamente.

### Test Rápido (Solo Pensiones)
```bash
npm run test:quick
```
Ejecuta un test pequeño con 3 preguntas de pensiones.

### Test por Categorías
```bash
npm run test:sample
```
Ejecuta test en Salud y Educación (5 preguntas por batch).

### Test Completo (343 preguntas)
```bash
npm run test:massive
```
⚠️ **Costo estimado**: ~$3.43 USD en OpenAI API
⚠️ **Tiempo estimado**: 30-45 minutos

## 📊 Scoring Algorithm

### Evaluación Híbrida (0-100%)

**70% - Evaluación IA (GPT-4o-mini)**:
- Relevancia (30%): ¿Responde a la pregunta?
- Completitud (25%): ¿Cubre todos los aspectos?
- Precisión (25%): ¿Información correcta?
- Calidad de fuentes (20%): ¿Documentos apropiados?

**20% - Heurísticas**:
- Documentos encontrados: +40 / -40 pts
- Longitud respuesta adecuada: +10 / -20 pts  
- Alta confianza clasificación: +20 / -10 pts
- Respuesta no genérica: +30 / -30 pts

**10% - Detección de Patrones**:
- Menciona candidatos: +25 pts
- Clasificación correcta: +35 / -20 pts
- Contenido sustantivo: +25 / -15 pts
- Propuestas específicas: +15 pts

### Criterios de Resultado
- **PASS**: Score ≥ 60%
- **FAIL**: Score < 60%
- **CRITICAL**: Sin documentos + clasificación errónea

## 📁 Estructura de Resultados

### Archivos Generados
```
test-results/
├── test-2025-09-03T18-30-00-000Z.json     # Resultados completos
└── test-2025-09-03T18-30-00-000Z-summary.md # Resumen ejecutivo
```

### Estructura del Log JSON
```json
{
  "session_summary": {
    "total_questions": 343,
    "pass_rate": 82.3,
    "avg_score": 78.5,
    "duration_minutes": 32.5,
    "cost_estimate_usd": 3.43
  },
  "category_performance": [
    {
      "category": "Pensiones",
      "pass_rate": 90.0,
      "avg_score": 85.2,
      "common_issues": ["No documents found (2x)"]
    }
  ],
  "failure_analysis": [
    {
      "failure_type": "No documents found",
      "count": 25,
      "percentage": 15.2,
      "recommended_action": "Review document indexing and taxonomy mapping",
      "priority": "high"
    }
  ],
  "recommendations": [
    "HIGH: Low document retrieval rate - check Qdrant indexing",
    "MEDIUM: Poor performance in categories: Seguridad, Migración"
  ]
}
```

## 🔧 Configuración Avanzada

### Opciones de CLI
```bash
# API personalizada
npm run test:massive -- --api http://localhost:3001

# Directorio de salida personalizado
npm run test:massive -- --output custom-results

# Categorías específicas
npm run test:massive -- --categories Pensiones,Salud,Educación

# Tamaño de batch personalizado
npm run test:massive -- --batch 5

# Delay entre requests (ms)
npm run test:massive -- --delay 2000
```

### Ejecución Programática
```typescript
import { TestRunner } from './scripts/test-runner';

const runner = new TestRunner({
  apiUrl: 'http://localhost:3000',
  outputDir: 'my-results',
  batchSize: 5,
  delayMs: 1500,
  categories: ['Pensiones', 'Salud']
});

await runner.run();
```

## 📈 Interpretación de Resultados

### Métricas Clave
- **Pass Rate > 80%**: Excelente performance
- **Pass Rate 60-80%**: Buena performance, revisar fallos
- **Pass Rate < 60%**: Requiere intervención urgente

### Tipos de Problemas Comunes

**"No documents found"**:
- Problema: Qdrant no encuentra documentos relevantes
- Solución: Revisar indexing y taxonomy mapping

**"Incorrect classification"**:
- Problema: Query mal clasificada
- Solución: Mejorar keywords en taxonomy.json

**"Generic response"**:
- Problema: Respuestas vacías o genéricas
- Solución: Mejorar chunking de documentos

**"Low classification confidence"**:
- Problema: Clasificador inseguro
- Solución: Expandir keywords de categorías

## 🛠️ Troubleshooting

### Error: "API unavailable"
```bash
# 1. Verificar servidor
npm run dev

# 2. Verificar puerto
curl http://localhost:3000/api/chat

# 3. Health check
npm run test:health
```

### Error: "OpenAI API failed"
- Verificar `OPENAI_API_KEY` en `.env.local`
- Verificar saldo en cuenta OpenAI
- Reducir batch size si hay rate limits

### Error: "Classification system error"
- Verificar archivos `lib/taxonomy.json` y `lib/query-preprocessor.ts`
- Revisar logs del servidor de desarrollo

## 💡 Tips de Uso

1. **Empezar con test pequeños** antes del masivo
2. **Ejecutar health check** antes de tests largos  
3. **Monitorear costos** de OpenAI API
4. **Analizar fallos por categoría** para mejoras focalizadas
5. **Usar resultados** para iterar en taxonomy y chunking

## 📞 Soporte

Para problemas o mejoras, revisar:
- Logs del servidor de desarrollo
- Archivos de resultados generados
- Health check para diagnóstico inicial