const playlistIdPattern = /^[A-Za-z0-9_-]{10,}$/;
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

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

export const parseVideoId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get("v");
    if (listParam && videoIdPattern.test(listParam)) {
      return listParam;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const candidate = pathParts.find((part) => videoIdPattern.test(part));
    if (candidate) {
      return candidate;
    }
  } catch {
    // Not a URL, continue with raw input.
  }

  if (videoIdPattern.test(trimmed)) {
    return trimmed;
  }

  return null;
};
