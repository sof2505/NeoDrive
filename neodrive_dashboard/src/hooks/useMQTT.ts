import { useEffect, useState, useCallback } from 'react';

export const useMQTT = (brokerUrl: string, topic: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Connecting to backend MQTT bridge:', brokerUrl);
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const connect = () => {
      try {
        ws = new WebSocket(brokerUrl);
        // Ensure we receive binary frames as ArrayBuffer for easier parsing
        try { (ws as any).binaryType = 'arraybuffer'; } catch { /* no-op */ }
        
        ws.onopen = () => {
          console.log('Connected to MQTT bridge (browser WS open). Waiting for backend MQTT connect...');
          setIsConnected(true);
          setError(null);
          // Do NOT send MQTT frames yet. We wait for the bridge to confirm
          // that its upstream MQTT connection is open (type: 'mqtt_open').
        };
        
        ws.onmessage = (event) => {
          // Control messages from the bridge (JSON strings)
          if (typeof event.data === 'string') {
            console.log('🧭 Control message from bridge:', event.data);
            try {
              const msg = JSON.parse(event.data);
              if (msg?.type === 'mqtt_open') {
                console.log('✅ Bridge connected to upstream MQTT at', msg.url || '(unknown). Sending CONNECT + SUBSCRIBE...');
                // Send MQTT CONNECT packet now that upstream is ready
                const connectPacket = new Uint8Array([
                  0x10, 0x10, 0x00, 0x04, 0x4d, 0x51, 0x54, 0x54,
                  0x04, 0x02, 0x00, 0x3c, 0x00, 0x04,
                  0x64, 0x65, 0x6e, 0x6f // "deno"
                ]);
                ws!.send(connectPacket);

                const topicBytes = new TextEncoder().encode(topic);
                const subscribePacket = new Uint8Array([
                  0x82, 2 + 2 + topicBytes.length + 1,
                  0x00, 0x01, 0x00, topicBytes.length,
                  ...topicBytes, 0x00
                ]);
                ws!.send(subscribePacket);
                console.log('📡 Subscribed to', topic);
              } else if (msg?.type === 'mqtt_error') {
                console.error('❌ Bridge MQTT error:', msg.message || msg);
                setError('Bridge MQTT error');
              } else if (msg?.type === 'mqtt_close') {
                console.warn('⚠️ Bridge MQTT closed:', msg);
              }
            } catch (e) {
              console.log('ℹ️ Non-JSON text from bridge');
            }
            return;
          }

          console.log('📨 Raw message from bridge (binary):', event.data);
          try {
            const handleBuffer = (buffer: ArrayBuffer) => {
              const data = new Uint8Array(buffer);
              console.log('📦 Parsed as Uint8Array:', data);
              console.log('🔍 First byte (packet type):', data[0], 'hex:', data[0].toString(16));

              if (data[0] >> 4 === 3) { // PUBLISH packet
                console.log('✅ Detected PUBLISH packet');
                let pos = 1;
                pos += 1;
                const topicLen = (data[pos] << 8) | data[pos + 1];
                pos += 2;
                const receivedTopic = new TextDecoder().decode(data.slice(pos, pos + topicLen));
                pos += topicLen;
                const payload = new TextDecoder().decode(data.slice(pos));

                console.log('📝 Topic:', receivedTopic, 'Payload:', payload);

                if (receivedTopic === topic) {
                  console.log('✅ Topic matches! Setting message:', payload);
                  setLastMessage(payload);
                } else {
                  console.log('⚠️ Topic mismatch. Expected:', topic, 'Got:', receivedTopic);
                }
              } else {
                console.log('ℹ️ Non-PUBLISH packet type:', data[0] >> 4);
              }
            };

            if (event.data instanceof ArrayBuffer) {
              handleBuffer(event.data as ArrayBuffer);
            } else if (event.data instanceof Blob) {
              event.data.arrayBuffer().then(handleBuffer);
            }
          } catch (err) {
            console.error('❌ Error parsing message:', err);
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
  }, [brokerUrl, topic]);

  const publish = useCallback((publishTopic: string, message: string) => {
    console.log('Publish not implemented yet:', publishTopic, message);
  }, []);

  return { isConnected, lastMessage, error, publish };
};
