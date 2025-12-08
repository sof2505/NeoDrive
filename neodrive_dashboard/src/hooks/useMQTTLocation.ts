import { useState, useEffect } from 'react';

interface MQTTLocation {
  latitude: number | null;
  longitude: number | null;
  lastUpdate: Date | null;
}

export const useMQTTLocation = () => {
  const [location, setLocation] = useState<MQTTLocation>({
    latitude: null,
    longitude: null,
    lastUpdate: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const brokerUrl = supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/functions/v1/mqtt-bridge';
    
    console.log('Connecting to MQTT bridge for GPS location:', brokerUrl);
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let tempLat: number | null = null;
    let tempLon: number | null = null;
    
    const connect = () => {
      try {
        ws = new WebSocket(brokerUrl);
        try { (ws as any).binaryType = 'arraybuffer'; } catch { /* no-op */ }
        
        ws.onopen = () => {
          console.log('Connected to MQTT bridge for GPS data');
          setIsConnected(true);
          setError(null);
        };
        
        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);
              if (msg?.type === 'mqtt_open') {
                console.log('✅ Bridge connected. Subscribing to GPS topics...');
                
                // Send MQTT CONNECT packet
                const username = 'damar-marin';
                const password = 'MegaBeedrillYeet89!';
                const clientId = 'lovable_gps_' + Math.random().toString(16).slice(2, 10);

                const encoder = new TextEncoder();
                const protoName = encoder.encode('MQTT');
                const clientIdBytes = encoder.encode(clientId);
                const usernameBytes = encoder.encode(username);
                const passwordBytes = encoder.encode(password);

                const payloadLength =
                  2 + clientIdBytes.length +
                  2 + usernameBytes.length +
                  2 + passwordBytes.length;
                const variableHeaderLength = 6 + protoName.length; // 2 (len) + proto + 1 (level) + 1 (flags) + 2 (keepalive)
                const remainingLength = variableHeaderLength + payloadLength;

                if (remainingLength > 127) {
                  console.error('❌ MQTT CONNECT packet too large:', remainingLength);
                  return;
                }

                const connectPacket = new Uint8Array(2 + remainingLength);
                let offset = 0;

                // Fixed header
                connectPacket[offset++] = 0x10; // CONNECT packet type
                connectPacket[offset++] = remainingLength;

                // Variable header
                connectPacket[offset++] = 0x00;
                connectPacket[offset++] = protoName.length;
                connectPacket.set(protoName, offset);
                offset += protoName.length;

                connectPacket[offset++] = 0x04; // Protocol level 4 (MQTT 3.1.1)
                connectPacket[offset++] = 0xc2; // Username + Password + Clean Session

                connectPacket[offset++] = 0x00;
                connectPacket[offset++] = 0x3c; // Keep Alive = 60s

                const writeField = (bytes: Uint8Array) => {
                  connectPacket[offset++] = (bytes.length >> 8) & 0xff;
                  connectPacket[offset++] = bytes.length & 0xff;
                  connectPacket.set(bytes, offset);
                  offset += bytes.length;
                };

                writeField(clientIdBytes);
                writeField(usernameBytes);
                writeField(passwordBytes);

                ws!.send(connectPacket);

                // Subscribe to latitude topic
                const latTopic = 'RoboCaroLogic/lat';
                const latTopicBytes = new TextEncoder().encode(latTopic);
                const latSubscribePacket = new Uint8Array([
                  0x82, 2 + 2 + latTopicBytes.length + 1,
                  0x00, 0x01, 0x00, latTopicBytes.length,
                  ...latTopicBytes, 0x00
                ]);
                ws!.send(latSubscribePacket);
                console.log('📡 Subscribed to', latTopic);

                // Subscribe to longitude topic
                const lonTopic = 'RoboCaroLogic/lon';
                const lonTopicBytes = new TextEncoder().encode(lonTopic);
                const lonSubscribePacket = new Uint8Array([
                  0x82, 2 + 2 + lonTopicBytes.length + 1,
                  0x00, 0x02, 0x00, lonTopicBytes.length,
                  ...lonTopicBytes, 0x00
                ]);
                ws!.send(lonSubscribePacket);
                console.log('📡 Subscribed to', lonTopic);
              } else if (msg?.type === 'mqtt_error') {
                console.error('❌ Bridge MQTT error:', msg.message || msg);
                setError('Bridge MQTT error');
              }
            } catch (e) {
              console.log('ℹ️ Non-JSON text from bridge');
            }
            return;
          }

          try {
            const handleBuffer = (buffer: ArrayBuffer) => {
              const data = new Uint8Array(buffer);
              
              if (data[0] >> 4 === 3) { // PUBLISH packet
                let pos = 1;
                pos += 1;
                const topicLen = (data[pos] << 8) | data[pos + 1];
                pos += 2;
                const receivedTopic = new TextDecoder().decode(data.slice(pos, pos + topicLen));
                pos += topicLen;
                const payload = new TextDecoder().decode(data.slice(pos));

                console.log('📡 MQTT Message Received:');
                console.log('  Topic:', receivedTopic);
                console.log('  Payload:', payload);
                console.log('  Raw data:', data);

                if (receivedTopic === 'RoboCaroLogic/lat') {
                  const lat = parseFloat(payload);
                  if (!isNaN(lat)) {
                    tempLat = lat;
                    console.log('✅ Latitude updated:', lat);
                    
                    // Update location if we have both coordinates
                    if (tempLon !== null) {
                      setLocation({
                        latitude: tempLat,
                        longitude: tempLon,
                        lastUpdate: new Date(),
                      });
                    }
                  }
                } else if (receivedTopic === 'RoboCaroLogic/lon') {
                  const lon = parseFloat(payload);
                  if (!isNaN(lon)) {
                    tempLon = lon;
                    console.log('✅ Longitude updated:', lon);
                    
                    // Update location if we have both coordinates
                    if (tempLat !== null) {
                      setLocation({
                        latitude: tempLat,
                        longitude: tempLon,
                        lastUpdate: new Date(),
                      });
                    }
                  }
                }
              }
            };

            if (event.data instanceof ArrayBuffer) {
              handleBuffer(event.data as ArrayBuffer);
            } else if (event.data instanceof Blob) {
              event.data.arrayBuffer().then(handleBuffer);
            }
          } catch (err) {
            console.error('❌ Error parsing GPS message:', err);
          }
        };
        
        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          setError('Connection error');
          setIsConnected(false);
        };
        
        ws.onclose = () => {
          console.log('WebSocket closed, reconnecting...');
          setIsConnected(false);
          reconnectTimeout = setTimeout(() => connect(), 5000);
        };
      } catch (err) {
        console.error('Connection error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        reconnectTimeout = setTimeout(() => connect(), 5000);
      }
    };
    
    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return { location, isConnected, error };
};
