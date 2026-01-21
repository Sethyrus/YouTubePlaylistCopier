const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

type YoutubeErrorResponse = {
  error?: {
    message?: string;
  };
};

type PlaylistItemsResponse = {
  items?: Array<{
    snippet?: {
      position?: number;
      title?: string;
      resourceId?: {
        videoId?: string;
      };
    };
  }>;
  nextPageToken?: string;
};

type UserPlaylistsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
    };
  }>;
  nextPageToken?: string;
};

type PlaylistDetailsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
    };
  }>;
};

type CreatePlaylistResponse = {
  id?: string;
};

type PlaylistItemInsertResponse = {
  id?: string;
};

export type PlaylistVideo = {
  videoId: string;
  position: number;
  title?: string;
};

export type PlaylistDetails = {
  id: string;
  title: string;
  description: string;
};

export type UserPlaylist = {
  id: string;
  title: string;
  description: string;
};

type YoutubeRequestOptions = {
  accessToken: string;
  path: string;
  params?: Record<string, string | number | undefined>;
  init?: RequestInit;
};

const youtubeRequest = async <T>({
  accessToken,
  path,
  params,
  init,
}: YoutubeRequestOptions): Promise<T> => {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as YoutubeErrorResponse;
    const message =
      errorBody.error?.message ?? `YouTube API error (${response.status})`;
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const getPlaylistDetails = async (
  playlistId: string,
  accessToken: string
): Promise<PlaylistDetails> => {
  const data = await youtubeRequest<PlaylistDetailsResponse>({
    accessToken,
    path: "playlists",
    params: {
      part: "snippet",
      id: playlistId,
    },
  });

  const playlist = data.items?.[0];
  if (!playlist?.id) {
    throw new Error("Playlist no encontrada o sin acceso.");
  }

  return {
    id: playlist.id,
    title: playlist.snippet?.title ?? "Playlist sin título",
    description: playlist.snippet?.description ?? "",
  };
};

export const listPlaylistItems = async (
  playlistId: string,
  accessToken: string,
  options?: {
    stopWhenVideoIds?: Set<string>;
  }
): Promise<PlaylistVideo[]> => {
  const items: PlaylistVideo[] = [];
  let pageToken: string | undefined;
  const remainingIds = options?.stopWhenVideoIds
    ? new Set(options.stopWhenVideoIds)
    : null;

  do {
    const data = await youtubeRequest<PlaylistItemsResponse>({
      accessToken,
      path: "playlistItems",
      params: {
        part: "snippet",
        maxResults: 50,
        playlistId,
        pageToken,
      },
    });

    const pageItems =
      data.items
        ?.map((item) => ({
          videoId: item.snippet?.resourceId?.videoId ?? "",
          position: item.snippet?.position ?? 0,
          title: item.snippet?.title,
        }))
        .filter((item) => item.videoId) ?? [];

    items.push(...pageItems);
    pageToken = data.nextPageToken;

    if (remainingIds) {
      for (const item of pageItems) {
        remainingIds.delete(item.videoId);
      }

      if (remainingIds.size === 0) {
        break;
      }
    }
  } while (pageToken);

  return items;
};

export const listUserPlaylists = async (
  accessToken: string
): Promise<UserPlaylist[]> => {
  const playlists: UserPlaylist[] = [];
  let pageToken: string | undefined;

  do {
    const data = await youtubeRequest<UserPlaylistsResponse>({
      accessToken,
      path: "playlists",
      params: {
        part: "snippet",
        mine: "true",
        maxResults: 50,
        pageToken,
      },
    });

    const pageItems =
      data.items
        ?.map((item) => ({
          id: item.id ?? "",
          title: item.snippet?.title ?? "",
          description: item.snippet?.description ?? "",
        }))
        .filter((item) => item.id) ?? [];

    playlists.push(...pageItems);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return playlists;
};

export const findUserPlaylistByTitle = async (
  accessToken: string,
  title: string
): Promise<UserPlaylist | null> => {
  const normalizedTitle = title.trim().toLowerCase();
  let pageToken: string | undefined;

  do {
    const data = await youtubeRequest<UserPlaylistsResponse>({
      accessToken,
      path: "playlists",
      params: {
        part: "snippet",
        mine: "true",
        maxResults: 50,
        pageToken,
      },
    });

    const match = data.items?.find((item) => {
      const itemTitle = item.snippet?.title ?? "";
      return itemTitle.trim().toLowerCase() === normalizedTitle;
    });

    if (match?.id) {
      return {
        id: match.id,
        title: match.snippet?.title ?? "",
        description: match.snippet?.description ?? "",
      };
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return null;
};

export const createPlaylist = async (
  accessToken: string,
  options: {
    title: string;
    description?: string;
    privacyStatus: "public" | "private" | "unlisted";
  }
): Promise<string> => {
  const data = await youtubeRequest<CreatePlaylistResponse>({
    accessToken,
    path: "playlists",
    params: {
      part: "snippet,status",
    },
    init: {
      method: "POST",
      body: JSON.stringify({
        snippet: {
          title: options.title,
          description: options.description ?? "",
        },
        status: {
          privacyStatus: options.privacyStatus,
        },
      }),
    },
  });

  if (!data.id) {
    throw new Error("No se pudo crear la playlist de destino.");
  }

  return data.id;
};

export const insertPlaylistItem = async (
  accessToken: string,
  options: {
    playlistId: string;
    videoId: string;
    position?: number;
  }
): Promise<string> => {
  const data = await youtubeRequest<PlaylistItemInsertResponse>({
    accessToken,
    path: "playlistItems",
    params: {
      part: "snippet",
    },
    init: {
      method: "POST",
      body: JSON.stringify({
        snippet: {
          playlistId: options.playlistId,
          position: options.position,
          resourceId: {
            kind: "youtube#video",
            videoId: options.videoId,
          },
        },
      }),
    },
  });

  if (!data.id) {
    throw new Error("No se pudo insertar el vídeo.");
  }

  return data.id;
};
