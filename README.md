# Ragnarok Content Tracker

Checklist de instancias para Ragnarok Online construido con Next.js.

## Stack

- Next.js 16 (App Router)
- React 19
- PostgreSQL
- OAuth con Discord

## Requisitos

- Node.js 20+
- pnpm
- PostgreSQL 16+ (o Docker para levantarlo)

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```bash
APP_URL=http://localhost:3000
DATABASE_URL=postgres://rct:rct_dev_password@localhost:5432/rct
DATABASE_SSL=false
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

## Inicio rápido (desarrollo)

1. Instalar dependencias:

```bash
pnpm install
```

2. Levantar base de datos (Docker):

```bash
docker compose up -d
```

3. Inicializar esquema:

```bash
pnpm run init:app
```

4. Ejecutar app:

```bash
pnpm run dev
```

App: `http://localhost:3000`

## Build de producción

```bash
pnpm run build
pnpm start
```

## Persistencia del tracker

- Usuario no logeado: guarda/lee estado desde `localStorage`.
- Usuario logeado con Discord: ignora `localStorage` y guarda/lee estado desde PostgreSQL (`user_tracker_states`).
- Al cerrar sesión: vuelve a usar el estado local del navegador.

## Scripts

- `pnpm run dev`: desarrollo
- `pnpm run build`: build
- `pnpm start`: ejecutar build
- `pnpm run init:app`: crear/actualizar esquema SQL en la base
