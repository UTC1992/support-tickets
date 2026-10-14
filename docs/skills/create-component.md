# Skill: Create Component

Antes de crear un componente:

1. Ubicarlo en `features/<feature>/components`.
2. Nombrarlo en `PascalCase`.
3. Usar arrow function.
4. Exportar default al final si es el unico export.
5. Mantenerlo enfocado en UI; no poner llamadas directas a Prisma.
6. Revisar `docs/rules/frontend.md` y construir el componente mobile-first.

Ejemplo:

```tsx
const LoginForm = () => {
  return <form />;
};

export default LoginForm;
```

