import Link from "next/link";

export default function Homepage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div
        aria-hidden
        className="hero-drift pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(120deg, rgba(20, 32, 28, 0.72) 0%, rgba(20, 32, 28, 0.35) 42%, rgba(20, 32, 28, 0.55) 100%),
            url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(143, 115, 72, 0.28), transparent 42%), radial-gradient(circle at 80% 70%, rgba(95, 116, 104, 0.35), transparent 45%)",
        }}
      />

      <section className="relative z-10 flex min-h-screen flex-col items-start justify-center px-6 py-16 text-left sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="hero-rise font-(family-name:--font-helix-display) text-4xl tracking-[0.02em] text-paper sm:text-5xl md:text-6xl">
            Helix
          </p>

          <div className="hero-line mt-5 h-px w-24 bg-brass" />

          <h1 className="hero-rise-delay mt-8 max-w-2xl font-(family-name:--font-helix-display) text-3xl leading-[1.15] text-paper sm:text-4xl md:text-5xl">
            Support that stays composed.
          </h1>

          <p className="hero-rise-delay mt-5 max-w-md text-base leading-relaxed text-mist sm:text-lg">
            Open a request or review what is already in motion—quietly, clearly,
            without the noise.
          </p>

          <div className="hero-rise-delay-2 mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href="/tickets"
              className="flex w-full items-center justify-center border border-paper/80 bg-paper px-7 py-3.5 text-center text-sm font-medium tracking-wide text-ink transition duration-300 hover:bg-mist sm:w-auto"
            >
              View tickets
            </Link>
            <Link
              href="/tickets/new"
              className="flex w-full items-center justify-center border border-brass bg-transparent px-7 py-3.5 text-center text-sm font-medium tracking-wide text-paper transition duration-300 hover:border-paper hover:bg-brass/20 sm:w-auto"
            >
              Submit a ticket
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
