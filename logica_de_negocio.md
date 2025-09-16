# Documentación Funcional y de Negocio

## 1. Visión General del Producto

**Open Program IA** es un asistente inteligente conversacional que democratiza el acceso a la información política en Chile. La plataforma permite a cualquier ciudadano consultar, comparar y comprender los programas de gobierno de los candidatos presidenciales 2025 a través de una interfaz de chat natural en español.

### ¿Qué problema resuelve?

**Problema Principal**: Los programas presidenciales son documentos extensos (50-200 páginas) y técnicos que la mayoría de ciudadanos no tiene tiempo ni herramientas para analizar de manera comparativa y objetiva.

**Solución**: Transforma estos documentos en una base de conocimiento consultable que responde preguntas ciudadanas específicas con:
- **Respuestas inmediatas** en lenguaje natural
- **Citas académicas precisas** con páginas y secciones exactas
- **Análisis imparcial** sin sesgo político
- **Comparación automática** entre candidatos
- **Acceso 24/7** desde cualquier dispositivo

### ¿Para quién está diseñado?

**Usuario Principal**: Ciudadano chileno promedio que quiere tomar una decisión informada de voto pero no tiene tiempo o conocimiento para leer programas completos.

**Casos de uso típicos**:
- Estudiante universitario que quiere saber qué propone cada candidato sobre educación superior
- Trabajador que busca entender las diferencias en propuestas laborales
- Dueña de casa interesada en pensiones y salud
- Profesional que necesita comparar propuestas económicas específicas
- Activista que quiere verificar posturas sobre medioambiente

## 2. Actores del Sistema

### 2.1. Usuario Ciudadano (Usuario Principal)
**Descripción**: Cualquier persona interesada en consultar programas presidenciales

**Permisos y capacidades**:
- Realizar consultas ilimitadas sobre programas políticos
- Recibir respuestas detalladas con citas académicas
- Comparar propuestas entre candidatos
- Acceder a análisis por categorías temáticas
- Navegar historial de conversación
- Cambiar tema visual (modo oscuro/claro)

**No requiere**:
- Registro de usuario
- Autenticación
- Datos personales
- Pago o suscripción

### 2.2. Sistema de IA (Actor Técnico)
**Descripción**: Analista político virtual especializado en programas chilenos

**Rol funcional**:
- Procesa consultas ciudadanas en español
- Busca información relevante en base de datos política
- Genera respuestas estructuradas e imparciales
- Proporciona referencias académicas precisas
- Mantiene neutralidad política estricta

## 3. Funcionalidades Principales

### 3.1. Sistema de Consulta Conversacional

**Descripción**: Interfaz de chat que permite hacer preguntas en lenguaje natural sobre cualquier aspecto de los programas presidenciales.

**Valor para el usuario**: Elimina la barrera de leer documentos extensos, permitiendo obtener respuestas específicas de forma instantánea.

**Casos de Uso**:
- **Como ciudadano**, quiero preguntar "¿Qué propone Kast sobre pensiones?" **para** conocer su postura específica sin leer su programa completo
- **Como votante indeciso**, quiero preguntar "Compara las propuestas de salud de todos los candidatos" **para** tomar una decisión informada
- **Como estudiante**, quiero consultar "¿Habrá gratuidad universitaria completa?" **para** entender el impacto en mi futuro académico
- **Como trabajador**, quiero saber "¿Qué candidatos proponen reducir la jornada laboral?" **para** evaluar beneficios laborales

### 3.2. Sistema de Búsqueda Inteligente por Categorías

**Descripción**: Organiza automáticamente las consultas en 10 áreas temáticas (Pensiones, Salud, Educación, Trabajo, Economía, Seguridad, Vivienda, Medioambiente, Descentralización, Institucionalidad) con 43 subcategorías específicas.

**Valor para el usuario**: Garantiza respuestas precisas y evita información irrelevante al clasificar automáticamente cada consulta en el tema correcto.

**Casos de Uso**:
- **Como ciudadano preocupado por salud**, quiero que el sistema entienda automáticamente si pregunto por "Isapres" vs "listas de espera" **para** recibir información específica y no genérica
- **Como analista**, quiero consultar subcategorías específicas como "AFP vs sistema de reparto" **para** obtener comparaciones técnicas precisas
- **Como periodista**, quiero acceder a propuestas categorizadas **para** elaborar reportajes temáticos estructurados

### 3.3. Análisis Comparativo Automático

**Descripción**: Permite comparar automáticamente las propuestas de múltiples candidatos sobre un mismo tema, presentando las diferencias y similitudes de manera estructurada.

**Valor para el usuario**: Facilita la toma de decisiones al mostrar todas las opciones disponibles en formato comparativo fácil de entender.

**Casos de Uso**:
- **Como votante**, quiero comparar "propuestas económicas de Matthei vs Jara" **para** entender las diferencias en sus enfoques
- **Como ciudadano de región**, quiero ver "qué proponen todos sobre descentralización" **para** evaluar beneficios regionales
- **Como trabajador de salud**, quiero comparar "planes de inversión en hospitales públicos" **para** conocer el impacto en mi sector

### 3.4. Sistema de Referencias Académicas

**Descripción**: Cada respuesta incluye citas precisas con formato académico, indicando programa, candidato, página y sección exacta de donde proviene la información.

**Valor para el usuario**: Proporciona transparencia total y permite verificar la información directamente en las fuentes oficiales.

