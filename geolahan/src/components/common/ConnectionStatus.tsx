import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function ConnectionStatus() {
  const online = useOnlineStatus();
  const label = online
    ? 'Online — peta satelit dan pencarian tersedia'
    : 'Offline — tile satelit dan pencarian lokasi mungkin tidak tersedia';
  return (
    <span
      role="status"
      title={label}
      aria-label={label}
      className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium md:inline-flex ${
        online
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      }`}
    >
      {online ? <Wifi className="size-3.5" aria-hidden="true" /> : <WifiOff className="size-3.5" aria-hidden="true" />}
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
