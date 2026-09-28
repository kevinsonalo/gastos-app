# Mejores prácticas de prompts con Claude Code

> Aprendizajes del curso de Claude Code y de su aplicación en el proyecto *Mis Gastos*.
> Autor: Kevin Solano Muñoz · Objetivo Babel 2026 (KR3 / KR4)

## 1. Principio base: la IA propone, el desarrollador decide

Claude acelera el trabajo, pero la responsabilidad técnica sigue siendo mía. Toda salida pasa por **entender → validar → aceptar**:

1. **Entender:** leer el diff completo; si algo no se entiende, preguntar *"explicame por qué"* antes de aceptarlo.
2. **Validar:** `npm run build`, `npm test` y `npm run lint` tienen que pasar, y además reviso manualmente la UI.
3. **Aceptar:** commit pequeño con un mensaje que diga qué cambió y por qué.

---

## 2. Anatomía de un buen prompt

| Elemento | Pregunta que responde | Ejemplo en este proyecto |
|----------|----------------------|--------------------------|
| **Contexto** | ¿Dónde y sobre qué? | *"En `src/domain/stats.ts`…"* |
| **Objetivo** | ¿Qué resultado quiero? | *"…agregá una función que calcule el gasto promedio por categoría"* |
| **Restricciones** | ¿Qué reglas se respetan? | *"…pura, sin React, redondeando con `roundMoney`"* |
| **Criterio de éxito** | ¿Cómo sé que está bien? | *"…con pruebas Vitest que cubran lista vacía y decimales"* |
| **Formato de salida** | ¿Cómo lo quiero? | *"Mostrame primero el plan y esperá mi aprobación"* |

### ❌ Prompt débil
```
Agregá presupuestos
```

### ✅ Prompt efectivo
```
Agregá presupuesto mensual por categoría.
- Modelo: campo opcional `monthlyBudget` en Category (migrá la clave a gastos:v2).
- Lógica pura en src/domain/budget.ts, sin React.
- En el Dashboard, barra de progreso y alerta visual al superar el 80 %.
- Respetá la regla de dependencias de CLAUDE.md y agregá un ADR.
- Pruebas Vitest para 0 %, 80 %, 100 % y categoría sin presupuesto.
Antes de escribir código, mostrame el plan.
```

---

## 3. Buenas prácticas

### 3.1 Dar contexto persistente con `CLAUDE.md`
- Ejecutar `/init` al inicio del proyecto y **revisar** lo que genera.
- Documentar ahí las convenciones que la IA no puede deducir: idioma del código, regla de dependencias, manejo de fechas (`YYYY-MM-DD`, UTC-6), comandos.
- Mantenerlo actualizado: una convención que no está escrita se va a romper.

### 3.2 Pedir un plan antes que código
- Para cambios de más de un archivo: *"Proponé un plan y esperá mi aprobación"*, o usar el **modo plan** (Shift + Tab).
- Revisar el plan es barato; revertir 10 archivos es caro.

### 3.3 Tareas pequeñas y verificables
- Una tarea = un objetivo = un commit.
- Evitar *"hacé todo el módulo"*; mejor ir por capas: dominio → pruebas → hook → UI.

### 3.4 Referenciar archivos y patrones existentes
- *"Seguí el mismo patrón que `validateExpense` en `domain/validation.ts`"* produce código consistente.
- Mencionar rutas exactas reduce la ambigüedad y el consumo de contexto.

### 3.5 Pedir opciones con trade-offs, no una sola respuesta
- *"Dame 2-3 alternativas con pros, contras y riesgo"* evita que la IA tome la decisión por mí.
- Ejemplo real: elegir entre localStorage, API .NET o reutilizar EnglobaApp (ADR-001).

