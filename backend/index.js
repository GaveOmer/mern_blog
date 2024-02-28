import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import { handleValidationErrors, checkAuth } from './utils/index.js';
import {
	registerValidation,
	loginValidation,
	postCreateValidation,
} from './validations.js';
import { UserController, PostController } from './controllers/index.js';
/////////////////////////////////
const app = express();
//multer/////////////////////////
const dir = './uploads';
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, { recursive: true });
}
const storage = multer.diskStorage({
	destination: (_, __, cb) => {
		cb(null, 'uploads');
	},
	filename: (_, file, cb) => {
		cb(null, file.originalname);
	},
});

const upload = multer({ storage });
// middlewares //////////////////
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));
// app.use(
// 	cors({
// 		origin: 'http://localhost:5173',
// 		methods: ['POST', 'PUT', 'GET', 'DELETE'],
// 	})
// );
////////////////////////////////
app.get('/', (req, res) => {
	res.send('Welcome');
});

app.post(
	'/auth/login',
	loginValidation,
	handleValidationErrors,
	UserController.login
);
app.post(
	'/auth/register',
	registerValidation,
	handleValidationErrors,
	UserController.register
);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
	res.json({
		url: `uploads/${req.file.originalname}`,
	});
});

app.get('/posts', PostController.getAll);
app.get('/posts/:id', PostController.getOne);
app.post(
	'/posts',
	checkAuth,
	postCreateValidation,
	handleValidationErrors,
	PostController.create
);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch(
	'/posts/:id',
	checkAuth,

	postCreateValidation,
	handleValidationErrors,
	PostController.update
);

mongoose
	.connect(
		'mongodb+srv://feitan:qhqs6nSaqf8wg2JC@blog.7nvkzpm.mongodb.net/blog?retryWrites=true&w=majority&appName=blog'
	)
	.then(() => {
		console.log('connected');
		app.listen('5000', () => {
			console.log('listening on http://localhost:5000');
		});
	})
	.catch((error) => {
		console.log('error: ', error);
	});
