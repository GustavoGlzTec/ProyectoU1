# TaskFlow - To-Do List Responsive

Aplicación web de gestión de tareas pensada para escritorio y móvil.

## Qué incluye

- Registro e inicio de sesión (simulado con `localStorage`, listo para reemplazar por Supabase).
- CRUD completo de tareas: crear, editar, eliminar y marcar como completadas.
- Filtros por estado y búsqueda por texto.
- Panel de estadísticas con pendientes/completadas.
- Tema claro/oscuro.
- UI responsive con diseño de tarjetas.

## Ejecutar localmente

Como es una app estática, basta con servir los archivos:

```bash
python3 -m http.server 4173
```

Luego abre: `http://localhost:4173`

## Integración futura con Supabase

La lógica está organizada para que puedas sustituir:

- autenticación local (`handleAuthSubmit`, `restoreSession`),
- y persistencia de tareas (`getTasksForUser`, `saveTasksForUser`)

por llamadas a Supabase Auth + Realtime Database.
