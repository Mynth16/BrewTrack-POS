import mysql from 'mysql2/promise.js';
import bcrypt from 'bcrypt';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brewtrackdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getAccountByUsername(username) {
  try {
    const [rows] = await pool.query(
      'SELECT accountID, username, password, role, status FROM account WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getIngredientList() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM `ingredient`'
    );
    return rows || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}




export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export default pool;
