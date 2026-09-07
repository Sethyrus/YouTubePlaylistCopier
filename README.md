# YouTube Playlist Copier

Aplicación web (Next.js 16 + App Router) para copiar una playlist de YouTube a tu propia cuenta, o para importar una playlist a partir de un export JSON (por ejemplo, un Google Takeout), sin perder el orden original de los vídeos.

## ¿Qué hace?

Tras iniciar sesión con Google, la app ofrece dos formas de crear una playlist en tu cuenta:

1. **Copiar playlist** — pegas la URL (o el ID) de una playlist pública/no listada de YouTube y la app la lee con la YouTube Data API v3 y recrea una playlist nueva en tu canal con el mismo título, descripción y orden de vídeos.
2. **Importar desde JSON** — subes un archivo JSON (con el formato de un export tipo Google Takeout: objetos con `Title` y `Video url`) y un nombre de playlist, y la app crea (o reutiliza) esa playlist e inserta los vídeos encontrados en el archivo.

Ambos flujos son **idempotentes**: si ya existe una playlist con el mismo título en tu cuenta, se reutiliza y solo se insertan los vídeos que todavía no estén en ella, en lugar de duplicar contenido en reintentos.

Los errores por vídeo (privados, eliminados, bloqueados por región, etc.) no interrumpen el proceso: se recopilan y se muestran al final junto al resultado.

## Cómo funciona (flujo técnico)

1. El usuario se autentica con Google (`next-auth`, provider de Google) concediendo permisos de lectura/escritura sobre YouTube.
2. **Copiar playlist** (`POST /api/clone`):
   - Se extrae el `playlistId` de la URL (`lib/playlist.ts`).
   - Se obtienen los datos y los vídeos de la playlist origen (`lib/youtube.ts`, paginado de 50 en 50).
   - Se busca si ya existe una playlist con el mismo título en la cuenta del usuario; si no existe, se crea (pública, mismo título/descripción que la original).
   - Si la playlist destino ya existía, se listan sus vídeos actuales (deteniendo la paginación en cuanto se han localizado todos los vídeos de origen, para ahorrar cuota) y se calculan los que faltan por insertar.
   - Se insertan secuencialmente los vídeos que faltan, respetando el orden original (`snippet.position`).
3. **Importar desde JSON** (`POST /api/import`):
   - Se sube un `multipart/form-data` con el nombre de la playlist destino y el archivo JSON.
   - Se extrae el ID de vídeo de cada `"Video url"` (`lib/playlist.ts`) y se deduplican dentro del propio archivo.
   - Se crea o reutiliza la playlist destino y se insertan los vídeos que falten.
   - Incluye backoff exponencial ante errores de cuota/rate limit y una pequeña pausa entre inserciones para no saturar la API.
4. El resultado (vídeos insertados/total, enlace a la playlist final y listado de errores) se muestra en pantalla.

## Stack técnico

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [NextAuth.js v4](https://next-auth.js.org) con provider de Google (OAuth 2.0, `access_type=offline` + `prompt=consent` para obtener refresh token; refresco automático del access token)
- Cliente propio de la **YouTube Data API v3** basado en `fetch` (`lib/youtube.ts`) — no se usa el SDK oficial `googleapis`
- Tailwind CSS v4 para el estilado
- Sin base de datos: la app es *stateless* en el servidor; la única persistencia es el JWT de sesión, y los datos de playlists se consultan siempre en vivo contra YouTube

## Estructura del proyecto

```text
app/
  api/
    auth/[...nextauth]/route.ts   # Handler de NextAuth
    clone/route.ts                # POST — copia una playlist existente
    import/route.ts               # POST — importa desde un JSON subido
  components/
    HomeClient.tsx                # UI principal: estado de sesión y ambos formularios
    CloneResult.tsx                # Renderiza el resultado (éxitos/errores)
    Providers.tsx                  # SessionProvider de NextAuth
  page.tsx, layout.tsx, globals.css
lib/
  auth.ts        # Configuración de NextAuth (scopes, refresco de tokens)
  youtube.ts     # Cliente de la YouTube Data API v3 (listar, crear, insertar)
  playlist.ts    # Parseo de URLs/IDs de playlists y vídeos
  types.ts       # Tipos compartidos (CloneRequestBody, CloneResponse, CloneError)
types/
  next-auth.d.ts # Augmentación de tipos de sesión/JWT (accessToken, error)
planning.md      # Documento de diseño y decisiones del proyecto
```

## Configuración y puesta en marcha

### 1. Requisitos previos en Google Cloud

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/) y habilita la **YouTube Data API v3**.
2. Configura la pantalla de consentimiento OAuth (modo *Testing* es suficiente para uso personal; añade tu cuenta como *test user*).
3. Crea unas credenciales **OAuth Client ID** de tipo *Web application* con el redirect URI:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - el equivalente en producción si despliegas la app

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```bash
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=una_cadena_aleatoria_segura
```

### 3. Instalación y ejecución

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), pulsa "Conectar con Google" y prueba a copiar o importar una playlist.

Otros scripts disponibles: `npm run build`, `npm run start`, `npm run lint`.

## Limitaciones conocidas

- Solo se pueden copiar playlists públicas o no listadas (no playlists privadas de terceros).
- Los vídeos privados, eliminados o bloqueados por región pueden fallar al insertarse; el error se muestra pero no detiene el proceso.
- La YouTube Data API v3 tiene una cuota diaria y un coste por operación (las inserciones son las más costosas); en playlists muy grandes esto puede provocar errores de cuota, para lo cual `/api/import` implementa reintentos con backoff.
- Mientras la app esté en modo *Testing* en Google Cloud, solo podrán usarla las cuentas añadidas explícitamente como *test users*.
- Solo se procesa una playlist por ejecución.
