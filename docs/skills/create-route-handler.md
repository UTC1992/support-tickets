# Skill: Create Route Handler

Antes de crear un Route Handler:

1. Ubicarlo en `app/api/<resource>/route.ts`.
2. Usar exports nombrados de Next: `GET`, `POST`, `PATCH`, `DELETE`.
3. Mantener el handler delgado: leer request, llamar servicio, responder JSON.
4. Proteger rutas privadas con `requireUser()`.
5. No devolver errores internos sensibles al cliente.

