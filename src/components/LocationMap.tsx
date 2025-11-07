import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle, Quote, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 150);
    }
  }, [isFullscreen]);

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
        minZoom: 2,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: false,
        updateInterval: 200
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    const modernColors = [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#06b6d4',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#d946ef',
      '#14b8a6'
    ];

    locations.forEach((location, index) => {
      const colorIndex = index % modernColors.length;
      const color = modernColors[colorIndex];

      const svgIcon = `
        <div style="width: 32px; height: 48px; position: relative;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48" style="display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <path d="M12 0C7.589 0 4 3.589 4 8c0 6 8 16 8 16s8-10 8-16c0-4.411-3.589-8-8-8z"
                  fill="${color}"
                  stroke="#ffffff"
                  stroke-width="1.5"/>
            <circle cx="12" cy="8" r="3" fill="#ffffff"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: svgIcon,
        className: 'custom-marker',
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [0, -48]
      });

      const marker = L.marker([location.lat, location.lon], { icon: customIcon }).addTo(map);

      bounds.extend([location.lat, location.lon]);

      marker.bindPopup(`
        <div style="
          padding: 12px;
          background: #0f172a;
          border-radius: 8px;
          border: 1px solid #334155;
          min-width: 200px;
          max-width: 300px;
        ">
          <div style="
            font-weight: bold;
            color: white;
            margin-bottom: 4px;
            font-size: 14px;
          ">
            ${location.name}
          </div>
          ${location.context ? `
            <div style="
              color: #cbd5e1;
              font-size: 12px;
              margin-top: 4px;
              line-height: 1.4;
            ">
              ${location.context}
            </div>
          ` : ''}
        </div>
      `, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        setSelectedLocation(location);
      });
    });

    if (locations.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 6,
        animate: true,
        duration: 1.0
      });
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  }, [locations]);

  if (isLoading) {
    return (
      <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 bg-orange-400/20 rounded-full animate-ping" />
          </div>
          <p className="text-slate-700 text-lg font-medium">Discovering locations...</p>
          <p className="text-slate-500 text-sm">Mapping places mentioned in the episode</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 flex items-start gap-3 backdrop-blur-sm">
        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 font-semibold mb-1">Failed to load locations</p>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-white backdrop-blur-sm border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-700 font-medium">No locations mentioned</p>
        <p className="text-slate-500 text-sm mt-1">This episode doesn't reference specific places</p>
      </div>
    );
  }

  return (
    <div className={`relative group ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`} ref={containerRef}>
      <div className={`relative bg-white backdrop-blur-xl border border-slate-200 overflow-hidden shadow-sm ${isFullscreen ? 'h-screen w-screen' : 'rounded-2xl'}`}>
        {/* Header */}
        <div className="border-b border-slate-200 p-6 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Interactive Map</h3>
                <p className="text-sm text-slate-600">{locations.length} locations discovered</p>
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors group/btn"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-slate-700 group-hover/btn:text-slate-900" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-700 group-hover/btn:text-slate-900" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {/* Map Container - Full Width */}
          <div
            className="relative"
            style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '500px' }}
            ref={mapContainerRef}
          >
            {/* Map loads here */}
          </div>

          {/* Location List Below Map */}
          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {locations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedLocation(location);
                    if (mapInstanceRef.current) {
                      const L = (window as any).L;
                      const map = mapInstanceRef.current;
                      const currentZoom = map.getZoom();

                      const targetZoom = Math.min(8, Math.max(currentZoom, 6));

                      map.flyTo([location.lat, location.lon], targetZoom, {
                        duration: 1.2,
                        easeLinearity: 0.25,
                        animate: true
                      });
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-300 group/location ${
                    selectedLocation === location
                      ? 'bg-orange-100 border-2 border-orange-500 shadow-sm'
                      : 'bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        selectedLocation === location ? 'scale-110' : 'group-hover/location:scale-110'
                      } transition-transform duration-300`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-1 ${
                        selectedLocation === location ? 'text-orange-700' : 'text-slate-900'
                      }`}>
                        {location.name}
                      </div>
                      {location.context && (
                        <div className="text-xs text-slate-600 line-clamp-2">
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
    </div>
  );
}
