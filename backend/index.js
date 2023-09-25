import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import User from './models/User.js'; // Import your User model
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 8000;
const database_name = process.env.DATABASE;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: database_name,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Implement your routes
app.post('/signup', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(email, password);
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    User.findOne({ email }, async (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
      } else {
        if (user === null) {
          const newUser = new User({
            email,
            password: hashedPassword,
          });
          try {
            const savedUser = await newUser.save();
            const userData = {
              _id: savedUser._id,
              email: savedUser.email,
            };
            console.log(userData);
            res.status(200).json(userData);
          } catch (err) {
            console.error(err);
            res.status(500).json(err);
          }
        } else {
          res.status(400).json({
            message: 'Email is not available',
          });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

app.post('/signin', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    // Use await to execute the query and get the user data
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // If the user is found and the password matches, return the user data
    res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred during login.' });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
