import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export { PORT, DATABASE_URL, CLIENT_URL };