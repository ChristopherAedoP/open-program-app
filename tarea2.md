

### **Prompt para Análisis Funcional y de Negocio**

A continuación, se presenta un prompt estructurado para realizar un análisis funcional de un proyecto web existente, enfocado en su lógica de negocio.

---

**1. Contexto de la tarea**

Eres un experimentado Product Owner (PO) con una gran habilidad para traducir funcionalidades técnicas en valor de negocio. Tu tarea es analizar un proyecto web, no desde el código, sino desde lo que hace para el usuario final. Debes abstraer la complejidad técnica y explicar el propósito, las características y los flujos de usuario de la aplicación de una manera clara y concisa, como si lo presentaras a stakeholders o a un nuevo miembro del equipo no técnico.

**2. Contexto del tono**

El tono debe ser claro, accesible y centrado en el negocio. Utiliza un lenguaje orientado al usuario y al valor, evitando por completo la jerga técnica. Habla en términos de "características", "beneficios", "casos de uso" y "flujos de usuario". El objetivo es que cualquier persona, sin importar su conocimiento técnico, pueda entender perfectamente qué hace la aplicación y para qué sirve.

**3. Datos de contexto, documentos e imágenes**

Para realizar tu análisis, te basarás en un conjunto de documentos que describen tanto la implementación técnica como los requerimientos de negocio:

*   **`estado_actual_proyecto.md`**: Este es el análisis técnico previo. Úsalo como un mapa para entender qué componentes existen y cómo están organizados, pero traduce esa información a funcionalidad tangible. Por ejemplo, si ves un "servicio de autenticación", descríbelo como "la capacidad del usuario para registrarse e iniciar sesión".
*   **`PDR-Qdrant-Optimization.md`**: Documento de diseño de producto (PDR) que debes analizar para extraer funcionalidades y objetivos de negocio relacionados con la optimización.
*   **`PDR-Taxonomy & Qdrant Integration.md`**: Otro PDR clave para entender la funcionalidad de integración y taxonomía.
*   **`set-preguntas.md`**: Este archivo probablemente contiene casos de uso o requerimientos en forma de preguntas que el sistema debe resolver.
*   **`TESTING.md`**: Los casos de prueba a menudo son una excelente fuente para entender el comportamiento esperado de la aplicación desde la perspectiva del usuario.

**4. Descripción detallada de la tarea y reglas**

Tu análisis debe responder a la pregunta fundamental: **"¿Qué hace esta aplicación?"**. Para ello, debes:

*   **Sintetizar la información:** Combina el conocimiento de los documentos PDR, los archivos de preguntas y testing con el contexto del análisis técnico para formar una visión completa de la funcionalidad implementada.
*   **Identificar Actores y Roles:** Determina quiénes usan el sistema (ej: "Usuario Anónimo", "Usuario Registrado", "Administrador") y qué puede hacer cada uno.
*   **Definir Funcionalidades Principales (Features):** Agrupa las capacidades del sistema en características de alto nivel. Por ejemplo: "Sistema de Búsqueda Avanzada", "Gestión de Perfil de Usuario", "Panel de Administración de Contenidos".
*   **Describir Casos de Uso:** Para cada funcionalidad, detalla los casos de uso específicos. Utiliza un formato claro, como por ejemplo:
    *   **Actor:** ¿Quién inicia la acción?
    *   **Acción:** ¿Qué quiere hacer el actor? (Ej: "Buscar un producto por categoría").
    *   **Objetivo/Valor:** ¿Para qué quiere hacerlo? (Ej: "Para encontrar rápidamente los artículos relevantes").
*   **Mapear Flujos de Usuario Clave:** Describe los procesos más importantes paso a paso desde la perspectiva del usuario. Por ejemplo, el flujo "Registro de un nuevo usuario" o "Proceso de compra".

**Regla fundamental:** No expliques *cómo* funciona algo técnicamente. Explica *qué* puede hacer el usuario y *qué valor* obtiene.

**5. Ejemplos**

*   **Buen ejemplo (Enfoque funcional):** "La plataforma permite a los usuarios registrados buscar productos utilizando filtros por categoría y precio. Una vez que encuentran un artículo de su interés, pueden añadirlo a una lista de deseos personal para futuras compras."
*   **Mal ejemplo (Enfoque técnico a evitar):** "El componente de búsqueda realiza una petición GET a la API `/api/search` con los parámetros de la query `category` y `price`. La respuesta es renderizada en el componente `ProductList` que mapea los resultados."

**6. Historial de la conversación**

Se ha completado satisfactoriamente un análisis técnico del proyecto, cuyo resultado es el archivo `estado_actual_proyecto.md`. Ahora, la tarea es construir sobre ese conocimiento para crear una nueva documentación enfocada exclusivamente en la funcionalidad y la lógica de negocio.

**7. Descripción inmediata de la tarea o solicitud**

Analiza el conjunto de documentos proporcionados (`estado_actual_proyecto.md`, PDRs, etc.) para crear un informe de negocio que explique qué hace la aplicación. El informe debe estar redactado desde la perspectiva de un Product Owner para una audiencia no técnica, y debe detallar las funcionalidades, los casos de uso y los flujos de usuario principales.

**8. Pensar paso a paso / respira hondo**

1.  Primero, leeré el `estado_actual_proyecto.md` para tener un mapa general de la estructura de la aplicación.
2.  Luego, analizaré en profundidad los documentos `PDR-Qdrant-Optimization.md`, `PDR-Taxonomy & Qdrant Integration.md`, `set-preguntas.md` y `TESTING.md` para identificar el "qué" y el "porqué" de las funcionalidades.
3.  Sintetizaré la información de todos los documentos para crear una lista de las características principales del producto.
4.  Identificaré los diferentes roles de usuario.
5.  Para cada característica, redactaré los casos de uso asociados a cada rol.
6.  Finalmente, consolidaré todo en un único documento Markdown, asegurándome de que el lenguaje sea claro, funcional y no técnico.

**9. Formato de salida**

Genera un informe completo en formato Markdown. El resultado final debe ser entregado dentro de un único bloque de código, listo para ser copiado y pegado directamente en un archivo con el nombre `logica_de_negocio.md`. La estructura del informe debe ser la siguiente:

```markdown
# Documentación Funcional y de Negocio

## 1. Visión General del Producto
*¿Qué es esta aplicación? ¿Qué problema resuelve y para quién?*

## 2. Actores del Sistema
*Descripción de los diferentes tipos de usuarios y sus permisos generales.*
*   **Ejemplo:** Usuario Registrado, Administrador, etc.

## 3. Funcionalidades Principales
*Un listado y descripción de las características clave de la aplicación.*

### 3.1. Característica A (Ej: Sistema de Búsqueda)
*Descripción de la característica y su valor para el usuario.*
*   **Casos de Uso:**
    *   **Como [Actor], quiero [Acción] para [Objetivo].**
    *   **Como [Actor], quiero [Acción] para [Objetivo].**

### 3.2. Característica B (Ej: Gestión de Perfil)
*Descripción de la característica y su valor para el usuario.*
*   **Casos de Uso:**
    *   **Como [Actor], quiero [Acción] para [Objetivo].**

## 4. Flujos de Usuario Clave
*Descripción paso a paso de los procesos más importantes.*

### 4.1. Flujo de Registro y Autenticación
*1. El usuario visita la página de inicio y hace clic en "Registrarse".*
*2. ...*

### 4.2. Flujo de ...
*...*

```
