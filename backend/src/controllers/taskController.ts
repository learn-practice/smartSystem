import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const toDate = (v: unknown) => (v === '' || v == null ? null : v);
const toId = (v: unknown) => (v === '' || v == null ? null : v);

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, search, page = '1', limit = '10' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (req.user?.role === 'user') {
      conditions.push(`t.assigned_to = $${idx++}`);
      params.push(req.user.id);
    }
    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${idx++}`); params.push(priority); }
    if (search) { conditions.push(`t.title ILIKE $${idx++}`); params.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT t.*, u.name AS assigned_to_name, p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      ${where} ORDER BY t.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, parseInt(limit), offset]);

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM tasks t ${where}`, params
    );
    res.json({ tasks: rows, total: parseInt(countRows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.name AS assigned_to_name, p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id=$1
    `, [req.params.id]);
    if (!rows[0]) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, deadline, project_id, assigned_to } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority, deadline, project_id, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, priority, toDate(deadline), toId(project_id), toId(assigned_to), req.user?.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, status, deadline, assigned_to } = req.body;
    const role = req.user?.role;
    const userId = req.user?.id;

    if (role === 'user') {
      const { rows } = await pool.query('SELECT * FROM tasks WHERE id=$1 AND assigned_to=$2', [req.params.id, userId]);
      if (!rows[0]) { res.status(403).json({ message: 'Forbidden' }); return; }
      const { rows: updated } = await pool.query(
        `UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [status, req.params.id]
      );
      res.json(updated[0]); return;
    }

    const { rows } = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, priority=$3, status=$4, deadline=$5,
       assigned_to=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title, description, priority, status, toDate(deadline), toId(assigned_to), req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    if (!rowCount) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
};
