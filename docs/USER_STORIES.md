# Historias de Usuario y Criterios de Aceptación

> Formato: Como [rol], quiero [acción], para [beneficio].
> Criterios de aceptación verificables. Estado: ✅ implementado · 🔜 pendiente.

---

## HU-01 · Registrar usuario — ✅ Implementado

**Como** visitante, **quiero** registrarme con mi email y contraseña, **para** tener una cuenta y acceder a la aplicación.

**Criterios de aceptación:**
- [ ] `POST /api/auth/register` con `email` válido y `password` de al menos 6 caracteres responde `201 Created`.
- [ ] La respuesta envuelve al usuario en `{ "data": { "id", "email", "createdAt", "updatedAt" } }` y **nunca** incluye el `password`.
- [ ] Si el email ya está registrado responde `409 Conflict` con el mensaje `El email ya está registrado`.
- [ ] Si el email no es válido responde `400 Bad Request`.
- [ ] Si el password tiene menos de 6 caracteres responde `400 Bad Request`.
- [ ] El password se guarda en la BD hasheado con bcrypt (nunca en texto plano).
- [ ] El endpoint es público (no requiere token).

---

## HU-02 · Iniciar sesión (JWT) — ✅ Implementado

**Como** usuario registrado, **quiero** iniciar sesión con mis credenciales, **para** obtener un token JWT y consumir los endpoints protegidos.

**Criterios de aceptación:**
- [x] `POST /api/auth/login` con credenciales correctas responde `200 OK`.
- [x] La respuesta incluye `{ "data": { "accessToken", "user" } }` y el `user` nunca incluye el `password`.
- [x] Con email o password incorrectos responde `401 Unauthorized` (mensaje genérico, sin revelar cuál falló).
- [x] El token expira según `JWT_EXPIRES_IN` configurado en el `.env`.
- [x] El token enviado como `Authorization: Bearer <token>` permite acceder a los endpoints protegidos.
- [x] Los endpoints sin token responde `401 Unauthorized` (guard global JWT).
- [x] El endpoint es público (no requiere token).

---

## HU-03 · Cerrar sesión (logout) — ✅ Implementado

**Como** usuario autenticado, **quiero** cerrar sesión, **para** invalidar mi token actual y dejar de acceder a los endpoints protegidos.

**Criterios de aceptación:**
- [x] `POST /api/auth/logout` requiere token; sin token responde `401 Unauthorized`.
- [x] Con token válido responde `200 OK` con `{ "data": { "message" } }`.
- [x] El token usado queda **revocado**: reutilizarlo responde `401 Unauthorized`.
- [x] La revocación dura hasta que el token expire (blacklist en memoria).

---

## HU-04 · Sincronizar datos de Reddit — 🔜 Pendiente

**Como** usuario autenticado, **quiero** ejecutar la sincronización del JSON de Reddit, **para** poblar y mantener actualizados los subreddits en la base de datos.

**Criterios de aceptación:**
- [ ] `POST /api/subreddits/sync` requiere token JWT; sin token responde `401 Unauthorized`.
- [ ] Consume `https://www.reddit.com/reddits.json` con un `User-Agent` configurado.
- [ ] Los datos se guardan de forma **normalizada** en la tabla `subreddits`.
- [ ] Es un **upsert**: actualiza los registros existentes y crea los nuevos (no hay duplicados por `id`/`name`).
- [ ] La respuesta indica cuántos registros se insertaron y cuántos se actualizaron.
- [ ] Si Reddit no responde, se devuelve un error claro (502/503) sin romper la app.

---

## HU-05 · Listar subreddits paginados — 🔜 Pendiente

**Como** usuario autenticado, **quiero** ver la lista de subreddits paginada, **para** navegar entre los temas.

**Criterios de aceptación:**
- [ ] `GET /api/subreddits?page=1&limit=10` responde `200 OK`.
- [ ] La respuesta tiene la forma `{ "data": [...], "meta": { "total", "page", "limit", "totalPages" } }`.
- [ ] `page` debe ser ≥ 1 y `limit` entre 1 y 100; valores inválidos → `400 Bad Request`.
- [ ] Sin token responde `401 Unauthorized`.

---

## HU-06 · Consultar detalle de un subreddit — 🔜 Pendiente

**Como** usuario autenticado, **quiero** consultar el detalle de un subreddit, **para** ver su información completa.

**Criterios de aceptación:**
- [ ] `GET /api/subreddits/:id` responde `200 OK` con `{ "data": { ... } }`.
- [ ] Si el subreddit no existe responde `404 Not Found`.

---

## HU-07 · Buscar y filtrar subreddits (bonus) — 🔜 Pendiente

**Como** usuario autenticado, **quiero** buscar y filtrar los subreddits, **para** encontrar los temas que me interesan más rápido.

**Criterios de aceptación:**
- [ ] `GET /api/subreddits?search=node` busca por coincidencia parcial en `name`/`title`.
- [ ] `sortBy` acepta únicamente `name | subscribers | createdUtc` (whitelist para evitar inyección SQL).
- [ ] `order` acepta únicamente `asc | desc`.
- [ ] `over18` acepta `true | false` para filtrar contenido restringido.
- [ ] Se combina con la paginación (HU-05).
