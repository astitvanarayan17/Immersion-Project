const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATA_FILE = path.join(__dirname, 'data', 'vehicles.json');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper to read/write JSON
function readVehicles() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeVehicles(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Home - List all vehicles
app.get('/', (req, res) => {
    const vehicles = readVehicles();
    res.render('index', { vehicles });
});

// Show form to add vehicle
app.get('/vehicle/new', (req, res) => {
    res.render('vehicle');
});

// Add vehicle (with image upload)
app.post('/vehicle', upload.single('image'), (req, res) => {
    const vehicles = readVehicles();
    const { vehicleName, price, desc, brand } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    vehicles.push({ id: Date.now(), vehicleName, price, image: imagePath, desc, brand });
    writeVehicles(vehicles);
    res.redirect('/');
});

// Show form to edit vehicle
app.get('/vehicle/edit/:id', (req, res) => {
    const vehicles = readVehicles();
    const vehicle = vehicles.find(v => v.id == req.params.id);
    res.render('edit', { vehicle });
});

// Update vehicle (with image upload)
app.post('/vehicle/edit/:id', upload.single('image'), (req, res) => {
    let vehicles = readVehicles();
    vehicles = vehicles.map(v => {
        if (v.id == req.params.id) {
            const updated = { ...v, ...req.body };
            if (req.file) updated.image = '/uploads/' + req.file.filename;
            return updated;
        }
        return v;
    });
    writeVehicles(vehicles);
    res.redirect('/');
});

// Delete vehicle
app.post('/vehicle/delete/:id', (req, res) => {
    let vehicles = readVehicles();
    vehicles = vehicles.filter(v => v.id != req.params.id);
    writeVehicles(vehicles);
    res.redirect('/');
});

// REST API endpoints (JSON)
app.get('/api/vehicles', (req, res) => res.json(readVehicles()));
app.get('/api/vehicles/:id', (req, res) => {
    const vehicle = readVehicles().find(v => v.id == req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});
app.post('/api/vehicles', upload.single('image'), (req, res) => {
    const vehicles = readVehicles();
    const { vehicleName, price, desc, brand } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    const newVehicle = { id: Date.now(), vehicleName, price, image: imagePath, desc, brand };
    vehicles.push(newVehicle);
    writeVehicles(vehicles);
    res.status(201).json(newVehicle);
});
app.put('/api/vehicles/:id', upload.single('image'), (req, res) => {
    let vehicles = readVehicles();
    let idx = vehicles.findIndex(v => v.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    let updated = { ...vehicles[idx], ...req.body };
    if (req.file) updated.image = '/uploads/' + req.file.filename;
    vehicles[idx] = updated;
    writeVehicles(vehicles);
    res.json(vehicles[idx]);
});
app.delete('/api/vehicles/:id', (req, res) => {
    let vehicles = readVehicles();
    let idx = vehicles.findIndex(v => v.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const deleted = vehicles.splice(idx, 1);
    writeVehicles(vehicles);
    res.json(deleted[0]);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));