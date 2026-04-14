import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface Stop {
    name: string;
    lat: number;
    lng: number;
    arrivalTime: string;
}

interface StopsMapViewProps {
    stops: Stop[];
    onSelectStop?: (stop: Stop) => void;
}

export default function StopsMapView({ stops, onSelectStop }: StopsMapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markerRefs = useRef<any[]>([]);
    const [status, setStatus] = useState('loading');

    // Only render map logic strictly if window and doc exists
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const validStops = stops.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng));

        const initMap = async () => {
            try {
                // Leaflet CSS
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

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

                if (L && mapContainerRef.current) {
                    let map = mapRef.current;

                    // If map wasn't created yet or was destroyed during unmount
                    if (!map) {
                        map = L.map(mapContainerRef.current, { zoomControl: false });
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                        mapRef.current = map;
                    }

                    // Clear previous markers & lines on update
                    map.eachLayer((layer: any) => {
                        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                            map.removeLayer(layer);
                        }
                    });
                    markerRefs.current = [];

                    if (validStops.length === 0) {
                        map.setView([27.7172, 85.3240], 12);
                        setStatus('ready');
                        return;
                    }

                    const latlngs = validStops.map(s => [s.lat, s.lng]);

                    // Add custom style block for web just in case
                    if (!document.getElementById('custom-map-styles')) {
                        const style = document.createElement('style');
                        style.id = 'custom-map-styles';
                        style.innerHTML = `
                            .stop-label-web {
                                background: white; border-radius: 4px; padding: 2px 6px;
                                font-family: sans-serif; font-weight: bold; font-size: 12px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.3); white-space: nowrap;
                                position: absolute; top: 15px; left: 50%; transform: translateX(-50%);
                            }
                            .marker-core-web {
                                width: 16px; height: 16px; background-color: #3B82F6;
                                border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                            }
                            .custom-div-icon-web { background: transparent; border: none; }
                        `;
                        document.head.appendChild(style);
                    }

                    let lastSelectedIdx = -1;

                    validStops.forEach((stop, idx) => {
                        const htmlNormal = `<div class="marker-core-web"></div><div class="stop-label-web">${stop.name}</div>`;
                        const htmlSelected = `<div class="marker-core-web" style="background-color: #F59E0B; transform: translate(-50%, -50%) scale(1.3);"></div><div class="stop-label-web">${stop.name}</div>`;

                        const icon = L.divIcon({ className: 'custom-div-icon-web', html: htmlNormal, iconSize: [0, 0], iconAnchor: [0, 0] });
                        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);

                        markerRefs.current.push(marker);

                        marker.on('click', () => {
                            if (lastSelectedIdx > -1) {
                                const oldHtml = `<div class="marker-core-web"></div><div class="stop-label-web">${validStops[lastSelectedIdx].name}</div>`;
                                markerRefs.current[lastSelectedIdx].setIcon(L.divIcon({ className: 'custom-div-icon-web', html: oldHtml, iconSize: [0, 0], iconAnchor: [0, 0] }));
                            }

                            lastSelectedIdx = idx;
                            marker.setIcon(L.divIcon({ className: 'custom-div-icon-web', html: htmlSelected, iconSize: [0, 0], iconAnchor: [0, 0] }));
                            map.panTo([stop.lat, stop.lng], { animate: true, duration: 0.4 });

                            if (onSelectStop) {
                                onSelectStop(stop);
                            }
                        });
                    });

                    map.fitBounds(latlngs, { padding: [40, 40] });
                    setStatus('ready');
                }
            } catch (err) {
                console.error('Failed to load Leaflet:', err);
                setStatus('error');
            }
        };

        // Needs short delay to ensure DOM layout is calculated if wrapped inside a nav tab
        setTimeout(initMap, 50);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [stops, onSelectStop]);

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
                    <Text style={styles.text}>Loading Map Interface...</Text>
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
