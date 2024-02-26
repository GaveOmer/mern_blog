import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import cors from 'cors';
import { validationResult } from 'express-validator';

import { registerValidation } from './validations/auth.js';

import UserModel from './models/User.model.js';

import checkAuth from './utils/checkAuth.js';
/////////////////////////////////
const app = express();
// middlewares //////////////////
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
	cors({
		origin: 'http://localhost:5173',
		methods: ['POST', 'PUT', 'GET', 'DELETE'],
	})
);
////////////////////////////////
app.get('/', (req, res) => {
	res.send('Welcome');
});

app.post('/auth/login', async (req, res) => {
	try {
		const user = await UserModel.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({
				message: 'Не авторизоваться',
			});
		}

		const isValidPass = await bcrypt.compare(
			req.body.password,
			user._doc.passwordHash
		);
		if (!isValidPass) {
			return res.status(404).json({
				message: 'Неверный логин или пароль',
			});
		}

		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{
				expiresIn: '30d',
			}
		);

		const { passwordHash, ...userData } = user._doc;
		res.json({
			...userData,
			token,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: 'Не удалось авторизоваться',
		});
	}
});

app.post('/auth/register', registerValidation, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json(errors.array());
		}

		const password = req.body.password;
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);
		const doc = new UserModel({
			email: req.body.email,
			fullName: req.body.fullName,
			avatarUrl: req.body.avatarUrl,
			passwordHash: hash,
		});
		const user = await doc.save();

		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{
				expiresIn: '30d',
			}
		);

		const { passwordHash, ...userData } = user._doc;

		res.json({
			...userData,
			token,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: 'Не удалось зарегистрироваться',
		});
	}
});

app.get('/auth/me', checkAuth, (req, res) => {
	try {
		res.json({
			success: true,
		});
	} catch (err) {}
});

mongoose
	.connect(
		'mongodb+srv://feitan:qhqs6nSaqf8wg2JC@blog.7nvkzpm.mongodb.net/blog?retryWrites=true&w=majority&appName=blog'
	)
	.then(() => {
		console.log('connected');
		app.listen('3000', () => {
			console.log('listening on http://localhost:3000');
		});
	})
	.catch((error) => {
		console.log('error: ', error);
	});
