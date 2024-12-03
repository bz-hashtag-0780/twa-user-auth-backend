const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware

// app.use(cors()); // For development only
// For production uncomment the following code and remove the above line app.use(cors());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Replace with your frontend URL
		methods: ['POST'],
	})
);

app.use(bodyParser.json());

// Function to validate Telegram `initData`
const isValidTelegramInitData = (initData) => {
	const urlSearchParams = new URLSearchParams(initData);
	const params = Object.fromEntries(urlSearchParams.entries());

	if (!params.id || !params.username) {
		console.error('Missing required parameters in initData');
		return res.status(400).json({ error: 'Invalid Telegram data' });
	}

	if (!params.hash) return false;

	const hash = params.hash;
	delete params.hash;

	const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
	const dataCheckString = Object.keys(params)
		.sort()
		.map((key) => `${key}=${params[key]}`)
		.join('\n');
	const computedHash = crypto
		.createHmac('sha256', secretKey)
		.update(dataCheckString)
		.digest('hex');

	return computedHash === hash;
};

// Endpoint to authenticate Telegram users
app.post('/auth', (req, res) => {
	const { initData } = req.body;

	if (!initData) {
		return res.status(400).json({ error: 'initData is required' });
	}

	if (!isValidTelegramInitData(initData)) {
		return res.status(400).json({ error: 'Invalid Telegram data' });
	}

	const urlSearchParams = new URLSearchParams(initData);
	const params = Object.fromEntries(urlSearchParams.entries());

	// Generate JWT token
	const token = jwt.sign(
		{ id: params.id, username: params.username },
		JWT_SECRET,
		{ expiresIn: '1h' }
	);

	res.json({ message: 'Authenticated', token });
});

//testing

const userData = {
	id: '123456789',
	username: 'example_user',
	auth_date: Math.floor(Date.now() / 1000), // Current timestamp
};

// Create the data_check_string
const dataCheckString = Object.keys(userData)
	.sort()
	.map((key) => `${key}=${userData[key]}`)
	.join('\n');

// Generate the secret key using the bot token
const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();

// Generate the hash
const hash = crypto
	.createHmac('sha256', secretKey)
	.update(dataCheckString)
	.digest('hex');

// Combine everything into initData
const initData = `${Object.entries(userData)
	.map(([key, value]) => `${key}=${value}`)
	.join('&')}&hash=${hash}`;

console.log('Generated initData:', initData);

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
