"use client";

import type { CloneResponse } from "@/lib/types";

type CloneResultProps = {
  result: CloneResponse;
};

export default function CloneResult({ result }: CloneResultProps) {
  return (
    <div className="mt-6 rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Playlist creada
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
            {result.insertedCount}/{result.totalCount} vídeos copiados
          </h3>
        </div>
        <a
          href={result.destinationUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Abrir playlist
          <span aria-hidden>↗</span>
        </a>
      </div>

      {result.errors.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            Algunos vídeos no pudieron añadirse ({result.errors.length}).
          </p>
          <ul className="mt-2 space-y-2">
            {result.errors.map((error) => (
              <li key={error.videoId} className="rounded-xl bg-white/70 p-3">
                <p className="font-medium text-zinc-900">
                  {error.title ?? "Vídeo sin título"}
                </p>
                <p className="text-xs text-zinc-500">{error.videoId}</p>
                <p className="mt-1 text-amber-800">{error.error}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
