'use client';

interface HeaderProps {
  onReset?: () => void;
  departamentoActual?: string | null;
}

export default function Header({ onReset, departamentoActual }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
            Elecciones Presidenciales Colombia 2026
          </h1>
          <p className="mt-1 break-words text-sm text-gray-500">
            {departamentoActual
              ? `Viendo: ${departamentoActual}`
              : 'Vista Nacional'}
          </p>
        </div>

        {departamentoActual && onReset && (
          <button
            onClick={onReset}
            className="w-fit rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Volver a Nacional
          </button>
        )}
      </div>
    </header>
  );
}
