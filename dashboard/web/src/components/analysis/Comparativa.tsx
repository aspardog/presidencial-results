'use client';

import { formatNumber, formatPercent } from '@/lib/formatters';
import comparativaData from '../../../public/api/comparativa.json';

// ── Tipos del contrato comparativa.json ──────────────────────────────────────
interface CandidatoVuelta {
  nombre: string;
  partido: string;
  color: string;
  votos: number;
  porcentaje: number;
}

interface Finalista {
  nombre: string;
  partido: string;
  color: string;
  votos_primera: number;
  pct_primera: number;
  votos_segunda: number;
  pct_segunda: number;
  delta_votos: number;
  delta_pct: number;
}

interface TrasvaseCandidato {
  nombre: string;
  es_finalista: boolean;
  votos_1a: number;
  pct_1a: number;
  lean: number;   // firmado: >0 hacia `referencia`, <0 hacia `otro`
  hacia: string;
  fuerza: number; // |lean|
  color: string;
}

interface Comparativa {
  nacional: {
    primera: { votos_validos: number; votos_emitidos: number; candidatos: CandidatoVuelta[] };
    segunda: { votos_validos: number; votos_emitidos: number; candidatos: CandidatoVuelta[] };
    finalistas: Finalista[];
    eliminados: CandidatoVuelta[];
    votos_en_juego: number;
    cambio_votos_emitidos: { primera: number; segunda: number; delta: number; delta_pct: number };
  };
  trasvase: {
    referencia: string;
    otro: string;
    metodologia: string;
    candidatos: TrasvaseCandidato[];
  } | null;
  resumen: {
    n_departamentos: number;
    n_volteados: number;
    departamentos_volteados: { codigo: string; nombre: string; de: string | null; a: string; margen_segunda: number }[];
  };
}

const data = comparativaData as Comparativa;

const tituloCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bDe La\b/g, 'de la')
    .replace(/\bDel\b/g, 'del');

// Nombre compacto y legible.
const nombreCorto = (nombre: string) => {
  if (nombre.includes('CEPEDA')) return 'Iván Cepeda';
  if (nombre.includes('ESPRIELLA')) return 'Abelardo de la Espriella';
  const partes = nombre.split(' ');
  return tituloCase(`${partes[0]} ${partes[1] || ''}`.trim());
};

const etiquetaFuerza = (f: number) =>
  f >= 0.6 ? 'afinidad fuerte' : f >= 0.35 ? 'afinidad moderada' : f >= 0.15 ? 'afinidad leve' : 'sin patrón claro';

