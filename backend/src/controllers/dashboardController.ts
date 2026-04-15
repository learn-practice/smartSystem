import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, role } = req.user!;

  if (role === 'admin') {
    const [users, teams, projects, tasks, jobs] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM teams'),
      pool.query('SELECT COUNT(*) FROM projects'),
      pool.query(`SELECT status, COUNT(*) FROM tasks GROUP BY status`),
      pool.query(`SELECT status, COUNT(*) FROM jobs GROUP BY status`),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalTeams: parseInt(teams.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      tasksByStatus: tasks.rows,
      jobsByStatus: jobs.rows,
    });
    return;
  }

  if (role === 'manager') {
    const [myTeams, myProjects, teamTasks] = await Promise.all([
      pool.query('SELECT t.* FROM teams t WHERE t.manager_id=$1', [id]),
      pool.query(`SELECT p.* FROM projects p
        JOIN project_teams pt ON p.id = pt.project_id
        JOIN teams t ON pt.team_id = t.id WHERE t.manager_id=$1`, [id]),
      pool.query(`SELECT status, COUNT(*) FROM tasks t
        JOIN users u ON t.assigned_to = u.id
        JOIN team_members tm ON u.id = tm.user_id
        JOIN teams te ON tm.team_id = te.id
        WHERE te.manager_id=$1 GROUP BY status`, [id]),
    ]);
    res.json({ myTeams: myTeams.rows, myProjects: myProjects.rows, tasksByStatus: teamTasks.rows });
    return;
  }

  const [myTasks, myJobs] = await Promise.all([
    pool.query(`SELECT t.*, p.name AS project_name FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id WHERE t.assigned_to=$1 ORDER BY t.deadline`, [id]),
    pool.query('SELECT * FROM jobs WHERE assigned_to=$1 ORDER BY deadline', [id]),
  ]);
  res.json({ myTasks: myTasks.rows, myJobs: myJobs.rows });
};
