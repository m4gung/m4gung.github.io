import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { TriangleAlert, X } from 'lucide-react';
import type { Position } from 'geojson';
import { MAP_DEFAULTS } from '../../features/map/map.config';
import { createBaseLayer } from '../../features/map/tile.service';
import { useMapController } from './map-controller';
import { useMeasurement } from '../../features/measurement/useMeasurement';
import { MeasurementToolbar } from '../measurement/MeasurementToolbar';
import { MeasurementPanel } from '../measurement/MeasurementPanel';
import { GpsControls } from './GpsControls';
import { useGps } from '../../features/gps/useGps';
import { fixesToPositions, type GpsFix } from '../../features/gps/gps.service';
import { SaveParcelModal } from '../parcels/SaveParcelModal';
import { useParcels } from '../../features/parcels/useParcels';
import { formatNumberId } from '../../features/measurement/geometry.service';

const searchMarkerIcon = L.divIcon({
  className: 'geolahan-search-marker',
  html: '<span class="geolahan-search-marker__pin" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

function createPatokIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: 'geolahan-patok-marker',
    html: `<div class="patok-bubble">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createDistanceIcon(distanceM: number): L.DivIcon {
  return L.divIcon({
    className: 'geolahan-segment-label',
    html: `<div class="segment-bubble">${formatNumberId(distanceM)} m</div>`,
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });
}

function buildPopupContent(title: string, detail: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'geolahan-popup';
  const strong = document.createElement('strong');
  strong.textContent = title;
  const p = document.createElement('p');
  p.textContent = detail;
  wrapper.append(strong, p);
  return wrapper;
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const activePolygonLayerRef = useRef<L.Polygon | null>(null);
  const decorLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLocationRef = useRef<L.LayerGroup | null>(null);

  const { baseLayer, focusTarget } = useMapController();
  const {
    mode,
    setMode,
    measurement,
    activeCoordinates,
    selectedColor,
    setSelectedColor,
    updateCoordinates,
    resetMeasurement,
    loadedParcelId,
    setLoadedParcelId,
  } = useMeasurement();

  const { createParcel, updateParcel, getParcelById } = useParcels();
  const [tileErrorLayer, setTileErrorLayer] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const gps = useGps();
  const { locate, startTracking, stopTracking, clearTrack } = gps;
  const [gpsDraft, setGpsDraft] = useState<Position[]>([]);
  const [pendingTrack, setPendingTrack] = useState<GpsFix[] | null>(null);
  const [usedGps, setUsedGps] = useState(false);

  // Sync koordinat dari Leaflet Polygon ke Context
  const syncPolygonToState = useCallback(
    (layer: L.Polygon) => {
      const latlngs = layer.getLatLngs();
      // Polygon ring pertama
      const ring = Array.isArray(latlngs[0]) ? (latlngs[0] as L.LatLng[]) : (latlngs as L.LatLng[]);
      const coords: Position[] = ring.map((pt) => [pt.lng, pt.lat]);
      updateCoordinates(coords);
    },
    [updateCoordinates],
  );

  // 1) Inisialisasi peta Leaflet & Geoman
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: MAP_DEFAULTS.center,
      zoom: MAP_DEFAULTS.zoom,
      minZoom: MAP_DEFAULTS.minZoom,
      maxZoom: MAP_DEFAULTS.maxZoom,
      zoomControl: false,
      worldCopyJump: true,
    });

    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>',
    );
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Perbesar', zoomOutTitle: 'Perkecil' }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false, maxWidth: 160 }).addTo(map);

    // Inisialisasi LayerGroup untuk dekorasi patok P1..Pn & label jarak
    const decorGroup = L.layerGroup().addTo(map);
    decorLayerGroupRef.current = decorGroup;
    gpsLayerGroupRef.current = L.layerGroup().addTo(map);
    gpsLocationRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Handler event gambar Geoman (pm:create)
    map.on('pm:create', (e) => {
      if (e.shape === 'Polygon' && e.layer instanceof L.Polygon) {
        // Hapus poligon lama jika ada
        if (activePolygonLayerRef.current) {
          map.removeLayer(activePolygonLayerRef.current);
        }

        const polygon = e.layer;
        activePolygonLayerRef.current = polygon;

        // Pasang event edit/drag pada poligon baru
        polygon.on('pm:edit', () => syncPolygonToState(polygon));
        polygon.on('pm:dragend', () => syncPolygonToState(polygon));

        syncPolygonToState(polygon);
        setMode('idle');
      }
    });

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ debounceMoveend: true }));
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      searchMarkerRef.current = null;
      activePolygonLayerRef.current = null;
      decorLayerGroupRef.current = null;
      gpsLayerGroupRef.current = null;
      gpsLocationRef.current = null;
    };
  }, [syncPolygonToState, setMode]);

  // 2) Ganti Base Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setTileErrorLayer(null);
    let reported = false;
    const group = createBaseLayer(baseLayer, {
      onTileError: () => {
        if (reported) return;
        reported = true;
        setTileErrorLayer(baseLayer);
      },
    });
    group.addTo(map);
    return () => {
      group.eachLayer((layer) => layer.off());
      group.remove();
    };
  }, [baseLayer]);

  // 3) Fokus ke hasil pencarian geocoding
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    const { result } = focusTarget;

    if (result.bbox) {
      const [south, north, west, east] = result.bbox;
      map.flyToBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [MAP_DEFAULTS.fitBoundsPadding, MAP_DEFAULTS.fitBoundsPadding], maxZoom: 18, duration: 1.2 },
      );
    } else {
      map.flyTo([result.lat, result.lon], MAP_DEFAULTS.searchResultZoom, { duration: 1.2 });
    }

    searchMarkerRef.current?.remove();
    const marker = L.marker([result.lat, result.lon], {
      icon: searchMarkerIcon,
      keyboard: true,
      title: result.name,
      alt: result.name,
    })
      .bindPopup(buildPopupContent(result.name, result.displayName), { maxWidth: 280 })
      .addTo(map);
    searchMarkerRef.current = marker;
    map.once('moveend', () => marker.openPopup());
  }, [focusTarget]);

  // 4) Update styling warna poligon aktif
  useEffect(() => {
    if (activePolygonLayerRef.current) {
      activePolygonLayerRef.current.setStyle({
        color: selectedColor,
        fillColor: selectedColor,
        fillOpacity: 0.25,
        weight: 3,
      });
    }
  }, [selectedColor]);

  // 5) Update dekorasi label Patok P1..Pn dan Jarak Garis di peta
  useEffect(() => {
    const decorGroup = decorLayerGroupRef.current;
    if (!decorGroup) return;

    decorGroup.clearLayers();

    if (!measurement || !measurement.isValid) return;

    // Tambahkan marker patok P1, P2...
    measurement.controlPoints.forEach((cp) => {
      const marker = L.marker([cp.latitude, cp.longitude], {
        icon: createPatokIcon(cp.label),
        interactive: false,
      });
      decorGroup.addLayer(marker);
    });

    // Tambahkan label jarak di tengah setiap segmen
    measurement.segments.forEach((seg) => {
      const labelMarker = L.marker(seg.midpoint, {
        icon: createDistanceIcon(seg.distanceM),
        interactive: false,
      });
      decorGroup.addLayer(labelMarker);
    });
  }, [measurement]);

  // 6) Efek pemuatan lahan spesifik (jika loadedParcelId diset atau dari URL)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedParcelId) return;

    let isCancelled = false;
    getParcelById(loadedParcelId).then((parcel) => {
      if (isCancelled || !parcel) return;

      // Hapus poligon lama
      if (activePolygonLayerRef.current) {
        map.removeLayer(activePolygonLayerRef.current);
      }

      const ring = parcel.geometry.coordinates[0];
      if (!ring) return;

      const latlngs: L.LatLngExpression[] = ring
        .filter((pt): pt is [number, number] => typeof pt[0] === 'number' && typeof pt[1] === 'number')
        .map((pt) => [pt[1], pt[0]]);
      const polygon = L.polygon(latlngs, {
        color: parcel.color,
        fillColor: parcel.color,
        fillOpacity: 0.25,
        weight: 3,
      }).addTo(map);

      activePolygonLayerRef.current = polygon;
      setSelectedColor(parcel.color);

      polygon.on('pm:edit', () => syncPolygonToState(polygon));
      polygon.on('pm:dragend', () => syncPolygonToState(polygon));

      syncPolygonToState(polygon);

      // Fokuskan peta ke poligon yang dimuat dengan padding
      map.fitBounds(polygon.getBounds(), { padding: [40, 40], maxZoom: 18 });
    });

    return () => {
      isCancelled = true;
    };
  }, [loadedParcelId, getParcelById, syncPolygonToState, setSelectedColor]);

  // 7) Marker posisi GPS + lingkaran akurasi
  useEffect(() => {
    const group = gpsLocationRef.current;
    if (!group) return;
    group.clearLayers();
    if (!gps.fix) return;
    const ll: L.LatLngExpression = [gps.fix.latitude, gps.fix.longitude];
    L.circle(ll, {
      radius: gps.fix.accuracyM,
      color: '#2563eb',
      weight: 1,
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(group);
    L.circleMarker(ll, {
      radius: 7,
      color: '#fff',
      weight: 2,
      fillColor: '#2563eb',
      fillOpacity: 1,
      interactive: false,
    }).addTo(group);
  }, [gps.fix]);

  // 8) Draft patok GPS (<3 titik) dan lintasan rekaman
  useEffect(() => {
    const group = gpsLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (gpsDraft.length > 0) {
      const pts = gpsDraft.map((c) => [c[1], c[0]] as L.LatLngTuple);
      L.polyline(pts, { color: selectedColor, weight: 3, interactive: false }).addTo(group);
      pts.forEach((pt, i) => L.marker(pt, { icon: createPatokIcon(`P${i + 1}`), interactive: false }).addTo(group));
    }
    const trackPts = pendingTrack ?? gps.track;
    if (trackPts.length > 0) {
      L.polyline(
        trackPts.map((f) => [f.latitude, f.longitude] as L.LatLngTuple),
        { color: '#dc2626', weight: 3, dashArray: '6 6', interactive: false },
      ).addTo(group);
    }
  }, [gpsDraft, gps.track, pendingTrack, selectedColor]);

  // Terapkan koordinat sebagai poligon aktif (dipakai Patok GPS & lintasan)
  const applyCoordinates = useCallback(
    (coords: Position[]) => {
      const map = mapRef.current;
      if (!map) return;
      if (activePolygonLayerRef.current) {
        activePolygonLayerRef.current.pm.disable();
        map.removeLayer(activePolygonLayerRef.current);
      }
      const latlngs = coords.map((c) => [c[1], c[0]] as L.LatLngTuple);
      const polygon = L.polygon(latlngs, {
        color: selectedColor,
        fillColor: selectedColor,
        fillOpacity: 0.25,
        weight: 3,
      }).addTo(map);
      activePolygonLayerRef.current = polygon;
      polygon.on('pm:edit', () => syncPolygonToState(polygon));
      polygon.on('pm:dragend', () => syncPolygonToState(polygon));
      syncPolygonToState(polygon);
      setMode('idle');
      map.fitBounds(polygon.getBounds(), { padding: [40, 40], maxZoom: 19 });
    },
    [selectedColor, syncPolygonToState, setMode],
  );

  // Action GPS: Lokasi Saya
  const handleLocate = useCallback(async () => {
    const f = await locate();
    if (f && mapRef.current) {
      mapRef.current.flyTo([f.latitude, f.longitude], Math.max(mapRef.current.getZoom(), 18), { duration: 1 });
    }
  }, [locate]);

  // Action GPS: Tambah Patok GPS
  const handleAddGpsPatok = useCallback(async () => {
    const f = await locate(true);
    if (!f) return;
    const base = activeCoordinates ?? gpsDraft;
    const next: Position[] = [...base, [f.longitude, f.latitude]];
    setUsedGps(true);
    if (next.length >= 3) {
      setGpsDraft([]);
      applyCoordinates(next);
    } else {
      setGpsDraft(next);
      mapRef.current?.flyTo([f.latitude, f.longitude], Math.max(mapRef.current.getZoom(), 18), { duration: 0.8 });
    }
  }, [locate, activeCoordinates, gpsDraft, applyCoordinates]);

  // Action GPS: Rekam Lintasan (toggle)
  const handleToggleTrack = useCallback(() => {
    if (gps.isTracking) {
      const pts = stopTracking();
      if (pts.length >= 3) setPendingTrack(pts);
      else clearTrack();
    } else {
      setPendingTrack(null);
      startTracking();
    }
  }, [gps.isTracking, stopTracking, clearTrack, startTracking]);

  const handleConfirmTrack = useCallback(() => {
    if (!pendingTrack) return;
    setUsedGps(true);
    setGpsDraft([]);
    applyCoordinates(fixesToPositions(pendingTrack));
    setPendingTrack(null);
    clearTrack();
  }, [pendingTrack, applyCoordinates, clearTrack]);

  const handleDiscardTrack = useCallback(() => {
    setPendingTrack(null);
    clearTrack();
  }, [clearTrack]);

  // Action Toolbar: Mulai Menggambar
  const handleStartDraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (mode === 'draw') {
      map.pm.disableDraw();
      setMode('idle');
      return;
    }

    // Jika sedang edit, hentikan edit
    if (mode === 'edit' && activePolygonLayerRef.current) {
      activePolygonLayerRef.current.pm.disable();
    }

    setMode('draw');
    map.pm.enableDraw('Polygon', {
      snappable: true,
      snapDistance: 20,
      templineStyle: { color: selectedColor, weight: 2 },
      hintlineStyle: { color: selectedColor, dashArray: [5, 5] },
      pathOptions: {
        color: selectedColor,
        fillColor: selectedColor,
        fillOpacity: 0.25,
        weight: 3,
      },
    });
  }, [mode, selectedColor, setMode]);

  // Action Toolbar: Toggle Edit / Selesai Edit
  const handleToggleEdit = useCallback(() => {
    const polygon = activePolygonLayerRef.current;
    if (!polygon) return;

    if (mode === 'edit') {
      polygon.pm.disable();
      setMode('idle');
    } else {
      setMode('edit');
      polygon.pm.enable({
        allowSelfIntersection: false,
        snappable: true,
      });
    }
  }, [mode, setMode]);

  // Action Toolbar: Hapus / Reset
  const handleClear = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.pm.disableDraw();
    }
    if (activePolygonLayerRef.current) {
      activePolygonLayerRef.current.pm.disable();
      activePolygonLayerRef.current.remove();
      activePolygonLayerRef.current = null;
    }
    if (decorLayerGroupRef.current) {
      decorLayerGroupRef.current.clearLayers();
    }
    setGpsDraft([]);
    setPendingTrack(null);
    setUsedGps(false);
    clearTrack();
    resetMeasurement();
  }, [resetMeasurement, clearTrack]);

  // Action Simpan Lahan
  const handleSaveParcel = async (data: {
    name: string;
    owner?: string;
    description?: string;
    color: import('../../features/measurement/measurement.types').ParcelColor;
    measuredAt: string;
    measurementMethod: 'map_digitization' | 'gps_mobile' | 'combined';
    notes?: string;
  }) => {
    if (!measurement || !measurement.isValid) return;

    if (loadedParcelId) {
      await updateParcel(loadedParcelId, {
        ...data,
        geometry: measurement.geometry,
        areaM2: measurement.areaM2,
        areaAre: measurement.areaAre,
        areaHa: measurement.areaHa,
        perimeterM: measurement.perimeterM,
        centroid: measurement.centroid,
        controlPoints: measurement.controlPoints,
      });
    } else {
      const created = await createParcel({
        ...data,
        geometry: measurement.geometry,
        areaM2: measurement.areaM2,
        areaAre: measurement.areaAre,
        areaHa: measurement.areaHa,
        perimeterM: measurement.perimeterM,
        centroid: measurement.centroid,
        controlPoints: measurement.controlPoints,
      });
      setLoadedParcelId(created.id);
    }
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="geolahan-map h-full w-full"
        role="application"
        aria-label="Peta interaktif GeoLahan Pro"
      />

      {/* Floating Toolbar Pengukuran */}
      <MeasurementToolbar
        onStartDraw={handleStartDraw}
        onToggleEdit={handleToggleEdit}
        onClear={handleClear}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* Kontrol & Status GPS */}
      <GpsControls
        status={gps.status}
        fix={gps.fix}
        error={gps.error}
        isTracking={gps.isTracking}
        trackCount={gps.track.length}
        trackNotice={gps.trackNotice}
        pendingTrackCount={pendingTrack ? pendingTrack.length : null}
        onLocate={handleLocate}
        onAddPatok={handleAddGpsPatok}
        onToggleTrack={handleToggleTrack}
        onConfirmTrack={handleConfirmTrack}
        onDiscardTrack={handleDiscardTrack}
      />

      {/* Panel Hasil Pengukuran & Tabel Koordinat */}
      <MeasurementPanel />

      {/* Modal Simpan Lahan */}
      {isSaveModalOpen && (
        <SaveParcelModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveParcel}
          measurement={measurement}
          defaultMethod={usedGps ? 'gps_mobile' : undefined}
        />
      )}

      {tileErrorLayer && (
        <div
          role="status"
          className="absolute bottom-10 left-1/2 z-[500] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Sebagian tile peta gagal dimuat. Periksa koneksi internet atau coba layer lain.</span>
          <button
            type="button"
            onClick={() => setTileErrorLayer(null)}
            className="ml-1 rounded p-0.5 hover:bg-amber-200/60 dark:hover:bg-amber-800/60"
            aria-label="Tutup peringatan"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
