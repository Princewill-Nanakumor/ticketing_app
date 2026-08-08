import Link from "next/link";

export default function Homepage() {
  return (
    <main
      className="relative overflow-hidden bg-paper text-ink"
      style={{ height: "calc(100dvh - var(--helix-nav-height))" }}
    >
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

      <section className="relative z-10 flex h-full flex-col items-start justify-center px-6 py-8 text-left sm:px-10 sm:py-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="hero-rise font-(family-name:--font-helix-display) text-[clamp(2rem,6vw,3.75rem)] tracking-[0.02em] text-paper">
            Helix
          </p>

          <div className="hero-line mt-3 h-px w-24 bg-brass sm:mt-4" />

          <h1 className="hero-rise-delay mt-5 max-w-2xl font-(family-name:--font-helix-display) text-[clamp(1.75rem,5vw,3rem)] leading-[1.15] text-paper sm:mt-6">
            Support that stays composed.
          </h1>

          <p className="hero-rise-delay mt-3 max-w-md text-[clamp(0.95rem,2.4vw,1.125rem)] leading-relaxed text-mist sm:mt-4">
            Open a request or review what is already in motion—quietly, clearly,
            without the noise.
          </p>

          <div className="hero-rise-delay-2 mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/tickets"
              className="flex w-full items-center justify-center border border-paper/80 bg-paper px-7 py-3 text-center text-sm font-medium tracking-wide text-ink transition duration-300 hover:bg-mist sm:w-auto sm:py-3.5"
            >
              View tickets
            </Link>
            <Link
              href="/tickets/new"
              className="flex w-full items-center justify-center border border-brass bg-transparent px-7 py-3 text-center text-sm font-medium tracking-wide text-paper transition duration-300 hover:border-paper hover:bg-brass/20 sm:w-auto sm:py-3.5"
            >
              Submit a ticket
            </Link>
          </div>

          <p className="hero-rise-delay-2 mt-5 text-sm text-mist sm:mt-6">
            Built by{" "}
            <a
              href="https://princewillnanakumor.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper underline decoration-brass underline-offset-4 transition hover:text-brass"
            >
              Nanakumor Princewill
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
