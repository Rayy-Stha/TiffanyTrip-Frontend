import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

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
    const webViewRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);

    const validStops = useMemo(() => stops.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng)), [stops]);

    const leafletHtml = useMemo(() => {
        const stopsJson = JSON.stringify(validStops);
        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            * { margin:0; padding:0; }
            body { overflow: hidden; background: #ffffff; }
            #map { height: 100vh; width: 100vw; }
            .stop-label {
                background: white;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: sans-serif;
                font-weight: bold;
                font-size: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                white-space: nowrap;
                position: absolute;
                top: 15px; /* Offset label below marker */
                left: 50%;
                transform: translateX(-50%);
            }
            .leaflet-div-icon {
                background: transparent;
                border: none;
            }
            .marker-core {
                width: 16px;
                height: 16px;
                background-color: #3B82F6;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            .marker-selected .marker-core {
                background-color: #F59E0B;
                transform: translate(-50%, -50%) scale(1.3);
                border: 3px solid white;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            (function() {
                var map;
                var stops = ${stopsJson};
                var markers = [];
                var selectedMarkerIndex = -1;

                function send(data) {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify(data));
                    }
                }

                function init() {
                    if (typeof L === 'undefined') {
                        setTimeout(init, 50);
                        return;
                    }

                    if (stops.length === 0) {
                        map = L.map('map', { zoomControl: false }).setView([27.7172, 85.3240], 12);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                        send({ type: 'READY' });
                        return;
                    }

                    map = L.map('map', { zoomControl: false });
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

                    var latlngs = stops.map(function(s) { return [s.lat, s.lng]; });

                    // Plot markers
                    stops.forEach(function(s, index) {
                        var html = '<div class="marker-core"></div><div class="stop-label">' + s.name + '</div>';
                        var icon = L.divIcon({
                            className: 'custom-div-icon',
                            html: html,
                            iconSize: [0, 0], // Center exactly on lat/lng coordinate
                            iconAnchor: [0,0]
                        });
                        
                        var marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(map);
                        markers.push(marker);

                        marker.on('click', function(e) {
                            // Update styles
                            if(selectedMarkerIndex > -1){
                                var oldHtml = '<div class="marker-core"></div><div class="stop-label">' + stops[selectedMarkerIndex].name + '</div>';
                                markers[selectedMarkerIndex].setIcon(L.divIcon({ className: 'custom-div-icon', html: oldHtml, iconSize: [0,0], iconAnchor: [0,0] }));
                            }
                            selectedMarkerIndex = index;
                            var newHtml = '<div class="marker-core" style="background-color: #F59E0B; transform: translate(-50%, -50%) scale(1.3);"></div><div class="stop-label">' + s.name + '</div>';
                            marker.setIcon(L.divIcon({ className: 'custom-div-icon', html: newHtml, iconSize: [0,0], iconAnchor: [0,0] }));

                            // Pan nicely to the selected stop
                            map.panTo([s.lat, s.lng], { animate: true, duration: 0.4 });

                            // Send data back
                            send(s);
                        });
                    });

                    // Auto-zoom to fit the route
                    map.fitBounds(latlngs, { padding: [40, 40] });

                    send({ type: 'READY' });
                }
                init();
            })();
        </script>
    </body>
    </html>
        `;
    }, [validStops]);

    const source = useMemo(() => ({ html: leafletHtml }), [leafletHtml]);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'READY') {
                setLoading(false);
            } else if (onSelectStop && data.name) {
                // Must be a stop click
                onSelectStop(data);
            }
        } catch (e) { }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={source}
                onMessage={handleMessage}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
            />
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={{ marginTop: 8, color: '#6B7280' }}>Loading Map View...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    map: { flex: 1 },
    loader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }
});
