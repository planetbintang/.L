import pg from 'pg';
const email=String(process.argv[2]||'').trim().toLowerCase();
if(!email||!/^\S+@\S+\.\S+$/.test(email)){console.error('Usage: node scripts/set-role.mjs admin@example.com admin|editor|member');process.exit(2)}
const role=String(process.argv[3]||'admin');if(!['admin','editor','member'].includes(role)){console.error('Role must be admin, editor, or member');process.exit(2)}
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{const r=await pool.query('UPDATE galeri.users SET role=$2,updated_at=now() WHERE email=$1 RETURNING id,email,role',[email,role]);if(!r.rowCount)throw new Error('User not found; register this account first');console.log(JSON.stringify(r.rows[0]))}finally{await pool.end()}
