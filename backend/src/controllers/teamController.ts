import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getTeams = async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(`
    SELECT t.*, u.name AS manager_name,
      COALESCE(json_agg(json_build_object('id', tm.user_id, 'name', mu.name))
        FILTER (WHERE tm.user_id IS NOT NULL), '[]') AS members
    FROM teams t
    LEFT JOIN users u ON t.manager_id = u.id
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN users mu ON tm.user_id = mu.id
    GROUP BY t.id, u.name ORDER BY t.created_at DESC
  `);
  res.json(rows);
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(`
    SELECT t.*, u.name AS manager_name,
      COALESCE(json_agg(json_build_object('id', tm.user_id, 'name', mu.name))
        FILTER (WHERE tm.user_id IS NOT NULL), '[]') AS members
    FROM teams t
    LEFT JOIN users u ON t.manager_id = u.id
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN users mu ON tm.user_id = mu.id
    WHERE t.id=$1 GROUP BY t.id, u.name
  `, [req.params.id]);
  if (!rows[0]) { res.status(404).json({ message: 'Team not found' }); return; }
  res.json(rows[0]);
};

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, manager_id, member_ids = [] } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO teams (name, description, manager_id) VALUES ($1,$2,$3) RETURNING *`,
    [name, description, manager_id]
  );
  const team = rows[0];
  if (member_ids.length) {
    const values = member_ids.map((_: string, i: number) => `($1,$${i + 2})`).join(',');
    await pool.query(`INSERT INTO team_members (team_id, user_id) VALUES ${values}`, [team.id, ...member_ids]);
  }
  res.status(201).json(team);
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  const { name, description, manager_id, member_ids } = req.body;
  const { rows } = await pool.query(
    `UPDATE teams SET name=$1, description=$2, manager_id=$3, updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [name, description, manager_id, req.params.id]
  );
  if (!rows[0]) { res.status(404).json({ message: 'Team not found' }); return; }
  if (member_ids) {
    await pool.query('DELETE FROM team_members WHERE team_id=$1', [req.params.id]);
    if (member_ids.length) {
      const values = member_ids.map((_: string, i: number) => `($1,$${i + 2})`).join(',');
      await pool.query(`INSERT INTO team_members (team_id, user_id) VALUES ${values}`, [req.params.id, ...member_ids]);
    }
  }
  res.json(rows[0]);
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  const { rowCount } = await pool.query('DELETE FROM teams WHERE id=$1', [req.params.id]);
  if (!rowCount) { res.status(404).json({ message: 'Team not found' }); return; }
  res.json({ message: 'Team deleted' });
};
