import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle, Quote, Maximize2, Minimize2 } from 'lucide-react';
import type { GeocodedLocation } from '../services/geocodingService';

interface LocationMapProps {
  locations: GeocodedLocation[];
  isLoading?: boolean;
  error?: string | null;
  /** When false, hide the built-in side panel/list so the page can render its own overlay */
  showSidePanel?: boolean;
  /** Custom non-fullscreen height for the map container (e.g., 'calc(100vh - 158px)') */
  mapHeight?: string;
}

export default function LocationMap({ locations, isLoading, error, showSidePanel = true, mapHeight }: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // When fullscreen or locations change, invalidate map size
  useEffect(() => {
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  }, [isFullscreen, locations]);

  useEffect(() => {
    if (!mapContainerRef.current || locations.length === 0) {
      console.log('🗺️ Map rendering skipped:', {
        hasContainer: !!mapContainerRef.current,
        locationCount: locations.length
      });
      return;
    }

    const L = (window as any).L;
    if (!L) {
      console.error('❌ Leaflet library not loaded');
      return;
    }

    console.log('🗺️ Starting map rendering:', {
      locationCount: locations.length,
      locations: locations.map((loc, idx) => ({
        index: idx + 1,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon
      }))
    });

    if (!mapInstanceRef.current) {
      console.log('📍 Creating new map instance');
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true,
        zoomControl: false
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

    let markerCount = 0;
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
        markerCount++;
      }
    });
    console.log(`🧹 Removed ${markerCount} existing markers`);

    const bounds = L.latLngBounds([]);
    const markersAdded: any[] = [];

    locations.forEach((location, index) => {
      try {
        console.log(`📌 Creating marker ${index + 1}/${locations.length}:`, {
          name: location.name,
          lat: location.lat,
          lon: location.lon,
          hasContext: !!location.context
        });

        const customIcon = L.divIcon({
          className: 'custom-marker-icon',
          html: `
            <div style="
              width: 44px;
              height: 44px;
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
              border: 3px solid white;
              cursor: pointer;
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 6px 16px rgba(249, 115, 22, 0.5), 0 3px 6px rgba(0, 0, 0, 0.4)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(249, 115, 22, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)';">
              ${index + 1}
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22]
        });

        const marker = L.marker([location.lat, location.lon], { icon: customIcon }).addTo(map);
        markersAdded.push(marker);

        bounds.extend([location.lat, location.lon]);

        const escapedName = location.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const escapedContext = location.context ? location.context.replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';

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
              ${escapedName}
            </div>
            ${location.context ? `
              <div style="
                color: #cbd5e1;
                font-size: 12px;
                margin-top: 4px;
                line-height: 1.4;
              ">
                ${escapedContext}
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

        console.log(`✅ Marker ${index + 1} added successfully`);
      } catch (error) {
        console.error(`❌ Failed to create marker ${index + 1}:`, error);
      }
    });

    console.log(`🎯 Total markers added to map: ${markersAdded.length}/${locations.length}`);

    if (locations.length > 0 && bounds.isValid()) {
      console.log('🗺️ Fitting map bounds to show all markers');
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
        console.log('📐 Map size invalidated and refreshed');
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
        {/* Map Container - full width when side panel hidden */}
        <div
          className="relative w-full"
          style={{ height: isFullscreen ? 'calc(100vh - 70px)' : (mapHeight || 'calc(100vh - 250px)'), minHeight: '400px' }}
          ref={mapContainerRef}
        />

        {/* Fullscreen toggle - top-left */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 left-6 p-2 bg-white/90 hover:bg-white border border-slate-300 rounded-lg transition-colors z-[1001]"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-slate-700" />
          ) : (
            <Maximize2 className="w-5 h-5 text-slate-700" />
          )}
        </button>

        {/* Zoom controls - bottom-left */}
        <div className="absolute left-6 bottom-6 flex gap-2 z-[1001]">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-10 rounded-full bg-white/90 text-slate-800 border border-slate-300 hover:bg-white transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-10 rounded-full bg-white/90 text-slate-800 border border-slate-300 hover:bg-white transition-colors"
            aria-label="Zoom out"
          >
            –
          </button>
        </div>

        {/* Optional built-in side panel/list */}
        {showSidePanel && (
          <div
            className="hidden lg:block absolute right-6 top-6 z-[1000] w-[380px] rounded-2xl bg-white/90 backdrop-blur border border-slate-300 shadow-2xl"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 140px)' : 'calc(100vh - 320px)' }}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">
                  {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
                </span>
              </div>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'inherit' }}>
              <div className="grid grid-cols-1 gap-3">
                {locations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedLocation(location);
                      if (mapInstanceRef.current) {
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
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 group/location ${
                      selectedLocation === location
                        ? 'bg-orange-100 border-2 border-orange-500 shadow-sm'
                        : 'bg-white border-2 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
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
                          <div className="text-xs text-slate-600 line-clamp-3">
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
        )}
      </div>
    </div>
  );
}