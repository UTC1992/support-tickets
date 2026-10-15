# Project Structure Rules

- `app/`: rutas, paginas y Route Handlers de Next.js.
- `features/`: codigo por funcionalidad, por ejemplo `features/auth`.
- `lib/`: helpers compartidos, servicios, auth y acceso a base de datos.
- `prisma/`: schema, migraciones y configuracion de base de datos.

Separacion basica:

- UI en `features/<feature>/components`.
- Hooks en `features/<feature>/hooks`.
- Servicios de feature en `features/<feature>/services`.
- Servicios compartidos o de datos en `lib/services`.
- Route Handlers en `app/api`.

Organizacion por feature:

- Las features representan funcionalidades del negocio, no roles de usuario.
- Ejemplos: `features/tickets`, `features/users`, `features/catalogs`.
- Los roles (`owner`, `admin`, `technician`) se mantienen en rutas y reglas de
  acceso; no deben convertirse en directorios principales dentro de `features`.
- Una funcionalidad compartida por varios roles debe tener una sola
  implementacion y adaptar sus acciones segun permisos.

