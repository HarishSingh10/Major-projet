import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident } from '../types';
import { useAppContext } from '../App';

// Fix for default Leaflet marker icons in standard build environments
// In a real bundler setup, these imports are handled differently, but for a standalone component:
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  incidents: Incident[];
  className?: string;
}

const IncidentMap: React.FC<MapProps> = ({ incidents, className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const { theme } = useAppContext();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([20, 0], 2);
    }
    
    const map = mapInstanceRef.current;

    // Tile Layer - Use a dark/light variant based on theme
    // Using CartoDB Positron (Light) and Dark Matter (Dark) for better aesthetics
    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    // Remove old layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

  }, [theme]); // Re-init tiles on theme change

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    incidents.forEach(incident => {
        const { lat, lng } = incident.location;
        
        let color = '#3b82f6'; // blue
        if (incident.severity === 'Critical') color = '#ef4444'; // red
        if (incident.severity === 'High') color = '#f97316'; // orange
        if (incident.severity === 'Medium') color = '#eab308'; // yellow

        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        const popupContent = `
            <div class="p-2 min-w-[200px]">
                <strong class="text-sm font-bold block mb-1">${incident.title}</strong>
                <span class="text-xs text-gray-500 block mb-2">${incident.date.split('T')[0]} • ${incident.location.city}</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 font-semibold">${incident.severity}</span>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
    });

  }, [incidents]);

  return <div ref={mapContainerRef} className={`w-full h-full rounded-xl z-0 ${className}`} />;
};

export default IncidentMap;