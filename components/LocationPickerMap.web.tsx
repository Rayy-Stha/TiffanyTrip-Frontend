import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LocationPickerMap({ onSelectLocation, initialLocation }: any) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [status, setStatus] = useState('loading');

  // Only use initial location once to keep map stable
  const initLat = useRef(initialLocation?.latitude ?? 27.7172);
  const initLng = useRef(initialLocation?.longitude ?? 85.3240);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        // Ensure Leaflet CSS is present
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Wait for Leaflet to be available
        let L = (window as any).L;
        if (!L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          L = (window as any).L;
        }

        if (L && mapContainerRef.current && !mapRef.current) {
          // Marker icon fix
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });

          const map = L.map(mapContainerRef.current, {
            zoomControl: true,
          }).setView([initLat.current, initLng.current], 15);

          mapRef.current = map;

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          const marker = L.marker([initLat.current, initLng.current], {
            draggable: true
          }).addTo(map);

          marker.bindPopup("<b>Bus Stop Pin</b><br>Drag to adjust").openPopup();

          // Initial notify
          if (onSelectLocation) {
            onSelectLocation({ latitude: initLat.current, longitude: initLng.current });
          }

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            if (onSelectLocation) {
              onSelectLocation({ latitude: pos.lat, longitude: pos.lng });
            }
          });

          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            if (onSelectLocation) {
              onSelectLocation({ latitude: lat, longitude: lng });
            }
          });

          setStatus('ready');
        }
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
        setStatus('error');
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <div
        ref={mapContainerRef as any}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          backgroundColor: '#e5e7eb',
          visibility: status === 'ready' ? 'visible' : 'hidden'
        }}
      />
      {status === 'loading' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.text}>Initialing Map...</Text>
        </View>
      )}
      {status === 'error' && (
        <View style={styles.overlay}>
          <Text style={[styles.text, { color: '#ef4444' }]}>Map Loading Failed</Text>
          <Text style={{ fontSize: 12 }}>Check your internet connection</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 400 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  text: { marginTop: 12, fontWeight: 'bold' }
});
