import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function LocationPickerMap({ onSelectLocation, initialLocation }: any) {
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Get stable initial coordinates to prevent WebView reloads
  const initLat = useMemo(() => initialLocation?.latitude ?? 27.7172, []);
  const initLng = useMemo(() => initialLocation?.longitude ?? 85.3240, []);

  // Stabilize the HTML source
  const leafletHtml = useMemo(() => `
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
        .leaflet-div-icon {
            background: #3B82F6; border: 2px solid white; border-radius: 50%;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        (function() {
            var map;
            var marker;
            function init() {
                if (typeof L === 'undefined') {
                    setTimeout(init, 50);
                    return;
                }
                map = L.map('map', { zoomControl: false }).setView([${initLat}, ${initLng}], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                
                marker = L.marker([${initLat}, ${initLng}], { draggable: true }).addTo(map);
                
                function send(data) {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify(data));
                    }
                }

                marker.on('dragend', function() {
                    var p = marker.getLatLng();
                    send({ latitude: p.lat, longitude: p.lng });
                });

                map.on('click', function(e) {
                    marker.setLatLng(e.latlng);
                    send({ latitude: e.latlng.lat, longitude: e.latlng.lng });
                });

                send({ type: 'READY' });
            }
            init();
        })();
    </script>
</body>
</html>
    `, [initLat, initLng]);

  const source = useMemo(() => ({ html: leafletHtml }), [leafletHtml]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setLoading(false);
      } else if (onSelectLocation && data.latitude !== undefined) {
        onSelectLocation(data);
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
          <Text style={{ marginTop: 8, color: '#6B7280' }}>Loading Map...</Text>
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
