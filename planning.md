
# Planificación — YouTube Playlist Copier

## 1) Objetivo
Crear una app web (Next.js) que permita copiar una playlist pública (o no listada) de YouTube a la cuenta del usuario autenticado, generando una nueva playlist propia con los mismos vídeos y orden.

## 2) Viabilidad (YouTube Data API v3)
Sí es posible: la API permite **listar** los items de una playlist y **crear** una nueva playlist con items. Endpoints clave:
- `playlistItems.list` — listar vídeos de una playlist (paginado, máximo 50 por página).
- `playlists.insert` — crear nueva playlist en la cuenta del usuario.
- `playlistItems.insert` — insertar cada vídeo en la nueva playlist.

Documentación:
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://developers.google.com/youtube/v3/docs/playlists/insert
- https://developers.google.com/youtube/v3/docs/playlistItems/insert

### Autorización (OAuth 2.0)
Para **crear playlists** y **añadir vídeos**, es obligatorio OAuth 2.0 con scopes adecuados:
- `https://www.googleapis.com/auth/youtube`
- `https://www.googleapis.com/auth/youtube.force-ssl`

> Nota: `youtubepartner` es solo para partners; no lo necesitamos.

## 3) Flujo del usuario
1. Inicia sesión con Google y concede permisos de YouTube.
2. Introduce URL(s) de playlist(s) origen.
3. Opcional: define título/privacidad para cada copia.
4. Ejecuta la copia y ve progreso/errores.
5. Recibe enlace(s) a la(s) nueva(s) playlist(s).

## 4) Flujo técnico (alto nivel)
1. **Parsear** `playlistId` desde la URL del usuario.
2. **Leer** items con `playlistItems.list` (paginación con `pageToken`, 50 por página).
3. **Crear** playlist destino con `playlists.insert` (título, descripción, privacidad).
4. **Insertar** cada vídeo con `playlistItems.insert` (mantener orden usando `snippet.position` o insertando secuencialmente).
5. **Manejo de errores** (vídeos privados, eliminados, region lock, límites de cuota).

## 5) Requisitos y configuración
### Google Cloud / YouTube API
- Proyecto en Google Cloud con **YouTube Data API v3** habilitada.
- Pantalla de consentimiento OAuth configurada (en modo **Testing** o **Production**).
- **OAuth Client ID** (tipo Web) con redirect URI(s) para Next.js.

### Variables de entorno (tentativas)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (si usamos NextAuth)
- `NEXTAUTH_SECRET` (si usamos NextAuth)

> Nota: Para leer playlists públicas se podría usar API Key, pero al final necesitamos OAuth para escribir en la cuenta del usuario. Mantendremos todo vía OAuth para simplificar.

### OAuth (detalles prácticos)
- Para obtener **refresh_token** en entornos de prueba, suele requerirse `access_type=offline` y `prompt=consent` (o equivalente en la librería de auth).
- En modo **Testing**, hay que añadir el email del usuario como **test user** en la pantalla de consentimiento.

## 6) Limitaciones y riesgos
- **Privadas**: no se pueden copiar playlists privadas de otros usuarios.
- **Vídeos no disponibles**: privados, eliminados o restringidos por región pueden fallar al insertarse.
- **Cuotas**: la API tiene límite diario y coste por operación (inserciones suelen tener coste alto). Hay que controlar el número de llamadas y ofrecer feedback cuando se alcance el límite.
- **Orden**: debe respetarse el orden original; insertar secuencialmente ayuda a mantenerlo.
- **Listas muy grandes**: paginación obligatoria; operaciones pueden tardar y requerir estado/progreso.

## 7) Seguridad y privacidad
- Tokens OAuth deben guardarse **server-side** (nunca exponer `client_secret`).
- Usar refresh tokens para sesiones largas.
- Minimizar datos guardados (solo lo necesario para completar la copia).

## 8) Plan de desarrollo (propuesto)
1. **Base Next.js + auth** (Google OAuth con scopes de YouTube).
2. **Parser de URLs** + validación de playlistId.
3. **Lectura** de items con paginación.
4. **Creación** de playlist destino + inserción secuencial.
5. **UI/UX**: formulario, progreso, logs y resultados.
6. **Manejo de errores** + mensajes claros.
7. **Pruebas** básicas con playlists pequeñas y medianas.

## 9) Necesito de ti (para continuar)
1. ¿Tienes ya un **Proyecto de Google Cloud** con YouTube Data API habilitada? Si no, lo creamos.
2. Necesitaré:
   - `GOOGLE_CLIENT_ID`
     - env.GOOGLE_CLIENT_ID
   - `GOOGLE_CLIENT_SECRET`
     - env.GOOGLE_CLIENT_SECRET
   - Lista de **redirect URIs** que quieres usar (ej: `http://localhost:3000/api/auth/callback/google`).
3. ¿La app será **solo para uso personal** (testing) o pública? Esto afecta la verificación de OAuth.
   - De momento, solo para uso personal.
4. ¿Quieres permitir copiar **múltiples playlists** en una sola ejecución?
   - No, por ahora solo una playlist por ejecución.
5. ¿Cómo quieres manejar el **título/privacidad** de la playlist copiada por defecto?
   - Por defecto, el título será el mismo que la playlist original y la privacidad será pública.

## 10) Decisiones confirmadas
- Uso **personal** (modo Testing).
- **Una** playlist por ejecución.
- **Título igual** al original y **privacidad pública** por defecto.

## 11) Pendientes / acciones previas
- Definir **redirect URIs** definitivos (local y producción, si aplica).
- Mover **credenciales** a un archivo `.env.local` y evitar versionarlas en git.

> ⚠️ Seguridad: no subir secretos al repositorio. Cuando empecemos la implementación, moveremos las credenciales a `.env.local` y eliminaremos sus valores del documento de planificación.

## 12) Próximo paso (si validas este plan)
Comenzar la implementación base con Next.js + autenticación Google (YouTube scopes), más el flujo de copia de playlist (list → create → insert).
