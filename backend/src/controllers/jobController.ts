import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const toDate = (v: unknown) => (v === '' || v == null ? null : v);
const toId = (v: unknown) => (v === '' || v == null ? null : v);

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (req.user?.role === 'user') {
      conditions.push(`(j.assigned_to = $${idx++} OR j.team_id IN (SELECT team_id FROM team_members WHERE user_id = $${idx++}))`);
      params.push(req.user.id, req.user.id);
    }
    if (status) { conditions.push(`j.status = $${idx++}`); params.push(status); }
    if (search) { conditions.push(`j.title ILIKE $${idx++}`); params.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT j.*, u.name AS assigned_to_name, t.name AS team_name
      FROM jobs j
      LEFT JOIN users u ON j.assigned_to = u.id
      LEFT JOIN teams t ON j.team_id = t.id
      ${where} ORDER BY j.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, parseInt(limit), offset]);
    res.json({ jobs: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, assigned_to, team_id, deadline } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO jobs (title, description, assigned_to, team_id, deadline, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, toId(assigned_to), toId(team_id), toDate(deadline), req.user?.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, status, assigned_to, team_id, deadline } = req.body;
    const { rows } = await pool.query(
      `UPDATE jobs SET title=$1, description=$2, status=$3, assigned_to=$4, team_id=$5,
       deadline=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title, description, status, toId(assigned_to), toId(team_id), toDate(deadline), req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ message: 'Job not found' }); return; }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rowCount } = await pool.query('DELETE FROM jobs WHERE id=$1', [req.params.id]);
    if (!rowCount) { res.status(404).json({ message: 'Job not found' }); return; }
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};
