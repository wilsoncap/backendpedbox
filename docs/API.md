# API REST — Endpoints y consumo desde Postman

Base URL: `http://localhost:3000/api`

Todas las respuestas van envueltas en `{ "data": ... }`. Los errores usan la forma
`{ "statusCode", "message", "timestamp", "path" }`.

> ✅ Implementado · 🔜 Pendiente

---

## Resumen de endpoints

| Método | Ruta | Auth | Descripción | Estado |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | Crear cuenta | ✅ |
| POST | `/api/auth/login` | — | Iniciar sesión y obtener JWT | ✅ |
| POST | `/api/auth/logout` | Bearer | Cerrar sesión (revoca el token) | ✅ |
| POST | `/api/subreddits/sync` | Bearer | Sincronizar reddits.json → MySQL | ✅ |
| GET | `/api/subreddits` | Bearer | Listar subreddits (paginado/búsqueda) | ✅ |
| GET | `/api/subreddits/:id` | Bearer | Detalle de un subreddit | ✅ |
| POST | `/api/characters/sync` | Bearer | Sincronizar personajes (Rick & Morty) | ✅ |
| GET | `/api/characters` | Bearer | Listar personajes (paginado/filtros) | ✅ |
| GET | `/api/characters/:id` | Bearer | Detalle de un personaje | ✅ |

> **Autenticación:** desde la implementación del login, **todos** los endpoints requieren
> `Authorization: Bearer <token>` salvo los marcados con `—`. Los endpoints públicos
> (`register`, `login`, raíz `/api`) están anotados con `@Public()`.

---

## 1. Registrar usuario — ✅

**POST** `/api/auth/register`

**Body (JSON):**
```json
{
  "email": "wilson@example.com",
  "password": "secret123"
}
```

**Respuesta 201 Created:**
```json
{
  "data": {
    "id": "853a88eb-24e5-4e73-88d8-22e7a8768731",
    "email": "wilson@example.com",
    "createdAt": "2026-08-06T20:50:42.314Z",
    "updatedAt": "2026-08-06T20:50:42.314Z"
  }
}
```

**Errores:**
- `400` → email inválido o password menor a 6 caracteres
- `409` → email ya registrado

---

## 2. Iniciar sesión — ✅

**POST** `/api/auth/login` (público)

**Body (JSON):**
```json
{
  "email": "wilson@example.com",
  "password": "secret123"
}
```

**Respuesta 200 OK:**
```json
{
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "853a88eb-24e5-4e73-88d8-22e7a8768731",
      "email": "wilson@example.com",
      "createdAt": "2026-08-06T20:50:42.314Z",
      "updatedAt": "2026-08-06T20:50:42.314Z"
    }
  }
}
```

**Errores:** `401` → credenciales incorrectas (mismo mensaje para email inexistente o password incorrecto)

---

## 3. Cerrar sesión — ✅

**POST** `/api/auth/logout` — requiere `Authorization: Bearer <token>`

**Respuesta 200 OK:**
```json
{
  "data": {
    "message": "Sesión cerrada correctamente"
  }
}
```

El token usado queda **revocado** (en memoria) hasta su expiración: si se reutiliza responde `401 Unauthorized`.

**Errores:** `401` → sin token o token revocado

---

## 4. Sincronizar subreddits desde Reddit — ✅

**POST** `/api/subreddits/sync` — requiere `Authorization: Bearer <token>`

Consume `https://www.reddit.com/reddits.json` y hace un **upsert** (inserta nuevos y actualiza existentes). También se ejecuta automáticamente al arrancar la app si la tabla está vacía.

**Respuesta 200 OK:**
```json
{
  "data": {
    "inserted": 24,
    "updated": 1
  }
}
```

**Errores:**
- `401` → sin token
- `502` → Reddit respondió con error (ej. `Reddit respondió con el estado 403`)
- `503` → no se pudo conectar con Reddit

---

## 5. Listar subreddits — ✅

**GET** `/api/subreddits` — requiere `Authorization: Bearer <token>`

**Query params (opcionales):**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Página actual |
| `limit` | int 1–100 | 10 | Elementos por página |
| `search` | string | — | Busca por coincidencia en `name`/`title` |
| `sortBy` | enum | `subscribers` | `name` · `subscribers` · `createdUtc` |
| `order` | enum | `desc` | `asc` · `desc` |
| `over18` | bool | — | Filtra `true`/`false` |

**Ejemplo:** `GET /api/subreddits?page=2&limit=10&search=node&sortBy=subscribers&order=desc`

### Filtros y búsqueda (bonus)

| Filtro | Descripción | Ejemplo |
|---|---|---|
| `search` | Búsqueda parcial (LIKE) en `name` y `title` | `?search=node` → `node`, `nodejs`, ... |
| `sortBy` | Orden por `name`, `subscribers` o `createdUtc` | `?sortBy=subscribers` |
| `order` | Dirección: `asc` o `desc` | `?order=asc` |
| `over18` | Solo contenido restringido o no: `true`/`false` | `?over18=true` |

Todos se combinan con la paginación (`page`, `limit`). Ejemplos:

- Buscar y paginar: `GET /api/subreddits?search=java&page=1&limit=10`
- Los más grandes primero: `GET /api/subreddits?sortBy=subscribers&order=desc&limit=10`
- Los más recientes: `GET /api/subreddits?sortBy=createdUtc&order=desc&limit=10`
- Filtrar contenido restringido: `GET /api/subreddits?over18=true`

