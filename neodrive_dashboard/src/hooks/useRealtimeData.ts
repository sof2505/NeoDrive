import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

export interface RealtimeData {
  force: number;
  mvc: number;
  cov: number;
  rfd: number;
  tremorPower: number;
  tremorFreq: number;
  temperature: number;
  tempRate: number;
  thermalEnergy: number;
  fatigueIndex: number;
  fatigueStatus: 'OK' | 'FATIGA' | 'CRÍTICO';
  pidSetpoint: number;
  pidOutput: number;
  timestamp: number;
}

export interface ForceDataPoint {
  time: number;
  force: number;
}

export interface TremorSpectrum {
  frequency: number;
  power: number;
}

export const useRealtimeData = () => {
  const [mqttConnected, setMqttConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [mqttError, setMqttError] = useState<string | null>(null);

  const [data, setData] = useState<RealtimeData>({
    force: 0,
    mvc: 55,
    cov: 12,
    rfd: 850,
    tremorPower: 0.15,
    tremorFreq: 7.2,
    temperature: 32.5,
    tempRate: 0.08,
    thermalEnergy: 145,
    fatigueIndex: 35,
    fatigueStatus: 'OK',
    pidSetpoint: 50,
    pidOutput: 0,
    timestamp: Date.now(),
  });

  const [forceHistory, setForceHistory] = useState<ForceDataPoint[]>([]);
  const [tremorSpectrum, setTremorSpectrum] = useState<TremorSpectrum[]>([]);
  
  // Use refs to access current values without causing effect re-runs
  const dataRef = useRef(data);
  const forceHistoryRef = useRef<ForceDataPoint[]>([]);
  
  useEffect(() => {
    // Connect to HiveMQ Cloud via WebSocket
    console.log('🔌 Connecting to HiveMQ Cloud: wss://6b607be206fa457eb32cdac5f4e806f8.s1.eu.hivemq.cloud:8884/mqtt');
    const client = mqtt.connect('wss://6b607be206fa457eb32cdac5f4e806f8.s1.eu.hivemq.cloud:8884/mqtt', {
      clientId: 'lovable_client_' + Math.random().toString(16).substr(2, 8),
      username: 'damar-marin',
      password: 'MegaBeedrillYeet89!',
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      setMqttConnected(true);
      setMqttError(null);
      client.subscribe('RoboCaroLogic/forceSensor', (err) => {
        if (err) {
          console.error('❌ Subscribe error:', err);
          setMqttError('Subscribe failed');
        } else {
          console.log('📡 Subscribed to RoboCaroLogic/forceSensor');
        }
      });
    });

    client.on('message', (topic, message) => {
      console.log('📨 MQTT message:', topic, message.toString());
      setLastMessage(message.toString());
    });

    client.on('error', (err) => {
      console.error('❌ MQTT error:', err);
      setMqttError(err.message);
      setMqttConnected(false);
    });

    client.on('close', () => {
      console.log('🔌 MQTT disconnected');
      setMqttConnected(false);
    });

    return () => {
      console.log('🔌 Cleaning up MQTT connection');
      client.end();
    };
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    forceHistoryRef.current = forceHistory;
  }, [forceHistory]);

  // Update force from MQTT messages
  useEffect(() => {
    if (lastMessage) {
      const rawForce = parseFloat(lastMessage);
      if (!isNaN(rawForce)) {
        // Convert raw force (300-4000) to percentage (0-100)
        const forcePercent = Math.max(0, Math.min(100, ((rawForce - 300) / 3700) * 100));
        console.log('Updating force from MQTT - Raw:', rawForce, 'Percent:', forcePercent.toFixed(1) + '%');
        setData(prev => ({
          ...prev,
          force: forcePercent,
          pidOutput: forcePercent,
          timestamp: Date.now(),
        }));
      }
    }
  }, [lastMessage]);

  // Log connection status
  useEffect(() => {
    console.log('MQTT Connected:', mqttConnected);
    console.log('MQTT Error:', mqttError);
  }, [mqttConnected, mqttError]);

  useEffect(() => {
    // Calculate metrics based on real force readings
    const interval = setInterval(() => {
      setData(prev => {
        const history = forceHistoryRef.current;
        const currentForce = prev.force;
        
        // Calculate MVC (Maximum Voluntary Contraction) as percentage of max observed force
        // Assuming max force is around 100N, adjust based on your sensor specs
        const maxForce = 100;
        const newMvc = Math.min(100, (currentForce / maxForce) * 100);
        
        // Calculate COV (Coefficient of Variation) from force history
        let newCov = prev.cov;
        if (history.length > 10) {
          const recentForces = history.slice(-20).map(p => p.force);
          const mean = recentForces.reduce((a, b) => a + b, 0) / recentForces.length;
          const variance = recentForces.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentForces.length;
          const stdDev = Math.sqrt(variance);
          newCov = mean > 0 ? (stdDev / mean) * 100 : 0;
          newCov = Math.max(0, Math.min(50, newCov)); // Cap at reasonable range
        }
        
        // Calculate RFD (Rate of Force Development) from recent force changes
        let newRfd = prev.rfd;
        if (history.length > 5) {
          const recentHistory = history.slice(-10);
          let maxRateOfChange = 0;
          for (let i = 1; i < recentHistory.length; i++) {
            const timeDiff = (recentHistory[i].time - recentHistory[i-1].time) / 1000; // Convert to seconds
            const forceDiff = recentHistory[i].force - recentHistory[i-1].force;
            if (timeDiff > 0) {
              const rateOfChange = Math.abs(forceDiff / timeDiff);
              maxRateOfChange = Math.max(maxRateOfChange, rateOfChange);
            }
          }
          newRfd = Math.min(2000, maxRateOfChange); // Cap at reasonable range
        }
        
        // Simulate temperature based on force exertion (higher force = more heat)
        const forceHeatFactor = (currentForce / maxForce) * 0.2;
        const newTemp = Math.max(30, Math.min(38, prev.temperature + forceHeatFactor - 0.15));
        const newTempRate = (newTemp - prev.temperature) / 0.2;
        const newThermalEnergy = Math.max(100, Math.min(300, 145 + (newTemp - 32.5) * 10));
        
        // Calculate tremor power based on force stability
        const newTremorPower = Math.max(0.05, Math.min(0.5, newCov / 100));
        
        // Calculate fatigue index based on real metrics
        // Higher force sustained = higher fatigue
        // Higher COV (instability) = higher fatigue
        // Lower RFD (slower response) = higher fatigue
        // Higher temperature = higher fatigue
        const fatigueFactors = [
          (newMvc / 100) * 35,                    // 35% weight on force level
          (newCov / 50) * 25,                     // 25% weight on force variability
          (1 - Math.min(newRfd / 1500, 1)) * 20,  // 20% weight on reduced RFD
          ((newTemp - 30) / 8) * 20               // 20% weight on temperature
        ];
        const newFatigueIndex = Math.min(100, fatigueFactors.reduce((a, b) => a + b, 0));
        
        let newStatus: 'OK' | 'FATIGA' | 'CRÍTICO' = 'OK';
        if (newFatigueIndex > 65) newStatus = 'CRÍTICO';
        else if (newFatigueIndex > 40) newStatus = 'FATIGA';

        return {
          force: prev.force, // Keep MQTT value
          mvc: newMvc,
          cov: newCov,
          rfd: newRfd,
          tremorPower: newTremorPower,
          tremorFreq: Math.max(4, Math.min(12, 4 + newTremorPower * 16)), // Tremor freq correlates with instability
          temperature: newTemp,
          tempRate: newTempRate,
          thermalEnergy: newThermalEnergy,
          fatigueIndex: newFatigueIndex,
          fatigueStatus: newStatus,
          pidSetpoint: prev.pidSetpoint,
          pidOutput: prev.force, // Use MQTT force value
          timestamp: Date.now(),
        };
      });
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update force history - separate effect
  useEffect(() => {
    const historyInterval = setInterval(() => {
      setForceHistory(prev => {
        const newPoint = { time: Date.now(), force: dataRef.current.force };
        const updated = [...prev, newPoint];
        return updated.slice(-50); // Keep last 50 points
      });
    }, 200);

    return () => {
      clearInterval(historyInterval);
    };
  }, []);

  // Generate tremor spectrum - separate effect
  useEffect(() => {
    const spectrumInterval = setInterval(() => {
      const spectrum: TremorSpectrum[] = [];
      const currentData = dataRef.current;
      for (let f = 4; f <= 12; f += 0.5) {
        const power = Math.exp(-Math.pow((f - currentData.tremorFreq) / 2, 2)) * currentData.tremorPower * (0.8 + Math.random() * 0.4);
        spectrum.push({ frequency: f, power });
      }
      setTremorSpectrum(spectrum);
    }, 500);

    return () => {
      clearInterval(spectrumInterval);
    };
  }, []);

  return { data, forceHistory, tremorSpectrum };
};
