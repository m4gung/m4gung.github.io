import { LandPlot, Layers, Map as MapIcon, ArrowRight, Calendar, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Card, PageContainer } from '../components/layout/PageContainer';
import { useParcels } from '../features/parcels/useParcels';
import { useMeasurement } from '../features/measurement/useMeasurement';
import { formatNumberId } from '../features/measurement/geometry.service';

export function DashboardPage() {
  const { parcels } = useParcels();
  const { setLoadedParcelId } = useMeasurement();
  const navigate = useNavigate();

  const totalAreaM2 = parcels.reduce((acc, p) => acc + p.areaM2, 0);
  const totalAreaHa = totalAreaM2 / 10000;
  const recentParcels = parcels.slice(0, 5);

  const handleOpenOnMap = (id: string) => {
    setLoadedParcelId(id);
    navigate('/peta');
  };

  return (
    <PageContainer title="Dashboard" description="Ringkasan dan statistik bidang tanah yang telah Anda ukur.">
      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <LandPlot className="size-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Bidang Tanah</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {parcels.length} <span className="text-xs font-normal text-slate-500">Bidang</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Layers className="size-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Akumulasi Luas</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatNumberId(totalAreaM2)} <span className="text-xs font-normal text-slate-500">m²</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <LandPlot className="size-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Hektare</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatNumberId(totalAreaHa, 4)} <span className="text-xs font-normal text-slate-500">Ha</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pengukuran Terbaru */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Pengukuran Terbaru
          </h2>
          {parcels.length > 0 && (
            <Link
              to="/lahan"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Lihat Semua ({parcels.length}) <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {parcels.length === 0 ? (
          <div className="text-center py-10">
            <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 mb-3">
              <LandPlot className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Belum ada bidang tanah
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Mulai ukur lahan dengan menggambar poligon di atas peta satelit.
            </p>
            <Link to="/peta" className="btn-primary text-xs px-4 py-2">
              <MapIcon className="size-4" /> Buka Peta Satelit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentParcels.map((parcel) => (
              <div
                key={parcel.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="size-3.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: parcel.color }}
                  />
                  <div>
                    <Link
                      to={`/lahan/${parcel.id}`}
                      className="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {parcel.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {parcel.owner && (
                        <span className="flex items-center gap-1">
                          <User className="size-3" /> {parcel.owner}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" /> {parcel.measuredAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right pl-6 sm:pl-0">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatNumberId(parcel.areaM2)} m²
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatNumberId(parcel.areaHa, 4)} Ha
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOnMap(parcel.id)}
                    className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
                    title="Buka dan fokuskan di peta"
                  >
                    <MapIcon className="size-3.5" />
                    <span>Peta</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
