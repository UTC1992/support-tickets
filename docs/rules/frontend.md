# Frontend Rules

- Construir todas las interfaces mobile-first: los estilos base deben funcionar
  primero en pantallas pequenas y los breakpoints deben agregar espacio o
  columnas, no reparar una vista de escritorio reducida.
- Verificar como minimo anchos de 375 px y 1280 px antes de finalizar un cambio
  visual.
- Evitar scroll horizontal en la pagina. Tablas y contenido ancho deben usar una
  presentacion alternativa o scroll contenido y accesible.
- En movil, apilar formularios y acciones cuando no exista espacio suficiente.
- Mantener controles tactiles con un area interactiva minima de 44 por 44 px.
- El texto, botones y campos no deben solaparse ni salir de su contenedor.
- Las acciones principales deben permanecer visibles y ser faciles de alcanzar
  en movil.
- Implementar cambios funcionales con TDD: crear primero una prueba que falle,
  implementar el comportamiento y ejecutar la suite completa.
