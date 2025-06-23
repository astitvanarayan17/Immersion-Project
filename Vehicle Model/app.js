const express = require('express');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/vehicleDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
    vehicleName: String,
    price: String,
    image: String,
    desc: String,
    brand: String
});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Home - List all vehicles
app.get('/', async (req, res) => {
    const vehicles = await Vehicle.find();
    res.render('index', { vehicles });
});

// Show form to add vehicle
app.get('/vehicle/new', (req, res) => {
    res.render('vehicle');
});

// Add vehicle (with image upload)
app.post('/vehicle', upload.single('image'), async (req, res) => {
    const { vehicleName, price, desc, brand } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    await Vehicle.create({ vehicleName, price, image: imagePath, desc, brand });
    res.redirect('/');
});

// Show form to edit vehicle
app.get('/vehicle/edit/:id', async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    res.render('edit', { vehicle });
});

// Update vehicle (with image upload)
app.post('/vehicle/edit/:id', upload.single('image'), async (req, res) => {
    const update = { ...req.body };
    if (req.file) update.image = '/uploads/' + req.file.filename;
    await Vehicle.findByIdAndUpdate(req.params.id, update);
    res.redirect('/');
});

// Delete vehicle
app.post('/vehicle/delete/:id', async (req, res) => {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

// REST API endpoints (JSON)
app.get('/api/vehicles', async (req, res) => {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
});
app.get('/api/vehicles/:id', async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});
app.post('/api/vehicles', upload.single('image'), async (req, res) => {
    const { vehicleName, price, desc, brand } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    const newVehicle = await Vehicle.create({ vehicleName, price, image: imagePath, desc, brand });
    res.status(201).json(newVehicle);
});
app.put('/api/vehicles/:id', upload.single('image'), async (req, res) => {
    const update = { ...req.body };
    if (req.file) update.image = '/uploads/' + req.file.filename;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});
app.delete('/api/vehicles/:id', async (req, res) => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));