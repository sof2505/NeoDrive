# NeoDrive
Predictive Fatigue Glove for Load Operators

Project Description:
This repository contains the source code and documentation for the development of the Predictive Fatigue Glove for Load Operators, an embedded system designed to monitor and predict fatigue and drowsiness in truck drivers through an intelligent glove. The system uses physiological sensors such as FSR, ADXL335, NTC, and PPG to measure pressure, vibration, temperature, and heart rate, generating real-time alerts when high levels of fatigue are detected.

Objective:
The intelligent glove connects to a master node via Bluetooth BLE or Ethernet SPI (W5500) and transmits fatigue data to an MQTT platform for visualization on an interactive dashboard. The system also provides haptic feedback (vibration, RGB LED) to warn the driver about drowsiness risk, and is powered by a LiPo battery with efficient energy management.

Key Features

Real-Time Monitoring:
The glove measures pressure force, neuromuscular vibrations, thermal stress (temperature), and heart rate using FSR, ADXL335, NTC, and PPG sensors.

Local Processing:
All signal processing is done on the Nucleo-H533RE microcontroller, using FreeRTOS to manage concurrent tasks of data acquisition, signal filtering, and alert generation.

Immediate Haptic Alerts:
The system triggers haptic alerts using a vibrator motor and RGB LED when it detects fatigue levels exceeding the set thresholds.

IoT Connectivity:
The glove transmits data in real-time via Bluetooth BLE to the master node, which then sends it to an MQTT server for visualization and analysis. The solution is scalable and allows integration with platforms like Node-RED and Grafana.

Low Power Consumption:
The system is powered by a 3.7 V LiPo battery and includes a battery management system to ensure autonomy for a full work shift.

Project Structure

Glove Firmware:

Implemented in C for the Nucleo-H533RE microcontroller.

Utilizes FreeRTOS for managing concurrent tasks.

Sensors connected via ADC-DMA for efficient signal acquisition.

Signal processing is done using CMSIS-DSP for advanced filtering and analysis.

Master Node:

Nucleo-H755ZI-Q with Ethernet SPI (W5500) for data communication with the server.

Local user interface using OLED/TFT for real-time visualization.

IoT Connectivity and Dashboard:

MQTT for data transmission.

Node-RED and Grafana for visualization and monitoring.

Technologies Used

Microcontrollers: STM32 Nucleo-H533RE (glove), Nucleo-H755ZI-Q (master node)

RTOS: FreeRTOS

Programming Language: C

Signal Processing: CMSIS-DSP

IoT Connectivity: Bluetooth BLE, Ethernet SPI (W5500)

Visualization Platforms: MQTT, Node-RED, Grafana

Requirements to Run

Hardware:

Nucleo-H533RE and Nucleo-H755ZI-Q (or compatible STM32 microcontroller)

Sensors: FSR, ADXL335, NTC, PPG

Other Components: Vibrator motor, RGB LED, Buzzer, LiPo battery

Network connection via BLE or Ethernet for data transmission

Software:

STM32CubeIDE (for C development)

FreeRTOS (for concurrent task management)

Node-RED and Grafana (for the dashboard and data visualization)

Next Steps

Optimize the predictive fatigue algorithm to improve accuracy and reduce false positives.

Field testing with vehicle fleets to validate the system in real-world conditions.

Development of vehicular integration with centralized fleet management systems.
