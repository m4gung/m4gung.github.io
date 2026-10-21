import type { ReactNode } from 'react';
import { Check, Download, ExternalLink, Monitor, Moon, Smartphone, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, PageContainer } from '../components/layout/PageContainer';
import { useMapController } from '../components/map/map-controller';
import { BASE_LAYER_IDS, BASE_LAYERS, TILE_SOURCES } from '../features/map/map.config';
import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { promptInstall, usePwaState } from '../pwa/pwa-store';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Ikuti sistem', icon: Monitor },
];

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none ${
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {children}
      {active && <Check className="ml-auto size-4 shrink-0 text-emerald-600" aria-hidden="true" />}
    </button>
  );
}

export function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { baseLayer, setBaseLayer } = useMapController();
  const pwa = usePwaState();

  const uniqueTerms = Array.from(
    new Map(Object.values(TILE_SOURCES).map((s) => [s.termsUrl, s])).values(),
  );

  return (
    <PageContainer title="Pengaturan" description="Preferensi tampilan disimpan di perangkat ini (localStorage).">
      <div className="grid gap-6">
        <Card className="p-5">
          <h2 id="theme-heading" className="font-semibold">Tema</h2>
          <div role="radiogroup" aria-labelledby="theme-heading" className="mt-3 grid gap-2 sm:grid-cols-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <OptionButton key={value} active={mode === value} onClick={() => setMode(value)}>
                <Icon className="size-4" aria-hidden="true" /> {label}
              </OptionButton>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 id="layer-heading" className="font-semibold">Layer peta</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Layer yang dipilih akan dipakai setiap kali peta dibuka.
          </p>
          <div role="radiogroup" aria-labelledby="layer-heading" className="mt-3 grid gap-2 sm:grid-cols-3">
            {BASE_LAYER_IDS.map((id) => (
              <OptionButton key={id} active={baseLayer === id} onClick={() => setBaseLayer(id)}>
                <span>
                  <span className="block font-medium">{BASE_LAYERS[id].label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{BASE_LAYERS[id].description}</span>
                </span>
              </OptionButton>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Smartphone className="size-4" aria-hidden="true" /> Aplikasi &amp; mode offline
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            GeoLahan Pro dapat dipasang seperti aplikasi. Antarmuka dan data lahan tetap dapat dibuka tanpa internet; peta
            satelit hanya menampilkan area yang pernah dimuat sebelumnya, dan pencarian lokasi membutuhkan internet.
          </p>
          <p className="mt-2 text-sm" data-testid="pwa-status">
            {pwa.isStandalone
              ? 'Berjalan sebagai aplikasi terpasang.'
              : pwa.offlineReady
                ? 'Siap dipakai offline.'
                : 'Mode offline akan aktif setelah halaman dimuat sekali dengan internet.'}
          </p>
          {pwa.canInstall && (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none"
            >
              <Download className="size-4" aria-hidden="true" /> Pasang aplikasi
            </button>
          )}
          {!pwa.canInstall && !pwa.isStandalone && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Jika tombol pasang tidak muncul, gunakan menu browser: &ldquo;Tambahkan ke layar utama&rdquo; (iOS Safari) atau
              &ldquo;Instal aplikasi&rdquo; (Chrome/Edge).
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Penyedia peta &amp; ketentuan</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Citra satelit disediakan oleh Esri World Imagery dan peta jalan oleh OpenStreetMap. Atribusi penyedia selalu
            ditampilkan di pojok peta. Penggunaan komersial dan ekspor citra ke laporan tunduk pada ketentuan masing-masing
            penyedia.
          </p>
          <ul className="mt-3 grid gap-1 text-sm">
            {uniqueTerms.map((source) => (
              <li key={source.termsUrl}>
                <a
                  href={source.termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {new URL(source.termsUrl).hostname} <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://operations.osmfoundation.org/policies/nominatim/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Kebijakan pencarian Nominatim <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
