import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { LoaderCircle, MapPin, Search, TriangleAlert, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import {
  GeocodingError,
  MIN_QUERY_LENGTH,
  getGeocoder,
  normalizeQuery,
  type GeocodingResult,
} from '../../features/map/geocoding.service';
import { useMapController } from './map-controller';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; query: string; results: GeocodingResult[] }
  | { status: 'error'; message: string };

/** Jeda minimum antar-submit agar tombol/Enter yang ditekan beruntun tidak memicu permintaan berlebihan. */
const SUBMIT_DEBOUNCE_MS = 600;

const TYPE_LABELS: Record<string, string> = {
  village: 'Desa',
  hamlet: 'Dusun',
  suburb: 'Kelurahan',
  city_district: 'Kecamatan',
  district: 'Kecamatan',
  municipality: 'Kecamatan',
  county: 'Kabupaten',
  city: 'Kota',
  town: 'Kota',
  state: 'Provinsi',
  road: 'Jalan',
  administrative: 'Wilayah',
};

/**
 * Pencarian lokasi (desa, kecamatan, kabupaten/kota, alamat).
 * Dijalankan hanya saat Enter/tombol Cari — sesuai kebijakan Nominatim yang melarang autocomplete.
 */
export function LocationSearch({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const lastSubmitRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { focusOn } = useMapController();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  async function runSearch() {
    const normalized = normalizeQuery(query);
    if (normalized.length < MIN_QUERY_LENGTH) {
      setState({ status: 'error', message: `Masukkan minimal ${MIN_QUERY_LENGTH} karakter.` });
      setOpen(true);
      return;
    }
    // Hasil untuk kata kunci yang sama sudah tampil → cukup buka kembali daftar.
    if (state.status === 'success' && state.query === normalized) {
      setOpen(true);
      return;
    }
    const now = Date.now();
    if (state.status === 'loading' || now - lastSubmitRef.current < SUBMIT_DEBOUNCE_MS) return;
    lastSubmitRef.current = now;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'loading' });
    setOpen(true);
    setActiveIndex(-1);

    try {
      const results = await getGeocoder().search(normalized, controller.signal);
      if (controller.signal.aborted) return;
      setState({ status: 'success', query: normalized, results });
      setActiveIndex(results.length > 0 ? 0 : -1);
    } catch (error) {
      if (error instanceof GeocodingError && error.kind === 'aborted') return;
      const message =
        error instanceof GeocodingError ? error.message : 'Terjadi kesalahan tak terduga saat mencari lokasi.';
      setState({ status: 'error', message });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void runSearch();
  }

  function selectResult(result: GeocodingResult) {
    focusOn(result);
    setOpen(false);
    inputRef.current?.blur();
    if (location.pathname !== '/peta') navigate('/peta');
  }

  function clear() {
    abortRef.current?.abort();
    setQuery('');
    setState({ status: 'idle' });
    setOpen(false);
    inputRef.current?.focus();
  }

  const results = state.status === 'success' ? state.results : [];

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      const target = results[activeIndex];
      if (target && state.status === 'success' && state.query === normalizeQuery(query)) {
        event.preventDefault();
        selectResult(target);
      }
    }
  }

  const showPanel = open && state.status !== 'idle';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form role="search" onSubmit={onSubmit} className="flex items-center">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Cari lokasi
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => state.status !== 'idle' && setOpen(true)}
            placeholder="Cari desa, kecamatan, kota…"
            autoComplete="off"
            maxLength={200}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
            className="h-10 w-full rounded-l-lg border border-r-0 border-slate-300 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              aria-label="Hapus kata kunci"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="flex h-10 items-center gap-1.5 rounded-r-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none disabled:opacity-70"
        >
          {state.status === 'loading' ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4 sm:hidden" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Cari</span>
          <span className="sr-only sm:hidden">Cari</span>
        </button>
      </form>

      {showPanel && (
        <div className="absolute top-full right-0 left-0 z-[1100] mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {state.status === 'loading' && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300" role="status">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Mencari lokasi…
            </p>
          )}
          {state.status === 'error' && (
            <p className="flex items-start gap-2 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {state.message}
            </p>
          )}
          {state.status === 'success' && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" role="status">
              Tidak ada lokasi yang cocok dengan “{state.query}”. Coba nama yang lebih umum, mis. nama kecamatan atau
              kabupaten.
            </p>
          )}
          {results.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Hasil pencarian lokasi" className="max-h-80 overflow-y-auto py-1">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerEnter={() => setActiveIndex(index)}
                  onClick={() => selectResult(result)}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${
                    index === activeIndex ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''
                  }`}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {result.name}
                      </span>
                      {TYPE_LABELS[result.type] && (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                          {TYPE_LABELS[result.type]}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {result.displayName}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-slate-100 px-4 py-1.5 text-[11px] text-slate-400 dark:border-slate-800">
            {getGeocoder().attribution}
          </p>
        </div>
      )}
    </div>
  );
}
