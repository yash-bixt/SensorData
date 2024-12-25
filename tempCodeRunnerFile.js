const http = require('http');
const fs = require('fs');
const path = require('path');

// Data storage
let sensorData = {
  temperature: [],
  humidity: [],
  ldr: [],
  moisture: [],
  ir: [],
  ultrasonic: []
};

// Active sensor tracking
let activeSensor = null;
let visualizationMode = 'table'; // Default mode

// Function to reset server state
function resetServerState() {
  sensorData = {
    temperature: [],
    humidity: [],
    ldr: [],
    moisture: [],
    ir: [],
    ultrasonic: []
  };
  activeSensor = null;
  visualizationMode = 'table';
  console.log('Server state reset.');
}

// Create an HTTP server
const server = http.createServer((req, res) => {
  const { method, url } = req;

  console.log(`Received request: ${method} ${url}`);

  if (method === 'GET' && url === '/') {
    // Reset server state when the page is reloaded
    resetServerState();

    // Serve the HTML frontend
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (method === 'POST' && url === '/select-sensor') {
    // Set the active sensor and visualization mode
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const { sensor, mode } = JSON.parse(body);
        activeSensor = sensor;
        visualizationMode = mode || 'table';
        console.log(`Active sensor set to: ${activeSensor}, Visualization mode: ${visualizationMode}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Sensor and mode set successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON format' }));
      }
    });
  } else if (method === 'POST' && url === '/send-data') {
    // Receive data from NodeMCU
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const timestamp = new Date().toISOString();
        console.log('Received data:', data); // Log received data

        // Store data for future use (e.g., for visualizations)
        Object.keys(data).forEach(sensor => {
          if (sensorData[sensor]) {
            sensorData[sensor].push({ time: timestamp, value: data[sensor] });

            // Retain only the latest 5000 entries
            if (sensorData[sensor].length > 5000) {
              sensorData[sensor].shift(); // Remove the oldest entry
            }
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Data received successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON format' }));
      }
    });
  } else if (method === 'GET' && url.startsWith('/get-data')) {
    // Serve data for the active sensor
    if (!activeSensor) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No active sensor selected' }));
      return;
    }

    console.log(`Fetching data for active sensor: ${activeSensor}`);
    const data = sensorData[activeSensor] || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data, mode: visualizationMode }));
  } else if (method === 'POST' && url === '/clear-data') {
    // Endpoint to clear all sensor data
    resetServerState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Sensor data cleared successfully' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://192.168.29.65:${PORT}/`);
});
