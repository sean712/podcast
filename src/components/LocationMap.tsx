import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import type { GeocodedLocation } from '../services/geocodingService';

interface LocationMapProps {
  locations: GeocodedLocation[];
  isLoading?: boolean;
  error?: string | null;
}

export default function LocationMap({ locations, isLoading, error }: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || locations.length === 0) return;

    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true
      }).setView([20, 0], 2);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
        keepBuffer: 4,
        updateWhenIdle: false,
        updateWhenZooming: true,
        updateInterval: 100
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    locations.forEach((location, index) => {
      const marker = L.marker([location.lat, location.lon], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full border-2 border-white shadow-lg text-white font-semibold text-xs">${index + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(map);

      bounds.extend([location.lat, location.lon]);

      marker.bindPopup(`
        <div class="p-2">
          <div class="font-semibold text-gray-900">${location.name}</div>
          ${location.context ? `<div class="text-sm text-gray-600 mt-1">${location.context}</div>` : ''}
        </div>
      `);

      marker.on('click', () => {
        setSelectedLocation(location);
      });
    });

    if (locations.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-gray-600">Extracting locations from transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 font-medium">Failed to load locations</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No locations found in this transcript</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-white">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
            Locations Mentioned ({locations.length})
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        <div className="lg:col-span-2 h-[500px]" ref={mapContainerRef}></div>

        <div className="border-t lg:border-t-0 lg:border-l border-gray-200 p-4 overflow-y-auto max-h-[500px]">
          <div className="space-y-2">
            {locations.map((location, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedLocation(location);
                  if (mapInstanceRef.current) {
                    const L = (window as any).L;
                    const map = mapInstanceRef.current;
                    const currentCenter = map.getCenter();
                    const currentZoom = map.getZoom();
                    const targetZoom = 12;
                    const intermediateZoom = Math.max(5, currentZoom - 2);

                    const distance = map.distance(
                      [currentCenter.lat, currentCenter.lng],
                      [location.lat, location.lon]
                    );

                    const distanceThreshold = 500000;

                    if (distance > distanceThreshold) {
                      map.flyTo([currentCenter.lat, currentCenter.lng], intermediateZoom, {
                        duration: 1.5,
                        easeLinearity: 0.1,
                        noMoveStart: false
                      });

                      setTimeout(() => {
                        map.flyTo([location.lat, location.lon], targetZoom, {
                          duration: 2.5,
                          easeLinearity: 0.1,
                          noMoveStart: false
                        });
                      }, 1500);
                    } else {
                      map.flyTo([location.lat, location.lon], targetZoom, {
                        duration: 2.5,
                        easeLinearity: 0.1,
                        noMoveStart: false
                      });
                    }
                  }
                }}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedLocation === location
                    ? 'bg-emerald-50 border-2 border-emerald-400 shadow-sm'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">
                      {location.name}
                    </div>
                    {location.context && (
                      <div className="text-xs text-gray-600 mt-1">
                        {location.context}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
