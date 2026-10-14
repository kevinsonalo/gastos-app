---
description: Agrega una entrada nueva a docs/BITACORA_PROMPTS.md con lo hecho en esta sesión
---

Agregá una entrada nueva a `docs/BITACORA_PROMPTS.md` sobre la actividad de esta sesión. Tema o nota extra del usuario: $ARGUMENTS

1. Leé el archivo y tomá el número siguiente al último `### N.` de la sección "Detalle".
2. Agregá una fila a la tabla "Resumen" (`| N | Actividad del ciclo | Evidencia | Validación |`), en orden por número.
3. Agregá la sección `### N. <título>` antes de "## Aprendizajes generales", con el mismo formato de las entradas anteriores:
   - **Prompt:** el pedido real del usuario, citado.
   - **Resultado:** archivos y cambios concretos.
   - **Validación:** qué se corrió y su resultado real (número de pruebas, `npm run check`, `dotnet test`). No inventes resultados: si algo no se corrió, decilo.
   - **Aprendizaje** o **Pendiente**, si aplica.
4. En español, conciso, sin datos personales ni de correos reales.
5. Mostrá el diff y no hagas commit.
