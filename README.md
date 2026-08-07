# backendpedbox

API REST construida con **NestJS** + **TypeORM** + **MySQL** para la prueba técnica de **PedBox**.

Consume el JSON de Reddit (`https://www.reddit.com/reddits.json`), lo almacena normalizado en MySQL y lo expone a través de una API REST con **autenticación JWT**.

> Documentación: [Historias de usuario](docs/USER_STORIES.md) · [Endpoints y Postman](docs/API.md)

---

## Stack

- **Framework:** NestJS 11 (Node.js / TypeScript)
- **Base de datos:** MySQL 8
- **ORM:** TypeORM (`synchronize` en desarrollo)
- **Autenticación:** JWT (Passport) + bcrypt
- **Validación:** class-validator / class-transformer

---

## Estructura del proyecto

```
src/
├── main.ts                    # Punto de entrada (helmet, CORS, pipes, interceptors)
├── app.module.ts              # Módulo raíz
├── config/validation/         # Validación de variables de entorno
├── database/config/           # Configuración de TypeORM + MySQL
├── common/                    # Transversales: @Public, interceptor, filtro de errores
├── auth/                      # Registro, login y logout (JWT, entity User)
└── subreddits/                # Ingesta de Reddit, listado paginado y detalle
```

Cada feature se organiza por capas: `module/`, `controller/`, `service/`, `entity/`, `dto/`, `test/`.

---

## Requisitos previos

- Node.js ≥ 20
- MySQL 8 corriendo en `localhost:3306`
- npm ≥ 9

---

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/wilsoncap/backendpedbox.git
   cd backendpedbox
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear la base de datos en MySQL (solo el esquema vacío; las tablas las crea la app):
   ```sql
   CREATE DATABASE backendpedbox;
   ```

4. Copiar el archivo de variables de entorno y ajustarlo:
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales:
   ```env
   NODE_ENV=development
   PORT=3000

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=backendpedbox

   JWT_SECRET=cambia_este_secret_por_uno_seguro
   JWT_EXPIRES_IN=1d

   REDDIT_JSON_URL=https://www.reddit.com/reddits.json
   REDDIT_USER_AGENT=backendpedbox/1.0 (por /u/wilsoncap)
   ```
   > Si usas una base de datos en la nube, cambia `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` por los de tu proveedor.

5. Levantar la aplicación:
   ```bash
   npm run start:dev
   ```
   La API queda disponible en `http://localhost:3000/api`.

> ⚠️ **Seguridad:** el archivo `.env` está en `.gitignore` y **no** debe subirse al repositorio. Solo se sube `.env.example`.

---

## Verificación rápida

Con la app corriendo, crea un usuario y obtén un token:

```bash
# 1. Registrar un usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tucorreo@example.com","password":"secret123"}'

# 2. Iniciar sesión (devuelve el accessToken)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tucorreo@example.com","password":"secret123"}'

# 3. Sincronizar subreddits desde Reddit (usa el token del paso 2)
curl -X POST http://localhost:3000/api/subreddits/sync \
  -H "Authorization: Bearer <accessToken>"

# 4. Listar subreddits (paginado, 10 por página)
curl http://localhost:3000/api/subreddits?page=1&limit=10 \
  -H "Authorization: Bearer <accessToken>"
```

> El primer `sync` también ocurre automáticamente al arrancar la app si la tabla `subreddits` está vacía.

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Desarrollo con recarga automática |
| `npm run start` | Ejecutar compilado |
| `npm run build` | Compilar TypeScript → `dist/` |
| `npm run lint` | ESLint (con `--fix`) |
| `npm run test` | Pruebas unitarias (Jest) |
| `npm run test:e2e` | Pruebas end-to-end |

---

## Endpoints

| Método | Ruta | Auth | Descripción | Estado |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | Crear cuenta | ✅ |
| POST | `/api/auth/login` | — | Iniciar sesión y obtener JWT | ✅ |
| POST | `/api/auth/logout` | Bearer | Cerrar sesión (revoca el token) | ✅ |
| POST | `/api/subreddits/sync` | Bearer | Sincronizar reddits.json | ✅ |
| GET | `/api/subreddits` | Bearer | Listar subreddits paginados | ✅ |
| GET | `/api/subreddits/:id` | Bearer | Detalle de un subreddit | ✅ |

Guía completa de consumo (ejemplos JSON y Postman): [docs/API.md](docs/API.md)

---

## Base de datos

El esquema se crea automáticamente en desarrollo gracias a `synchronize: true`.

**Tabla `users`** (✅):
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | Clave primaria |
| `email` | varchar | Único |
| `password` | varchar | Hash bcrypt |
| `createdAt` / `updatedAt` | datetime | Timestamps |

**Tabla `subreddits`** (✅):
| Columna | Tipo | Notas |
|---|---|---|
| `id` | varchar | Clave primaria (id de Reddit) |
| `name` | varchar | Único (`display_name`) |
| `title` | varchar | — |
| `publicDescription` / `description` | text | — |
| `subscribers` | int | — |
| `url` | varchar | — |
| `over18` | boolean | — |
| `createdUtc` | bigint | — |
| `iconImg` / `bannerImg` | text | — |
| `fetchedAt` | datetime | Última sincronización |

---

## Pruebas

```bash
npm run test        # unitarias
npm run test:e2e    # e2e (requiere MySQL arriba)
```

---

## Notas

- Las credenciales de la BD y el secreto JWT se leen exclusivamente de variables de entorno (`.env`).
- Los endpoints protegidos requieren `Authorization: Bearer <token>` (guard JWT global; los públicos usan `@Public()`).
- El logout revoca el token en memoria (blacklist) hasta su expiración; se pierde al reiniciar el servidor.
- Las contraseñas nunca se devuelven en las respuestas ni se guardan en texto plano.
