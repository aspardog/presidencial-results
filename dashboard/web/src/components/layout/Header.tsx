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
          <p className="gb-eyebrow mb-1">Elecciones · Colombia 2026</p>
          <h1 className="break-words text-xl font-display font-semibold leading-tight text-gb-ink sm:text-2xl">
            {departamentoActual || 'Resultados Presidenciales'}
          </h1>
          <p className="mt-1 break-words text-sm text-gb-slate-muted font-mono">
            {departamentoActual ? 'Vista departamental' : 'Vista nacional'}
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
