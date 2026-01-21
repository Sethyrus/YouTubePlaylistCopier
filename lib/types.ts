export type CloneError = {
  videoId: string;
  title?: string;
  error: string;
};

export type CloneResponse = {
  playlistId: string;
  destinationUrl: string;
  insertedCount: number;
  totalCount: number;
  errors: CloneError[];
};

export type CloneRequestBody = {
  playlistUrl?: string;
};
