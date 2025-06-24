const express = require('express');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
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

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: String,
    age: Number
});
const User = mongoose.model('User', userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

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

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

// Registration form
app.get('/register', (req, res) => {
    res.render('register');
});

// Register user
app.post('/register', async (req, res) => {
    const { username, password, email, age } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await User.create({ username, password: hashedPassword, email, age });
        res.redirect('/login');
    } catch (err) {
        res.send('Registration failed. Username may already exist.');
    }
});

// Login form
app.get('/login', (req, res) => {
    res.render('login');
});

// Login user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.send('Invalid credentials');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Home - List all vehicles (protected)
app.get('/', isAuthenticated, async (req, res) => {
    const vehicles = await Vehicle.find();
    res.render('index', { vehicles });
});

// Show form to add vehicle (protected)
app.get('/vehicle/new', isAuthenticated, (req, res) => {
    res.render('vehicle');
});

// Add vehicle (with image upload, protected)
app.post('/vehicle', isAuthenticated, upload.single('image'), async (req, res) => {
    const { vehicleName, price, desc, brand } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    await Vehicle.create({ vehicleName, price, image: imagePath, desc, brand });
    res.redirect('/');
});

// Show form to edit vehicle (protected)
app.get('/vehicle/edit/:id', isAuthenticated, async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    res.render('edit', { vehicle });
});

// Update vehicle (with image upload, protected)
app.post('/vehicle/edit/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    const update = { ...req.body };
    if (req.file) update.image = '/uploads/' + req.file.filename;
    await Vehicle.findByIdAndUpdate(req.params.id, update);
    res.redirect('/');
});

// Delete vehicle (protected)
app.post('/vehicle/delete/:id', isAuthenticated, async (req, res) => {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

// REST API endpoints (all protected)
app.get('/api/vehicles', isAuthenticated, async (req, res) => {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
});
app.get('/api/vehicles/:id', isAuthenticated, async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});
app.post('/api/vehicles', isAuthenticated, upload.single('image'), async (req, res) => {
    const { vehicleName, price, desc, brand } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    const newVehicle = await Vehicle.create({ vehicleName, price, image: imagePath, desc, brand });
    res.status(201).json(newVehicle);
});
app.put('/api/vehicles/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    const update = { ...req.body };
    if (req.file) update.image = '/uploads/' + req.file.filename;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});
app.delete('/api/vehicles/:id', isAuthenticated, async (req, res) => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));