### 3.6 Cerrar el ciclo con verificación automática
- Incluir en el prompt: *"Corré `npm test` y `npm run build` y corregí los errores"*.
- TypeScript estricto + pruebas + linter detectaron los errores de la IA en segundos (ver `CODE_REVIEW.md` #1, #4).

### 3.7 Usarla como revisor, no solo como generador
- *"Revisá este archivo como un senior de React: bugs, rendimiento, accesibilidad"*.
- Filtrar sugerencias por contexto: se descartó virtualizar la lista porque era sobreingeniería (`CODE_REVIEW.md` #8).

### 3.8 Pedir explicaciones para aprender
- *"Explicame por qué `useRef().current` en el render es un anti-patrón"*.
- El objetivo es **fortalecer habilidades**, no solo producir código.

### 3.9 Gestionar el contexto de la sesión
- `/clear` al cambiar de tarea, para no arrastrar contexto irrelevante.
- `/compact` en sesiones largas.
- `Esc` para interrumpir si va por mal camino; corregir el rumbo temprano.

### 3.10 Uso responsable y seguridad
- No pegar secretos, tokens, datos de clientes ni información confidencial de Babel.
- Mantener el modo de permisos en **pedir aprobación** para comandos y ediciones.
- Revisar dependencias nuevas que proponga la IA (licencia, mantenimiento, necesidad real).
- Declarar el uso de IA en la documentación del proyecto.

---

## 4. Plantillas reutilizables

**Análisis / entendimiento**
```
Explicame cómo fluye <acción> desde <componente> hasta <capa>.
Indicá los archivos involucrados y los riesgos que ves.
```

**Nueva funcionalidad**
```
Implementá <feature>.
Contexto: <archivos/patrones a seguir>.
Restricciones: <reglas de arquitectura, estilo, librerías permitidas>.
Criterio de éxito: <pruebas / comportamiento esperado>.
Primero mostrame el plan.
```

**Code review**
```
Revisá <archivo> como un senior de <tecnología>.
Clasificá los hallazgos por severidad (alta/media/baja), con la línea exacta y la corrección propuesta.
No apliques cambios todavía.
```

**Refactorización**
```
Refactorizá <archivo> para <objetivo> sin cambiar el comportamiento.
Las pruebas existentes deben seguir pasando; corré npm test al final.
```

**Pruebas**
```
Generá pruebas Vitest para <módulo> cubriendo casos normales, bordes y errores.
Usá los fixtures de src/__tests__/fixtures.ts.
```

**Depuración**
```
Tengo este error: <mensaje completo + comando que lo produjo>.
Entorno: <versiones>. Diagnosticá la causa raíz antes de proponer la solución.
```
> Ejemplo real: el error `styleText` de Vite se resolvió identificando la causa raíz (Node 18 vs 20.19+), no parchando el código.

**Documentación**
```
Documentá <decisión/módulo> como ADR con contexto, decisión y consecuencias.
```

---

## 5. Comandos de Claude Code más útiles

| Comando | Uso |
|---------|-----|
| `claude` | Iniciar una sesión en la carpeta del proyecto |
| `/init` | Generar `CLAUDE.md` con el contexto del repositorio |
| `/review` | Revisar los cambios actuales |
| `/clear` | Limpiar el contexto al cambiar de tarea |
| `/compact` | Resumir la conversación en sesiones largas |
| `/cost` | Ver el consumo de la sesión |
| `/help` | Ayuda |
| `Shift + Tab` | Alternar modos (permisos / plan) |
| `Esc` | Interrumpir la ejecución |

---

## 6. Lecciones aprendidas del proyecto

1. **El contexto es lo que más influye en la calidad:** compartir el objetivo real de Workday produjo un plan alineado a los KRs.
2. **Las restricciones explícitas evitan retrabajo:** "sin librerías de gráficos" y "dominio puro" mantuvieron el diseño limpio.
3. **La verificación automática no es opcional:** atrapó un error de tipos y un anti-patrón de React.
4. **Los errores de entorno también son parte del ciclo:** Node 18 vs Vite 8 y credenciales de GitHub con otra cuenta. Se resolvieron dando a la IA el mensaje completo del error.
5. **La IA tiende a sobrediseñar:** hay que filtrar sus sugerencias por el contexto real del proyecto.
