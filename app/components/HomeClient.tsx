"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, type FormEvent } from "react";

import CloneResult from "@/app/components/CloneResult";
import type { CloneResponse } from "@/lib/types";

type FormState = {
  playlistUrl: string;
  isSubmitting: boolean;
  error: string | null;
  result: CloneResponse | null;
};

const initialState: FormState = {
  playlistUrl: "",
  isSubmitting: false,
  error: null,
  result: null,
};

export default function HomeClient() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<FormState>(initialState);

  const updateState = (updates: Partial<FormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!state.playlistUrl.trim()) {
      updateState({ error: "Introduce una URL o un ID de playlist valido." });
      return;
    }

    updateState({ isSubmitting: true, error: null, result: null });

    try {
      const response = await fetch("/api/clone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlistUrl: state.playlistUrl }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      } & CloneResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo copiar la playlist.");
      }

      updateState({ result: data, isSubmitting: false });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : "Error inesperado.",
        isSubmitting: false,
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="rounded-3xl border border-white/40 bg-white/70 p-8 shadow-xl shadow-black/5 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Preparando sesion
        </p>
        <p className="mt-2 text-lg text-zinc-900">
          Comprobando tu cuenta de Google
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-xl shadow-black/5 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Conecta tu cuenta
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-zinc-900">
          Accede a tus playlists de YouTube
        </h2>
        <p className="mt-3 text-sm text-zinc-600">
          Necesitamos permisos para crear una nueva playlist y copiar los videos
          en tu cuenta local.
        </p>
        <button
          onClick={() => signIn("google")}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Conectar con Google
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/40 bg-white/90 p-8 shadow-xl shadow-black/5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Sesion activa
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Hola{session.user?.name ? `, ${session.user.name}` : ""}
          </p>
          <p className="text-sm text-zinc-600">
            Tu playlist se creara como publica con el mismo titulo.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-900"
        >
          Cerrar sesion
        </button>
      </div>

      {session.error && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tu sesion expiro. Vuelve a iniciar sesion para continuar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-zinc-800">
          URL o ID de playlist
          <input
            value={state.playlistUrl}
            onChange={(event) => updateState({ playlistUrl: event.target.value })}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
          />
        </label>

        {state.error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={state.isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {state.isSubmitting ? "Copiando playlist..." : "Copiar playlist"}
        </button>
      </form>

      {state.result && <CloneResult result={state.result} />}
    </div>
  );
}
