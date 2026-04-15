import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id=$1', [req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(rows[0]);
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role = 'user' } = req.body;
  const hashed = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role`,
    [name, email, hashed, role]
  );
  res.status(201).json(rows[0]);
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, role } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET name=$1, email=$2, role=$3, updated_at=NOW()
     WHERE id=$4 RETURNING id, name, email, role`,
    [name, email, role, req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(rows[0]);
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  if (!rowCount) { res.status(404).json({ message: 'User not found' }); return; }
  res.json({ message: 'User deleted' });
};
