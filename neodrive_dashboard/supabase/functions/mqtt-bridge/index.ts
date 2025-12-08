import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  console.log("Browser WebSocket connected");

  // Connect to MQTT broker via WebSocket
  let mqttWs: WebSocket | null = null;
  
  try {
    const connectToBroker = (url: string) => {
      console.log("Connecting to MQTT broker at", url);
      mqttWs = new WebSocket(url, ["mqtt"]);

      mqttWs.onopen = () => {
        console.log("✅ Connected to MQTT broker successfully:", url);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "mqtt_open", url }));
        }
      };

      // Forward all messages from MQTT broker to browser
      mqttWs.onmessage = (event) => {
        console.log("📨 Received from MQTT broker:", {
          dataType: typeof event.data,
          dataSize: event.data instanceof ArrayBuffer ? event.data.byteLength : event.data?.length || 0,
        });

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
          console.log("📤 Forwarded to browser");
        } else {
          console.log("⚠️ Cannot forward - browser socket not open");
        }
      };

      mqttWs.onerror = (error) => {
        console.error("MQTT WebSocket error:", error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "mqtt_error", message: "MQTT connection failed" }));
        }
      };

      mqttWs.onclose = (evt) => {
        console.log("MQTT WebSocket closed", { code: (evt as any).code, reason: (evt as any).reason });
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "mqtt_close", code: (evt as any).code, reason: (evt as any).reason }));
        }
      };
    };

    // Connect to HiveMQ Cloud broker
    connectToBroker("wss://6b607be206fa457eb32cdac5f4e806f8.s1.eu.hivemq.cloud:8884/mqtt");

  } catch (error) {
    console.error("Error setting up MQTT connection:", error);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "mqtt_error", message: "Failed to initialize MQTT connection" }));
    }
  }

  // Forward all binary messages from browser to MQTT broker
  socket.onmessage = (event) => {
    console.log("📥 Received from browser:", {
      dataType: typeof event.data,
      dataSize: event.data instanceof ArrayBuffer ? event.data.byteLength : event.data?.length || 0
    });
    
    if (mqttWs && mqttWs.readyState === WebSocket.OPEN) {
      mqttWs.send(event.data);
      console.log("📤 Forwarded to MQTT broker");
    } else {
      console.log("⚠️ Cannot forward - MQTT socket not open");
    }
  };

  socket.onclose = () => {
    console.log("Browser WebSocket closed");
    mqttWs?.close();
  };

  socket.onerror = (error) => {
    console.error("Browser WebSocket error:", error);
  };

  return response;
});
