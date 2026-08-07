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
| POST | `/api/subreddits/sync` | Bearer | Sincronizar reddits.json → MySQL | 🔜 |
| GET | `/api/subreddits` | Bearer | Listar subreddits (paginado/búsqueda) | 🔜 |
| GET | `/api/subreddits/:id` | Bearer | Detalle de un subreddit | 🔜 |

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

## 2. Sincronizar subreddits desde Reddit — 🔜

**POST** `/api/subreddits/sync` — requiere `Authorization: Bearer <token>`

**Respuesta 200 OK:**
```json
{
  "data": {
    "inserted": 24,
    "updated": 1
  }
}
```

---

## 3. Listar subreddits — 🔜

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

## 4. Detalle de un subreddit — 🔜

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

### 3. Crear un request autenticado (ej. listar subreddits)
1. Nuevo request: **GET** `{{baseUrl}}/subreddits`.
2. Pestaña **Authorization** → `Type: Bearer Token` → `Token: {{token}}`.
3. **Send**. Debe responder `200` con la lista paginada.

> La variable `{{token}}` se completará cuando la autenticación JWT esté disponible.