export default function Comparativa() {
  const { finalistas, votos_en_juego, cambio_votos_emitidos } = data.nacional;
  const { n_volteados, departamentos_volteados } = data.resumen;

  // Ganador primero.
  const finalistasOrden = [...finalistas].sort((a, b) => b.votos_segunda - a.votos_segunda);
  const quienCrecioMas = [...finalistas].sort((a, b) => b.delta_pct - a.delta_pct)[0];

  const trasvase = data.trasvase;
  const refColor = trasvase ? (finalistas.find((f) => f.nombre === trasvase.referencia)?.color ?? '#1D4ED8') : '#1D4ED8';
  const otroColor = trasvase ? (finalistas.find((f) => f.nombre === trasvase.otro)?.color ?? '#C2410C') : '#C2410C';
  // Eliminados con peso suficiente para leer una tendencia (>= 1% de la 1ª vuelta).
  const leanDestacados = (trasvase?.candidatos ?? [])
    .filter((c) => !c.es_finalista && c.pct_1a >= 1)
    .sort((a, b) => b.votos_1a - a.votos_1a);
  const leanOtros = (trasvase?.candidatos ?? []).filter((c) => !c.es_finalista && c.pct_1a < 1);
  const votosOtros = leanOtros.reduce((s, c) => s + c.votos_1a, 0);

  return (
    <section className="mt-6 sm:mt-10">
      <header className="mb-4 sm:mb-6">
        <h2 className="font-display text-base sm:text-lg font-semibold text-gb-ink">
          La primera vuelta
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gb-slate-muted">
          Once candidatos y ninguna mayoría: el balotaje enfrentó a los dos más votados. Así se
          reacomodó el electorado hacia la segunda vuelta.
        </p>
      </header>

      {/* Quiénes pasaron: crecimiento de los finalistas 1ª → 2ª */}
      <div className="gb-card">
        <p className="gb-eyebrow">Los dos que pasaron · 1ª → 2ª vuelta</p>
        <div className="mt-4 grid gap-4 sm:gap-6 md:grid-cols-2">
          {finalistasOrden.map((f, i) => (
            <div key={f.nombre} className="rounded-lg border border-gb-border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: f.color }} aria-hidden />
                  <span className="truncate font-display text-sm sm:text-base font-semibold text-gb-ink">
                    {nombreCorto(f.nombre)}
                  </span>
                </div>
                {i === 0 && (
                  <span className="shrink-0 rounded-full bg-gb-teal-700/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-gb-teal-700">
                    Ganador
                  </span>
                )}
              </div>

              <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold tabular-nums text-gb-ink">
                {formatPercent(f.pct_primera)}
                <span className="mx-1.5 text-gb-slate-muted">→</span>
                {formatPercent(f.pct_segunda)}
              </p>

              <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gb-border/60">
                <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: `${f.pct_primera}%`, backgroundColor: f.color }} />
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${f.pct_segunda}%`, backgroundColor: f.color, mixBlendMode: 'multiply' }} />
              </div>

              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="font-mono text-gb-slate-muted">
                  {formatNumber(f.votos_primera)} → {formatNumber(f.votos_segunda)}
                </span>
                <span className="font-mono font-semibold text-gb-teal-700">
                  +{formatNumber(f.delta_votos)} · +{f.delta_pct.toFixed(1)} pp
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Afinidad territorial del voto eliminado (análisis profundo) */}
      {trasvase && leanDestacados.length > 0 && (
        <div className="mt-3 sm:mt-4 gb-card">
          <p className="gb-eyebrow">¿Hacia dónde se inclinó el voto eliminado?</p>
          <p className="mt-1 text-xs sm:text-sm text-gb-slate-muted">
            Afinidad territorial: dónde cada candidato fue fuerte en 1ª vuelta, ¿qué finalista creció
            más en 2ª? Mide tendencia, no el voto individual.
          </p>

          {/* Escala */}
          <div className="mt-4 flex items-center justify-between font-mono text-[10px] sm:text-xs">
            <span className="font-semibold" style={{ color: otroColor }}>← {nombreCorto(trasvase.otro)}</span>
            <span className="text-gb-slate-muted">neutral</span>
            <span className="font-semibold" style={{ color: refColor }}>{nombreCorto(trasvase.referencia)} →</span>
          </div>

          <div className="mt-2 space-y-3">
            {leanDestacados.map((c) => {
              const haciaRef = c.lean >= 0;
              const barColor = haciaRef ? refColor : otroColor;
              const half = Math.min(Math.abs(c.lean), 1) * 50; // % del ancho desde el centro
              return (
                <div key={c.nombre}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gb-ink truncate">
                      {nombreCorto(c.nombre)}
                      <span className="ml-1.5 font-mono text-[10px] text-gb-slate-muted">
                        {c.pct_1a.toFixed(1)}% · {formatNumber(c.votos_1a)}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] sm:text-xs font-semibold" style={{ color: barColor }}>
                      → {nombreCorto(c.hacia)} · {etiquetaFuerza(c.fuerza)}
                    </span>
                  </div>
                  {/* Barra divergente desde el centro */}
                  <div className="relative mt-1.5 h-3.5 w-full rounded bg-gb-border/40">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-gb-slate-muted/40" />
                    <div
                      className="absolute inset-y-0 rounded"
                      style={
                        haciaRef
                          ? { left: '50%', width: `${half}%`, backgroundColor: barColor }
                          : { right: '50%', width: `${half}%`, backgroundColor: barColor }
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {votosOtros > 0 && (
            <p className="mt-3 text-[10px] sm:text-xs text-gb-slate-muted">
              Los demás candidatos eliminados suman {formatNumber(votosOtros)} votos, demasiado
              pequeños para una tendencia territorial fiable.
            </p>
          )}

          {/* La clave: consolidación vs movilización */}
          <div className="mt-4 rounded-gb-md border border-gb-border bg-gb-teal-50 px-3 py-3 sm:px-4">
            <p className="text-xs sm:text-sm text-gb-slate">
              <strong>La paradoja del balotaje:</strong> el voto eliminado tuvo afinidad territorial
              hacia {nombreCorto(trasvase.referencia)} (sobre todo el de Valencia), pero{' '}
              {nombreCorto(quienCrecioMas.nombre)} fue quien <strong>más creció</strong> entre vueltas
              (+{quienCrecioMas.delta_pct.toFixed(1)} pp), impulsado por{' '}
              {cambio_votos_emitidos.delta > 0
                ? `una mayor participación (+${formatNumber(cambio_votos_emitidos.delta)} votos)`
                : 'la recomposición del electorado'}
              . Consolidación de un lado, movilización del otro: se definió por {formatNumber(finalistasOrden[0].votos_segunda - finalistasOrden[1].votos_segunda)} votos.
            </p>
          </div>

          <p className="mt-3 pt-3 border-t border-gb-border text-[10px] sm:text-xs text-gb-slate-muted">
            {trasvase.metodologia}
          </p>
        </div>
      )}

      {/* Métricas del reacomodo */}
      <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Votos en juego</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-teal-700">
            {formatNumber(votos_en_juego)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">De candidatos eliminados</p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Participación</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-ink">
            {cambio_votos_emitidos.delta >= 0 ? '+' : ''}{formatNumber(cambio_votos_emitidos.delta)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">
            Votos ({cambio_votos_emitidos.delta_pct >= 0 ? '+' : ''}{cambio_votos_emitidos.delta_pct.toFixed(1)}%) vs 1ª
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Deptos. volteados</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-ink">{n_volteados}</p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">Cambiaron de ganador entre vueltas</p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Margen final</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-teal-700">
            +{formatNumber(finalistasOrden[0].votos_segunda - finalistasOrden[1].votos_segunda)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">
            {formatPercent(finalistasOrden[0].pct_segunda - finalistasOrden[1].pct_segunda)} de diferencia
          </p>
        </div>
      </div>

      {/* Departamento que cambió de ganador */}
      {departamentos_volteados.length > 0 && (
        <div className="mt-3 sm:mt-4 gb-card">
          <p className="gb-eyebrow">
            {departamentos_volteados.length === 1 ? 'El único departamento que cambió de ganador' : 'Departamentos que cambiaron de ganador'}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {departamentos_volteados.map((d) => (
              <div key={d.codigo} className="rounded-lg border border-gb-border bg-white p-3">
                <p className="font-display text-sm font-semibold text-gb-ink">{d.nombre}</p>
                <p className="mt-1 text-xs text-gb-slate">
                  {d.de ? nombreCorto(d.de) : '—'}
                  <span className="mx-1 text-gb-slate-muted">→</span>
                  <span className="font-semibold text-gb-teal-700">{nombreCorto(d.a)}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] text-gb-slate-muted">
                  Margen 2ª vuelta: {formatPercent(d.margen_segunda)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
