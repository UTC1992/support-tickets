# Skill: Create Service

Antes de crear un servicio:

1. Si es especifico de una feature, usar `features/<feature>/services`.
2. Si es compartido o de datos, usar `lib/services`.
3. Usar arrow functions.
4. Validar entradas en el servicio, no solo en la UI.
5. No usar Prisma desde componentes client-side.
6. Las llamadas de browser deben ir a Route Handlers con `fetch`.

