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
└── subreddits/                # Ingesta de Reddit, listado y detalle (en desarrollo)
```

Cada feature se organiza por capas: `module/`, `controller/`, `service/`, `entity/`, `dto/`, `test/`.

---

## Requisitos previos

- Node.js ≥ 20
- MySQL 8 corriendo en `localhost:3306`
- npm ≥ 9

---

## Instalación

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm install
   ```

2. Crear la base de datos en MySQL (solo el esquema vacío; las tablas las crea la app):
   ```sql
   CREATE DATABASE backendpedbox;
   ```

3. Copiar el archivo de variables de entorno y ajustarlo:
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

4. Levantar la aplicación:
   ```bash
   npm run start:dev
   ```
   La API queda disponible en `http://localhost:3000/api`.

> ⚠️ **Seguridad:** el archivo `.env` está en `.gitignore` y **no** debe subirse al repositorio. Solo se sube `.env.example`.

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
| POST | `/api/subreddits/sync` | Bearer | Sincronizar reddits.json | 🔜 |
| GET | `/api/subreddits` | Bearer | Listar subreddits paginados | 🔜 |
| GET | `/api/subreddits/:id` | Bearer | Detalle de un subreddit | 🔜 |

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

**Tabla `subreddits`** (🔜):
| Columna | Tipo | Notas |
|---|---|---|
| `id` | varchar | id de Reddit |
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
