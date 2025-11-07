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
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

    locations.forEach((location, index) => {
      const customIcon = L.divIcon({
        html: `<div style="width: 40px; height: 40px; border-radius: 50%; background: #f97316; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="color: white; font-weight: bold; font-size: 14px;">${index + 1}</span></div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([location.lat, location.lon], {
        icon: customIcon
      }).addTo(map);

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
      // Constrain initial zoom to prevent over-zooming on single locations
      // Use maxZoom: 6 for a cleaner, less aggressive initial view
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 6,
        animate: true,
        duration: 1.0
      });
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
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 bg-orange-400/20 rounded-full animate-ping" />
          </div>
          <p className="text-slate-300 text-lg font-medium">Discovering locations...</p>
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
      <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-300 font-medium">No locations mentioned</p>
        <p className="text-slate-500 text-sm mt-1">This episode doesn't reference specific places</p>
      </div>
    );
  }

  return (
    <div className={`relative group ${isFullscreen ? 'h-screen w-screen bg-slate-900' : ''}`} ref={containerRef}>
      {/* Animated gradient background */}
      {!isFullscreen && (
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
      )}

      <div className={`relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 overflow-hidden shadow-2xl ${isFullscreen ? 'h-full w-full' : 'rounded-2xl'}`}>
        {/* Header */}
        <div className="border-b border-slate-700/50 p-6 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl blur-md opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Interactive Map</h3>
                <p className="text-sm text-slate-400">{locations.length} locations discovered</p>
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg transition-colors group/btn"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-slate-300 group-hover/btn:text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-300 group-hover/btn:text-white" />
              )}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-0 ${isFullscreen ? 'lg:grid-cols-4 h-[calc(100vh-80px)]' : 'lg:grid-cols-3'}`}>
          {/* Map Container - Full Width on Large Screens */}
          <div className={`relative ${isFullscreen ? 'lg:col-span-3 h-full' : 'lg:col-span-2 h-[500px]'}`} ref={mapContainerRef}>
            {/* Map loads here */}
          </div>

          {/* Location List Sidebar */}
          <div className={`border-t lg:border-t-0 lg:border-l border-slate-700/50 bg-slate-900/50 p-4 overflow-y-auto ${isFullscreen ? 'h-full' : 'max-h-[500px]'}`}>
            <div className="space-y-2">
              {locations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedLocation(location);
                    if (mapInstanceRef.current) {
                      const L = (window as any).L;
                      const map = mapInstanceRef.current;
                      const currentZoom = map.getZoom();

                      // Keep zoom level modest - only zoom to level 8 instead of 12
                      // This prevents excessive zooming that causes tile rendering issues
                      const targetZoom = Math.min(8, Math.max(currentZoom, 6));

                      // Simple, smooth pan with minimal zoom change
                      map.flyTo([location.lat, location.lon], targetZoom, {
                        duration: 1.2,
                        easeLinearity: 0.25,
                        animate: true
                      });
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 group/location ${
                    selectedLocation === location
                      ? 'bg-orange-500/20 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-800/50 border-2 border-transparent hover:bg-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                        selectedLocation === location ? 'scale-110' : 'group-hover/location:scale-110'
                      } transition-transform duration-300`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-1 ${
                        selectedLocation === location ? 'text-orange-300' : 'text-white'
                      }`}>
                        {location.name}
                      </div>
                      {location.context && (
                        <div className="text-xs text-slate-400 mb-2">
                          {location.context}
                        </div>
                      )}
                      {location.quotes && location.quotes.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {location.quotes.slice(0, 1).map((quote, qIndex) => (
                            <div key={qIndex} className="relative pl-3 border-l-2 border-orange-500/30 bg-slate-900/50 rounded-r p-1.5">
                              <Quote className="w-2.5 h-2.5 text-orange-400/50 absolute top-1.5 left-0.5" />
                              <p className="text-xs text-slate-500 italic leading-tight line-clamp-2">
                                "{quote}"
                              </p>
                            </div>
                          ))}
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
