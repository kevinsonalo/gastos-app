---
description: Corre las pruebas de frontend y backend y resume los resultados
allowed-tools: Bash(npm run check), Bash(dotnet test:*), Bash(git status:*)
---

Corré los quality gates y resumí los resultados. Alcance opcional (front, api o vacío para ambos): $ARGUMENTS

1. Frontend: `npm run check`.
2. Backend: antes, verificá si `Gastos.Api` está corriendo; si lo está, avisame y no sigas con el backend (bloquea las DLL, error MSB3021). Si no, `dotnet test api --logger "trx;LogFilePrefix=tests" --results-directory api/TestResults`.
3. Respondé con una tabla: proyecto, pasaron / fallaron / omitidas, duración.
4. Para cada falla: prueba, mensaje, causa probable y archivo a revisar. **No modifiques código ni pruebas**; solo proponé el arreglo.
