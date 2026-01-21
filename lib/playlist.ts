const playlistIdPattern = /^[A-Za-z0-9_-]{10,}$/;

export const parsePlaylistId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get("list");
    if (listParam && playlistIdPattern.test(listParam)) {
      return listParam;
    }
  } catch {
    // Not a URL, continue with raw input.
  }

  if (playlistIdPattern.test(trimmed)) {
    return trimmed;
  }

  return null;
};
