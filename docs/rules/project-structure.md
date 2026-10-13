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

