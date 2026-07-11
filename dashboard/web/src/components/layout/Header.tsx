'use client';

interface HeaderProps {
  onReset?: () => void;
  departamentoActual?: string | null;
}

export default function Header({ onReset, departamentoActual }: HeaderProps) {
  return (
    <header className="border-b border-gb-border bg-gb-surface px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <p className="gb-eyebrow">Elecciones · Colombia 2026</p>
            <span className="inline-flex items-center rounded-full border border-gb-teal-600/30 bg-gb-teal-700/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-gb-teal-700">
              2ª vuelta
            </span>
          </div>
          <h1 className="break-words text-xl font-display font-semibold leading-tight text-gb-ink sm:text-2xl">
            {departamentoActual || 'Resultados Presidenciales'}
          </h1>
          <p className="mt-1 break-words text-sm text-gb-slate-muted font-mono">
            {departamentoActual ? 'Vista departamental · 2ª vuelta' : 'Balotaje · Vista nacional'}
          </p>
        </div>

        {departamentoActual && onReset && (
          <button
            onClick={onReset}
            className="gb-btn gb-btn--secondary w-fit"
          >
            ← Volver a Nacional
          </button>
        )}
      </div>
    </header>
  );
}
