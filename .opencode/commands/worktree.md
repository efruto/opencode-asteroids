---
description: Crea un git worktree en .worktrees/ a partir del argumento
---

Creá un worktree con este argumento del usuario: $ARGUMENTS

Pasos:

1. Derivá el nombre del worktree a partir del argumento: en minúsculas, cada espacio reemplazado por un guion, sin acentos ni caracteres especiales, sin guiones en los extremos. Si el argumento no tiene espacios, usalo tal cual (normalizado).
2. Ejecutá exactamente este comando, reemplazando `<nombre>` por el nombre derivado:

   ```
   git worktree add .worktrees/<nombre>
   ```

Reglas estrictas:

- No hagas nada más: no cambies de directorio, no corras ningún otro comando, no modifiques archivos, no hagas commit ni push.
- Solo ejecutá el comando de creación del worktree y reportá su salida tal cual (éxito o error de git, sin reinterpretarla ni buscar workarounds).
- Si el argumento está vacío, pedile un nombre al usuario y no ejecutes nada hasta tenerlo.
- Si los argumentos son muy largos, simplificalos a un nombre significativo.
