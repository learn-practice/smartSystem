import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role = 'user' } = req.body;
  const hashed = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role`,
    [name, email, hashed, role]
  );
  res.status(201).json({ user: rows[0] });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await pool.query('UPDATE users SET refresh_token=$1 WHERE id=$2', [refreshToken, user.id]);
  res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(401).json({ message: 'No refresh token' }); return; }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1 AND refresh_token=$2', [payload.id, refreshToken]);
    if (!rows[0]) { res.status(403).json({ message: 'Invalid refresh token' }); return; }
    const newPayload = { id: rows[0].id, role: rows[0].role, email: rows[0].email };
    res.json({ accessToken: signAccessToken(newPayload) });
  } catch {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await pool.query('UPDATE users SET refresh_token=NULL WHERE refresh_token=$1', [refreshToken]);
  }
  res.json({ message: 'Logged out' });
};
