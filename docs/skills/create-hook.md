# Skill: Create Hook

Antes de crear un hook:

1. Ubicarlo en `features/<feature>/hooks`.
2. Nombrarlo con `use`, ejemplo `useSession`.
3. Usar `"use client"` si usa estado, efectos o APIs del navegador.
4. No mezclar render/UI dentro del hook.
5. Exportar default al final si es el unico export.