**Casos de Uso**:
- **Como estudiante de ciencias políticas**, quiero recibir citas con formato *(Programa Kast 2025, Pág. 45, Sección: "Reforma Previsional")* **para** usar la información en trabajos académicos
- **Como periodista**, quiero verificar las fuentes exactas **para** confirmar la veracidad de la información antes de publicar
- **Como ciudadano escéptico**, quiero poder revisar los documentos originales **para** confirmar que la información es fidedigna

### 3.5. Sistema de Validación y Mejora Continua

**Descripción**: Sistema automatizado que evalúa constantemente la calidad de las respuestas usando 343 preguntas ciudadanas reales, asegurando precisión y relevancia.

**Valor para el usuario**: Garantiza que las respuestas sean consistentemente útiles y precisas a través de testing masivo automático.

**Casos de Uso**:
- **Como usuario del sistema**, quiero tener confianza en que las respuestas son precisas **para** no recibir información incorrecta que afecte mi decisión de voto
- **Como equipo de desarrollo**, queremos identificar automáticamente áreas de mejora **para** optimizar continuamente la experiencia del usuario

## 4. Flujos de Usuario Clave

### 4.1. Flujo de Consulta Simple

**Objetivo**: Obtener información específica sobre un tema político

1. **El usuario accede** a la plataforma desde cualquier navegador web
2. **Visualiza la interfaz de bienvenida** con sugerencias de preguntas comunes en español
3. **Escribe su pregunta** en lenguaje natural (ej: "¿Qué propone Matthei para las pensiones?")
4. **El sistema clasifica automáticamente** la consulta en la categoría correcta (Pensiones > AFP)
5. **Busca información relevante** en los programas usando inteligencia artificial
6. **Genera una respuesta estructurada** con análisis imparcial
7. **Presenta la información** con citas académicas precisas
8. **El usuario puede hacer preguntas de seguimiento** para profundizar o aclarar dudas

**Resultado**: Usuario obtiene información específica y verificable sobre su consulta política.

### 4.2. Flujo de Comparación Entre Candidatos

**Objetivo**: Comparar propuestas de múltiples candidatos sobre un tema específico

1. **El usuario formula una pregunta comparativa** (ej: "Compara las propuestas de seguridad de Kast y Jara")
2. **El sistema identifica** que se requiere análisis comparativo
3. **Busca información de ambos candidatos** en la categoría Seguridad
4. **Organiza la respuesta en formato estructurado**:
   - Panorama General del tema
   - Análisis por Candidato (con propuestas específicas)
   - Comparación Directa (similitudes y diferencias)
   - Evaluación Técnica (viabilidad)
5. **Incluye citas de ambos programas** con páginas y secciones exactas
6. **El usuario puede profundizar** preguntando por aspectos específicos de la comparación

**Resultado**: Usuario tiene una visión clara y balanceada de las diferencias entre candidatos en el tema consultado.

### 4.3. Flujo de Exploración Temática

**Objetivo**: Explorar un área política completa con sus subcategorías

1. **El usuario hace una consulta amplia** (ej: "¿Qué propuestas hay en educación?")
2. **El sistema reconoce** que es una consulta general de la categoría Educación
3. **Busca información en todas las subcategorías** (Educación Superior, Técnico-profesional, Escolar, etc.)
4. **Organiza la respuesta por subcategorías** mostrando un panorama completo
5. **Presenta propuestas de todos los candidatos** organizadas temáticamente
6. **Incluye referencias específicas** para cada propuesta mencionada
7. **Sugiere preguntas de profundización** para subcategorías específicas

**Resultado**: Usuario obtiene una visión panorámica completa del tema con la opción de profundizar en áreas específicas.

### 4.4. Flujo de Verificación de Información

**Objetivo**: Confirmar o verificar información específica de un candidato

1. **El usuario formula una pregunta de verificación** (ej: "¿Es cierto que Parisi propone eliminar el IVA en alimentos básicos?")
2. **El sistema busca información específica** en el programa del candidato mencionado
3. **Verifica la existencia y contexto** de la propuesta consultada
4. **Proporciona una respuesta clara** (Sí/No/Parcial) con detalles
5. **Incluye la cita exacta** con página y sección donde aparece la información
6. **Contextualiza la propuesta** dentro del plan general del candidato
7. **Puede sugerir propuestas relacionadas** del mismo candidato

**Resultado**: Usuario confirma la veracidad de información específica con evidencia documental verificable.

### 4.5. Flujo de Consulta con Refinamiento

**Objetivo**: Obtener información cada vez más específica a través de preguntas iterativas

1. **El usuario inicia con una consulta general** (ej: "Háblame sobre salud")
2. **El sistema proporciona un panorama general** de propuestas en salud
3. **El usuario refina la consulta** (ej: "¿Y específicamente sobre Isapres?")
4. **El sistema ajusta automáticamente** a la subcategoría Salud > Isapres
5. **Proporciona información más específica** sobre el tema refinado
6. **El usuario puede seguir refinando** (ej: "¿Qué dice Kast específicamente?")
7. **El sistema filtra por candidato específico** manteniendo el contexto de Isapres
8. **Cada respuesta mantiene el hilo conversacional** y referencias apropiadas

**Resultado**: Usuario navega de lo general a lo específico de manera natural, obteniendo exactamente la información que necesita.