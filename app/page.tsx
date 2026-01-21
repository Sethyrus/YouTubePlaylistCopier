import HomeClient from "@/app/components/HomeClient";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-200/60 blur-[120px]" />
        <div className="absolute right-10 top-0 h-80 w-80 rounded-full bg-amber-200/70 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-200/50 blur-[160px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.4em] text-zinc-500">
          <span>Youtube playlist copier</span>
          <span>Local only · OAuth</span>
        </header>

        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">
                Copia real, no referencia
              </p>
              <h1 className="font-display text-4xl leading-tight text-zinc-900 sm:text-5xl">
                Clona playlists publicas de YouTube en minutos.
              </h1>
              <p className="text-base text-zinc-600">
                Toma cualquier playlist publica y crea una copia propia en tu cuenta,
                con el mismo orden y lista de videos. Sin hojas de calculo, sin pasos
                manuales.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Autorizacion segura",
                  detail: "OAuth con permisos de YouTube y tokens en servidor.",
                },
                {
                  title: "Orden intacto",
                  detail: "Respetamos la posicion original de cada video.",
                },
                {
                  title: "Resultado directo",
                  detail: "Recibes el enlace final al completar la copia.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-zinc-600 shadow-sm backdrop-blur"
                >
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2 text-xs leading-relaxed">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <HomeClient />
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/50 bg-white/70 p-8 text-sm text-zinc-600 shadow-xl shadow-black/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-zinc-900">
              Flujo de copia
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              3 pasos
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Conecta Google",
                detail: "Concede permisos para leer y crear playlists.",
              },
              {
                step: "02",
                title: "Pega la URL",
                detail: "Usa la URL completa o solo el ID de la playlist.",
              },
              {
                step: "03",
                title: "Recibe la copia",
                detail: "Publica, con el mismo titulo y descripcion.",
              },
            ].map((step) => (
              <div key={step.step} className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-700">
                  {step.step}
                </p>
                <p className="text-base font-semibold text-zinc-900">
                  {step.title}
                </p>
                <p className="text-sm text-zinc-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
