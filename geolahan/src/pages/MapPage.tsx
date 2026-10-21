import { LayerSwitcher } from '../components/map/LayerSwitcher';
import { MapView } from '../components/map/MapView';

export function MapPage() {
  return (
    <div className="absolute inset-0">
      <h1 className="sr-only">Peta &amp; Pengukuran</h1>
      <MapView />
      <LayerSwitcher />
    </div>
  );
}
