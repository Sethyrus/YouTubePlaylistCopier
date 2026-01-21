import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { parsePlaylistId } from "@/lib/playlist";
import type { CloneRequestBody, CloneResponse } from "@/lib/types";
import {
  createPlaylist,
  findUserPlaylistByTitle,
  getPlaylistDetails,
  insertPlaylistItem,
  listPlaylistItems,
} from "@/lib/youtube";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CloneRequestBody;
  const playlistId = body.playlistUrl ? parsePlaylistId(body.playlistUrl) : null;

  if (!playlistId) {
    return NextResponse.json(
      { error: "La URL de la playlist no es válida." },
      { status: 400 }
    );
  }

  try {
    const sourceDetails = await getPlaylistDetails(playlistId, session.accessToken);
    const items = await listPlaylistItems(playlistId, session.accessToken);

    const existingPlaylist = await findUserPlaylistByTitle(
      session.accessToken,
      sourceDetails.title
    );

    const destinationId = existingPlaylist
      ? existingPlaylist.id
      : await createPlaylist(session.accessToken, {
          title: sourceDetails.title,
          description: sourceDetails.description,
          privacyStatus: "public",
        });

    const destinationItems = await listPlaylistItems(
      destinationId,
      session.accessToken
    );
    const existingVideoIds = new Set(
      destinationItems.map((item) => item.videoId)
    );

    const sortedItems = [...items].sort((a, b) => a.position - b.position);
    const errors: CloneResponse["errors"] = [];
    let insertedCount = 0;

    for (const item of sortedItems) {
      if (existingVideoIds.has(item.videoId)) {
        continue;
      }

      try {
        await insertPlaylistItem(session.accessToken, {
          playlistId: destinationId,
          videoId: item.videoId,
        });
        insertedCount += 1;
        existingVideoIds.add(item.videoId);
      } catch (error) {
        errors.push({
          videoId: item.videoId,
          title: item.title,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    const response: CloneResponse = {
      playlistId: destinationId,
      destinationUrl: `https://www.youtube.com/playlist?list=${destinationId}`,
      insertedCount,
      totalCount: items.length,
      errors,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 }
    );
  }
}
