import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { parseVideoId } from "@/lib/playlist";
import type { CloneResponse } from "@/lib/types";
import {
  createPlaylist,
  findUserPlaylistByTitle,
  insertPlaylistItem,
  listPlaylistItems,
} from "@/lib/youtube";

type ImportItem = {
  Title?: string;
  "Video url"?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("resource has been exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  );
};

const withQuotaBackoff = async <T>(
  action: () => Promise<T>,
  label: string,
  maxAttempts = 4
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await action();
    } catch (error) {
      attempt += 1;
      if (!shouldRetry(error) || attempt >= maxAttempts) {
        throw error;
      }
      const waitMs = 2000 * attempt * attempt;
      console.log(`[import] backoff ${label} intento ${attempt} espera ${waitMs}ms`);
      await sleep(waitMs);
    }
  }
};

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  console.log("[import] inicio");

  if (!session?.accessToken) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const accessToken = session.accessToken;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "No se pudo leer el formulario." },
      { status: 400 }
    );
  }

  const playlistNameRaw = formData.get("playlistName");
  const playlistName =
    typeof playlistNameRaw === "string" ? playlistNameRaw.trim() : "";
  const file = formData.get("file");

  if (!playlistName) {
    return NextResponse.json(
      { error: "Introduce un nombre para la playlist." },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Selecciona un archivo JSON válido." },
      { status: 400 }
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(await file.text());
  } catch {
    return NextResponse.json(
      { error: "El archivo JSON no es válido." },
      { status: 400 }
    );
  }

  if (!Array.isArray(parsedJson)) {
    return NextResponse.json(
      { error: "El JSON debe contener una lista de vídeos." },
      { status: 400 }
    );
  }

  const errors: CloneResponse["errors"] = [];
  const items: Array<{ videoId: string; title?: string }> = [];
  const seenIds = new Set<string>();
  console.log("[import] items en JSON", parsedJson.length);

  for (const entry of parsedJson as ImportItem[]) {
    const rawUrl = typeof entry?.["Video url"] === "string" ? entry["Video url"] : "";
    const videoId = rawUrl ? parseVideoId(rawUrl) : null;

    if (!videoId) {
      errors.push({
        videoId: rawUrl || "desconocido",
        title: entry?.Title,
        error: "URL de vídeo inválida o ausente.",
      });
      continue;
    }

    if (seenIds.has(videoId)) {
      continue;
    }

    seenIds.add(videoId);
    items.push({ videoId, title: entry?.Title });
  }
  console.log("[import] videos validos", items.length);
  if (errors.length > 0) {
    console.log("[import] videos descartados", errors.length);
  }

  try {
    console.log("[import] buscando playlist", playlistName);
    const existingPlaylist = await findUserPlaylistByTitle(
      accessToken,
      playlistName
    );
    console.log(
      "[import] playlist destino",
      existingPlaylist ? existingPlaylist.id : "nueva"
    );

    const destinationId = existingPlaylist
      ? existingPlaylist.id
      : await withQuotaBackoff(
          () =>
            createPlaylist(accessToken, {
              title: playlistName,
              description: "",
              privacyStatus: "public",
            }),
          "createPlaylist"
        );

    let existingVideoIds = new Set<string>();
    if (existingPlaylist && items.length > 0) {
      const sourceVideoIds = new Set(items.map((item) => item.videoId));
      console.log("[import] listando items destino para dedupe");
      const destinationItems = await listPlaylistItems(
        destinationId,
        accessToken,
        { stopWhenVideoIds: sourceVideoIds }
      );
      existingVideoIds = new Set(
        destinationItems.map((item) => item.videoId)
      );
      console.log("[import] ya existentes", existingVideoIds.size);
    }

    let insertedCount = 0;
    for (const item of items) {
      if (existingVideoIds.has(item.videoId)) {
        continue;
      }

      try {
        await withQuotaBackoff(
          () =>
            insertPlaylistItem(accessToken, {
              playlistId: destinationId,
              videoId: item.videoId,
            }),
          "insertPlaylistItem"
        );
        insertedCount += 1;
        existingVideoIds.add(item.videoId);
        if (insertedCount % 25 === 0) {
          console.log("[import] insertados", insertedCount);
        }
        await sleep(350);
      } catch (error) {
        console.log(
          "[import] error insertando",
          item.videoId,
          error instanceof Error ? error.message : error
        );
        errors.push({
          videoId: item.videoId,
          title: item.title,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }
    console.log("[import] insertados total", insertedCount);

    const response: CloneResponse = {
      playlistId: destinationId,
      destinationUrl: `https://www.youtube.com/playlist?list=${destinationId}`,
      insertedCount,
      totalCount: items.length,
      errors,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log(
      "[import] error general",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 }
    );
  }
}
