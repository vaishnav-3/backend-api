const path = require('path');
const csvParser = require('csv-parser');
const express = require('express');
const fs = require('fs');
const Papa = require('papaparse');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // important to parse JSON body for POST

// POST /villageinfo
app.post('/villageinfo', (req, res) => {
  const { state, district, block, village } = req.body;

  if (!state || !district || !block || !village) {
    return res.status(400).json({ error: "State, district, block, and village are required in body" });
  }

  const filepath = `./village_dataset/${state}.csv`;
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "State data not found" });
  }

  const csvData = fs.readFileSync(filepath, 'utf8');
  Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const matchedVillages = results.data.filter(v => 
        v["District"]?.trim().toLowerCase() === district.trim().toLowerCase() &&
        v["Block"]?.trim().toLowerCase() === block.trim().toLowerCase() &&
        v["Habitation Name"]?.trim().toLowerCase() === village.trim().toLowerCase()
      );

      if (matchedVillages.length > 0) {
        res.json({
          habitationName: village,
          district: matchedVillages[0]["District"],
          block: matchedVillages[0]["Block"],
          facilities: matchedVillages.map(facility => ({
            facilityName: facility["Facility Name"],
            address: facility["Address"],
            category: facility["Facility Category"],
            subcategory: facility["Facility Subcategory"],
            latitude: parseFloat(facility["Lattitude"]),
            longitude: parseFloat(facility["Longitude"]),
          }))
        });
      } else {
        res.status(404).json({ error: "Village not found with given district and block" });
      }
    }
  });
});

// --- Dynamic dropdown routes ---
const DATASET_PATH = path.join(__dirname, 'village_dataset');

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Get all states
app.get('/api/states', async (req, res) => {
  try {
    const states = fs.readdirSync(DATASET_PATH).filter(file => file.endsWith('.csv'));
    res.json(states.map(state => state.replace('.csv', '')));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching states' });
  }
});

// Get districts by state
app.get('/api/districts/:state', async (req, res) => {
  const { state } = req.params;
  const filePath = path.join(DATASET_PATH, `${state}.csv`);
  try {
    const data = await readCSV(filePath);
    const districts = [...new Set(data.map(row => row.District))];
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching districts' });
  }
});

// Get blocks by district
app.get('/api/blocks/:state/:district', async (req, res) => {
  const { state, district } = req.params;
  const filePath = path.join(DATASET_PATH, `${state}.csv`);
  try {
    const data = await readCSV(filePath);
    const blocks = [...new Set(data.filter(row => row.District === district).map(row => row.Block))];
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blocks' });
  }
});

// Get villages by block
app.get('/api/villages/:state/:district/:block', async (req, res) => {
  const { state, district, block } = req.params;
  const filePath = path.join(DATASET_PATH, `${state}.csv`);
  try {
    const data = await readCSV(filePath);
    const villages = data
      .filter(row => row.District === district && row.Block === block)
      .map(row => ({
        name: row['Habitation Name'],
        latitude: row.Lattitude,
        longitude: row.Longitude
      }));
    res.json(villages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching villages' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Village Info API is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});