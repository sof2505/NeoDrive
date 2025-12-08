import { useState, useEffect } from 'react';
import { useMQTT } from './useMQTT';

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  timestamp: number;
}

export const useAccelerometer = () => {
  const [history, setHistory] = useState<AccelerometerData[]>([]);
  const [current, setCurrent] = useState<AccelerometerData>({
    x: 0,
    y: 0,
    z: 0,
    magnitude: 0,
    timestamp: Date.now()
  });

  const brokerUrl = `${import.meta.env.VITE_SUPABASE_URL.replace('https://', 'wss://')}/functions/v1/mqtt-bridge`;
  
  const accX = useMQTT(brokerUrl, 'RoboCaroLogic/acc_x');
  const accY = useMQTT(brokerUrl, 'RoboCaroLogic/acc_y');
  const accZ = useMQTT(brokerUrl, 'RoboCaroLogic/acc_z');
  const accMag = useMQTT(brokerUrl, 'RoboCaroLogic/acc_mag');

  useEffect(() => {
    const newData = { ...current, timestamp: Date.now() };
    let updated = false;

    if (accX.lastMessage) {
      const value = parseFloat(accX.lastMessage);
      if (!isNaN(value)) {
        newData.x = value;
        updated = true;
      }
    }

    if (accY.lastMessage) {
      const value = parseFloat(accY.lastMessage);
      if (!isNaN(value)) {
        newData.y = value;
        updated = true;
      }
    }

    if (accZ.lastMessage) {
      const value = parseFloat(accZ.lastMessage);
      if (!isNaN(value)) {
        newData.z = value;
        updated = true;
      }
    }

    if (accMag.lastMessage) {
      const value = parseFloat(accMag.lastMessage);
      if (!isNaN(value)) {
        newData.magnitude = value;
        updated = true;
      }
    }

    if (updated) {
      setCurrent(newData);
      setHistory(prev => {
        const newHistory = [...prev, newData];
        return newHistory.slice(-100); // Keep last 100 points
      });
    }
  }, [accX.lastMessage, accY.lastMessage, accZ.lastMessage, accMag.lastMessage]);

  const isConnected = accX.isConnected && accY.isConnected && accZ.isConnected && accMag.isConnected;
  const error = accX.error || accY.error || accZ.error || accMag.error;

  return {
    current,
    history,
    isConnected,
    error
  };
};
