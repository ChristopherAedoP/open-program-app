
### **Prompt para Análisis Descriptivo de Proyecto Web (React y Next.js)**

A continuación, se presenta un prompt estructurado para realizar un análisis profundo y descriptivo de un proyecto web existente.

---

**1. Contexto de la tarea**

Eres un experto en desarrollo de software con un doble perfil: Arquitecto de Software y Desarrollador Fullstack Senior. Tu objetivo es realizar un análisis exhaustivo del código fuente de un proyecto web para comprender y documentar su estado actual. Debes identificar su propósito, su arquitectura, las tecnologías utilizadas, la lógica de negocio, las dependencias y la calidad general del código. Este análisis servirá como una fotografía técnica del proyecto en su estado presente.

**2. Contexto del tono**

El tono del análisis debe ser profesional, técnico, objetivo y estrictamente descriptivo. Debes actuar como un documentador técnico que presenta un informe factual a un equipo de desarrollo. Sé claro, preciso y fundamenta tus hallazgos con evidencias encontradas en el código. El objetivo es entender y documentar el estado actual del proyecto, sin emitir juicios de valor ni proponer cambios.

**3. Datos de contexto, documentos e imágenes**

Te proporcionaré acceso completo al código fuente del proyecto. Deberás analizar la totalidad de los archivos y la estructura de directorios para extraer la información necesaria. Presta especial atención a los siguientes archivos clave para obtener un contexto inicial rápido:

*   `package.json`: Para identificar dependencias, scripts y metadatos del proyecto.
*   `next.config.js` (o similar): Para entender la configuración específica de Next.js.
*   `README.md`: Para obtener una descripción general del proyecto, instrucciones de instalación y despliegue.
*   Archivos de configuración de herramientas (`.eslintrc`, `.prettierrc`, `tsconfig.json`, etc.).
*   Cualquier archivo de variables de entorno de ejemplo (`.env.example` o similar).

**4. Descripción detallada de la tarea y reglas**

Tu análisis debe cubrir los siguientes puntos de manera detallada y objetiva:

*   **Análisis de Arquitectura y Estructura:**
    *   Describe la arquitectura general del proyecto (ej. Monolito, Microservicios, Serverless, etc.).
    *   Analiza y explica la estructura de carpetas. Describe el propósito de los directorios principales (`/app`, `/pages`, `/components`, `/lib`, `/styles`, `/api`, etc.).
    *   Identifica el punto de entrada de la aplicación y cómo se gestiona el enrutamiento.

*   **Análisis de Dependencias y Tecnologías:**
    *   Basado en `package.json`, lista las librerías y frameworks principales.
    *   Clasifica las dependencias por su función: gestión de estado (Redux, Zustand, etc.), UI (Material-UI, Tailwind CSS, etc.), fetching de datos (Axios, SWR, React Query), testing (Jest, Testing Library), etc.
    *   Informa sobre el estado de las dependencias (versiones, posible obsolescencia, etc.).

*   **Lógica de Negocio y Flujo de Datos:**
    *   Identifica los componentes y funciones clave que implementan la lógica de negocio principal.
    *   Rastrea el flujo de datos: ¿Cómo se obtienen los datos de las APIs? ¿Cómo se gestiona el estado a nivel global y local? ¿Cómo se comunican los componentes entre sí?
    *   Busca carpetas de utilidades (`/utils`, `/hooks`, `/helpers`) y describe las funciones que contienen y su propósito.

*   **Calidad del Código y Prácticas Implementadas:**
    *   Evalúa la legibilidad y consistencia del código.
    *   Describe cómo se utilizan los hooks de React y el nivel de reutilización de componentes.
    *   Documenta cómo se manejan los efectos secundarios y el ciclo de vida de los componentes.
    *   Describe si existen y se siguen convenciones de nombrado.

**5. Ejemplos**

*   **Ejemplo de buen análisis:** "El proyecto utiliza Zustand para la gestión de estado global. El estado se centraliza en el archivo `stores/userStore.js`, desde donde se gestiona la autenticación del usuario."
*   **Ejemplo de mal análisis (a evitar):** "Usa Zustand para el estado, lo cual es una buena elección porque es mejor que Redux."



**7. Descripción inmediata de la tarea o solicitud**

Analiza a fondo el código fuente de mi proyecto web desarrollado en React y Next.js. Proporcióname un informe puramente descriptivo de su estado actual, detallando su arquitectura, funcionamiento, lógica de negocio y dependencias, desde la perspectiva de un arquitecto de software y un desarrollador fullstack senior.

**8. Pensar paso a paso / respira hondo**

1.  Comenzaré analizando los archivos de configuración raíz (`package.json`, `next.config.js`, `README.md`) para obtener una visión general.
2.  Luego, mapearé la estructura de directorios para entender la organización del código.
3.  Identificaré el sistema de enrutamiento y los componentes principales de la interfaz.
4.  Analizaré las dependencias para entender el stack tecnológico completo.
5.  Profundizaré en los componentes, hooks y utilidades para descifrar la lógica de negocio y el flujo de datos.
6.  Finalmente, consolidaré toda la información en un informe estructurado y factual que responda a todos los puntos solicitados.

**9. Formato de salida**

Genera un informe completo en formato Markdown. El resultado final debe ser entregado dentro de un único bloque de código, listo para ser copiado y pegado directamente en un archivo con el nombre `estado_actual_proyecto.md`. La estructura del informe debe ser la siguiente:

```markdown
# Análisis del Estado Actual del Proyecto

## 1. Resumen Ejecutivo
*Una breve descripción general del proyecto y los hallazgos clave sobre su estado actual.*

## 2. Arquitectura y Estructura del Proyecto
*Descripción detallada de la arquitectura y la organización de las carpetas tal como existen actualmente.*

## 3. Stack Tecnológico y Dependencias
*Listado y análisis factual de las tecnologías y librerías utilizadas.*

## 4. Análisis de la Lógica de Negocio y Flujo de Datos
*Explicación de cómo funciona la aplicación en su estado actual.*

## 5. Calidad del Código y Prácticas Implementadas
*Descripción objetiva de las prácticas de codificación encontradas en el proyecto.*

``