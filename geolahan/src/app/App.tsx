import { RouterProvider } from 'react-router';
import { ThemeProvider } from '../components/common/ThemeProvider';
import { MapControllerProvider } from '../components/map/MapControllerProvider';
import { MeasurementProvider } from '../features/measurement/measurement.context';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <MapControllerProvider>
        <MeasurementProvider>
          <RouterProvider router={router} />
        </MeasurementProvider>
      </MapControllerProvider>
    </ThemeProvider>
  );
}
