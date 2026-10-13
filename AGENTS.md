# Project Docs Index

Antes de crear o modificar codigo del proyecto, revisar los docs segun el tipo
de cambio:

- Estructura de carpetas: `docs/rules/project-structure.md`
- Nombres, exports y commits: `docs/rules/naming.md`
- Componentes React: `docs/skills/create-component.md`
- Hooks React: `docs/skills/create-hook.md`
- Servicios y logica de datos: `docs/skills/create-service.md`
- Route Handlers de Next.js: `docs/skills/create-route-handler.md`

Reglas rapidas:

- Componentes en `features/<feature>/components`.
- Hooks en `features/<feature>/hooks`.
- Servicios de feature en `features/<feature>/services`.
- Servicios compartidos en `lib/services`.
- Route Handlers en `app/api`.
- Usar arrow functions por defecto.
- Usar `export default` al final cuando el archivo tenga un solo export
  principal, excepto Route Handlers de Next que requieren `GET`, `POST`,
  `PATCH`, etc.
- Validar con `yarn lint` y `yarn tsc --noEmit` antes de commitear.
