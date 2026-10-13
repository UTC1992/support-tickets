# Prisma

Archivos principales:

```txt
prisma/schema.prisma
prisma/migrations/20261013130000_initial_support_schema/migration.sql
```

Este proyecto sigue el patron de Prisma ORM v7:

- `schema.prisma` declara proveedor, modelos y enums.
- `prisma.config.ts` declara rutas de schema/migraciones y la URL usada por Prisma CLI.

Para usarlo con Supabase normalmente se configuran estas URLs:

```env
DATABASE_URL="postgresql://..." # pooler/runtime de la app
DIRECT_URL="postgresql://..."   # conexion directa para Prisma CLI/migraciones
SHADOW_DATABASE_URL="postgresql://..." # opcional, solo si configuras shadow DB
```

Luego, con Prisma instalado:

```bash
yarn prisma generate
yarn prisma migrate deploy
```

Notas:

- `schema.prisma` define los modelos para la app.
- `prisma.config.ts` carga `DIRECT_URL` para migraciones.
- `migration.sql` crea tablas, enums, indices, triggers, datos iniciales y reglas RLS.
- La migracion usa SQL crudo en varias partes porque Supabase RLS, policies y `auth.users` no se expresan completamente solo con modelos Prisma.
- El cliente Prisma se genera en `generated/prisma`, no en `node_modules`.
- No se modela almacenamiento de archivos; el MVP solo guarda datos de soporte en texto.