> `sortBy` acepta **solo** los valores `name`, `subscribers`, `createdUtc` (whitelist). Un valor distinto responde `400 Bad Request`.

**Respuesta 200 OK:**
```json
{
  "data": [
    {
      "id": "2qh1i",
      "name": "AskReddit",
      "title": "AskReddit",
      "publicDescription": "...",
      "subscribers": 44200000,
      "url": "/r/AskReddit/",
      "over18": false,
      "createdUtc": 1201233135,
      "fetchedAt": "2026-08-06T20:50:42.314Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 2,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

## 6. Detalle de un subreddit — ✅

**GET** `/api/subreddits/:id` — requiere `Authorization: Bearer <token>`

**Ejemplo:** `GET /api/subreddits/2qh1i`

**Respuesta 200 OK:**
```json
{
  "data": {
    "id": "2qh1i",
    "name": "AskReddit",
    "title": "AskReddit",
    "publicDescription": "...",
    "description": "...",
    "subscribers": 44200000,
    "url": "/r/AskReddit/",
    "over18": false,
    "createdUtc": 1201233135,
    "iconImg": "...",
    "bannerImg": "...",
    "fetchedAt": "2026-08-06T20:50:42.314Z"
  }
}
```

**Errores:** `404` → no existe

---

## 7. Personajes (Rick & Morty) — ✅

Segundo feature de ingesta, espejo de `subreddits` pero consumiendo `https://rickandmortyapi.com/api/character`.

### 7.1 Sincronizar personajes

**POST** `/api/characters/sync` — requiere `Authorization: Bearer <token>`

Cada llamado inserta **10 personajes nuevos y avanza** (guarda el progreso por el último `id`): la primera llamada inserta los ids 1–10, la segunda los 11–20, y así **hasta agotar los 826 personajes de la API**. Cuando ya no quedan más responde `{ inserted: 0, updated: 0 }`. Hace **upsert**. Tamaño configurable con `RICKMORTY_BATCH_SIZE` (por defecto 10).

**Respuesta 200 OK:**
```json
{
  "data": { "inserted": 10, "updated": 0 }
}
```

**Errores:** `401` sin token · `502` la API respondió con error · `503` no se pudo conectar

### 7.2 Listar personajes

**GET** `/api/characters` — requiere `Authorization: Bearer <token>`

**Query params (opcionales):**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Página actual |
| `limit` | int 1–100 | 10 | Elementos por página |
| `search` | string | — | Busca por coincidencia en `name` |
| `status` | string | — | `Alive` · `Dead` · `unknown` |
| `species` | string | — | `Human` · `Alien` · ... |
| `gender` | string | — | `Male` · `Female` · `unknown` |
| `sortBy` | enum | `id` | `name` · `id` · `created` |
| `order` | enum | `desc` | `asc` · `desc` |

**Ejemplo:** `GET /api/characters?search=rick&status=Alive&page=1&limit=10`

**Respuesta 200 OK:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Rick Sanchez",
      "status": "Alive",
      "species": "Human",
      "type": "",
      "gender": "Male",
      "originName": "Earth (C-137)",
      "locationName": "Citadel of Ricks",
      "image": ".../avatar/1.jpeg",
      "url": ".../character/1",
      "created": "2017-11-04T18:48:46.000Z",
      "fetchedAt": "2026-08-08T04:28:58.000Z"
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### 7.3 Detalle de un personaje

**GET** `/api/characters/:id` — requiere `Authorization: Bearer <token>`

**Ejemplo:** `GET /api/characters/1`

**Respuesta 200 OK:** el objeto del personaje completo (como en la lista).

**Errores:** `404` → no existe (o id no numérico)

---

## Guía rápida para Postman

### 1. Crear una Colección y un Entorno
1. **Collections** → `New Collection` → nombre: `backendpedbox`.
2. **Environments** → `New Environment` → nombre: `local`, con variables:
   - `baseUrl` = `http://localhost:3000/api`
   - `token` = *(vacío, se llena automáticamente)*

### 2. Crear el request de Register
1. En la colección: `New request` → método **POST**, URL: `{{baseUrl}}/auth/register`.
2. Pestaña **Body** → `raw` → `JSON`, y pega:
   ```json
   { "email": "wilson@example.com", "password": "secret123" }
   ```
3. **Send**. Debe responder `201`.

### 3. Crear el request de Login (y guardar el token automáticamente)
1. Nuevo request: **POST** `{{baseUrl}}/auth/login` con el mismo body.
2. En la pestaña **Tests** pega:
   ```js
   const res = pm.response.json();
   if (res.data && res.data.accessToken) {
     pm.environment.set('token', res.data.accessToken);
   }
   ```
3. **Send**. El token queda guardado en la variable `token`.

### 4. Crear un request autenticado (ej. listar subreddits)
1. Nuevo request: **GET** `{{baseUrl}}/subreddits`.
2. Pestaña **Authorization** → `Type: Bearer Token` → `Token: {{token}}`.
3. **Send**. Debe responder `200` con la lista paginada.

### 5. Cerrar sesión (opcional)
1. Nuevo request: **POST** `{{baseUrl}}/auth/logout`.
2. Pestaña **Authorization** → `Type: Bearer Token` → `Token: {{token}}`.
3. **Send**. Responde `200` y el token queda revocado; reutilizarlo dará `401`.

### Consejo
Ejecuta siempre **primero el Login** (Register → Login) para que `{{token}}` esté poblado antes de llamar a los endpoints protegidos.
