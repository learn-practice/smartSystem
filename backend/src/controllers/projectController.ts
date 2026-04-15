import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const { search, page = '1', limit = '10' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params: unknown[] = [];
  let where = '';
  if (search) { where = 'WHERE p.name ILIKE $1'; params.push(`%${search}%`); }

  const { rows } = await pool.query(`
    SELECT p.*, u.name AS created_by_name,
      COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name))
        FILTER (WHERE t.id IS NOT NULL), '[]') AS teams
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN project_teams pt ON p.id = pt.project_id
    LEFT JOIN teams t ON pt.team_id = t.id
    ${where} GROUP BY p.id, u.name ORDER BY p.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [...params, parseInt(limit), offset]);
  res.json({ projects: rows, page: parseInt(page), limit: parseInt(limit) });
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(`
    SELECT p.*, u.name AS created_by_name,
      COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name))
        FILTER (WHERE t.id IS NOT NULL), '[]') AS teams
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN project_teams pt ON p.id = pt.project_id
    LEFT JOIN teams t ON pt.team_id = t.id
    WHERE p.id=$1 GROUP BY p.id, u.name
  `, [req.params.id]);
  if (!rows[0]) { res.status(404).json({ message: 'Project not found' }); return; }
  res.json(rows[0]);
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, deadline, team_ids = [] } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO projects (name, description, deadline, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, description, deadline, req.user?.id]
  );
  const project = rows[0];
  if (team_ids.length) {
    const values = team_ids.map((_: string, i: number) => `($1,$${i + 2})`).join(',');
    await pool.query(`INSERT INTO project_teams (project_id, team_id) VALUES ${values}`, [project.id, ...team_ids]);
  }
  res.status(201).json(project);
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { name, description, status, deadline, team_ids } = req.body;
  const { rows } = await pool.query(
    `UPDATE projects SET name=$1, description=$2, status=$3, deadline=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [name, description, status, deadline, req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ message: 'Project not found' }); return; }
  if (team_ids) {
    await pool.query('DELETE FROM project_teams WHERE project_id=$1', [req.params.id]);
    if (team_ids.length) {
      const values = team_ids.map((_: string, i: number) => `($1,$${i + 2})`).join(',');
      await pool.query(`INSERT INTO project_teams (project_id, team_id) VALUES ${values}`, [req.params.id, ...team_ids]);
    }
  }
  res.json(rows[0]);
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { rowCount } = await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
  if (!rowCount) { res.status(404).json({ message: 'Project not found' }); return; }
  res.json({ message: 'Project deleted' });
};
