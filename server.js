const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'villages_api',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

// Helper function to convert membership
function convertMembership(membership) {
  const map = {
    'free': 'NORMAL',
    'normal': 'NORMAL',
    'premium': 'PREMIUM',
    'ultra': 'ULTRA_PREMIUM',
    'NORMAL': 'NORMAL',
    'PREMIUM': 'PREMIUM',
    'ULTRA_PREMIUM': 'ULTRA_PREMIUM'
  };
  return map[membership] || 'NORMAL';
}

// ==================== AUTHENTICATION ROUTES ====================
// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, membership } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const dbMembership = convertMembership(membership || 'free');
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, membership, status, role) VALUES (?, ?, ?, ?, "pending", "user")',
      [name, email, hashedPassword, dbMembership]
    );
    res.json({ success: true, message: 'Registration successful! Wait for admin approval.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, passwordProvided: !!password });
  
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    console.log('User found:', users.length > 0);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials - User not found' });
    }
    
    const user = users[0];
    console.log('User role:', user.role, 'Status:', user.status);
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials - Wrong password' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account pending admin approval' });
    }
    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, membership: user.membership }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '7d' }
    );
    
    console.log('Login successful for:', email);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, membership: user.membership } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// RESET PASSWORDS ENDPOINT - Use this to fix login issues
app.post('/api/auth/reset-passwords', async (req, res) => {
  try {
    console.log('🔄 Resetting passwords...');
    
    const adminPassword = 'admin123';
    const userPassword = 'user123';
    
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const userHash = await bcrypt.hash(userPassword, 10);
    
    // Update or insert admin
    const [adminExists] = await db.execute('SELECT id FROM users WHERE email = "admin@smartloc.com"');
    if (adminExists.length > 0) {
      await db.execute('UPDATE users SET password = ? WHERE email = "admin@smartloc.com"', [adminHash]);
      console.log('✅ Admin password updated');
    } else {
      await db.execute(
        'INSERT INTO users (name, email, password, role, membership, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Super Admin', 'admin@smartloc.com', adminHash, 'admin', 'ULTRA_PREMIUM', 'active']
      );
      console.log('✅ Admin user created');
    }
    
    // Update or insert test user
    const [userExists] = await db.execute('SELECT id FROM users WHERE email = "user@example.com"');
    if (userExists.length > 0) {
      await db.execute('UPDATE users SET password = ? WHERE email = "user@example.com"', [userHash]);
      console.log('✅ Test user password updated');
    } else {
      await db.execute(
        'INSERT INTO users (name, email, password, role, membership, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test User', 'user@example.com', userHash, 'user', 'NORMAL', 'active']
      );
      console.log('✅ Test user created');
    }
    
    res.json({ 
      success: true, 
      message: 'Passwords reset successfully!',
      credentials: {
        admin: { email: 'admin@smartloc.com', password: 'admin123' },
        user: { email: 'user@example.com', password: 'user123' }
      }
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check users endpoint
app.get('/api/auth/check-users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, role, status FROM users');
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== LOCATION ROUTES ====================
// Get all states
app.get('/api/states', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name FROM states ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get districts by state
app.get('/api/districts/:stateId', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name FROM districts WHERE state_id = ? ORDER BY name', [req.params.stateId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get subdistricts by district
app.get('/api/subdistricts/:districtId', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name FROM subdistricts WHERE district_id = ? ORDER BY name', [req.params.districtId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get villages by subdistrict
app.get('/api/villages/:subdistrictId', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, lat, lng FROM villages WHERE subdistrict_id = ? ORDER BY name LIMIT 100', [req.params.subdistrictId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search villages with autocomplete
app.get('/api/search/villages', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  try {
    const [rows] = await db.execute(
      `SELECT v.id, v.name, v.lat, v.lng, s.name as state, d.name as district, sd.name as subdistrict
       FROM villages v
       LEFT JOIN subdistricts sd ON v.subdistrict_id = sd.id
       LEFT JOIN districts d ON sd.district_id = d.id
       LEFT JOIN states s ON d.state_id = s.id
       WHERE v.name LIKE ? 
       LIMIT 20`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get village by ID with coordinates
app.get('/api/village/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, lat, lng FROM villages WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Village not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER ROUTES (Protected) ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Record search
app.post('/api/searches', authenticateToken, async (req, res) => {
  const { villageName, villageId } = req.body;
  try {
    await db.execute(
      'INSERT INTO searches (user_id, village_name, village_id, searched_at) VALUES (?, ?, ?, NOW())',
      [req.user.id, villageName, villageId]
    );
    await db.execute(
      'UPDATE users SET search_count_today = search_count_today + 1 WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user recent searches
app.get('/api/searches/recent', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT village_name, searched_at FROM searches WHERE user_id = ? ORDER BY searched_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { name, bio } = req.body;
  try {
    await db.execute('UPDATE users SET name = ?, bio = ? WHERE id = ?', [name, bio, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit feedback
app.post('/api/feedback', authenticateToken, async (req, res) => {
  const { message } = req.body;
  try {
    await db.execute(
      'INSERT INTO feedback (user_id, message, status, created_at) VALUES (?, ?, "pending", NOW())',
      [req.user.id, message]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request membership upgrade
app.post('/api/upgrade-request', authenticateToken, async (req, res) => {
  const { requestedMembership } = req.body;
  try {
    const dbMembership = convertMembership(requestedMembership);
    await db.execute(
      'INSERT INTO upgrade_requests (user_id, requested_membership, status, created_at) VALUES (?, ?, "pending", NOW())',
      [req.user.id, dbMembership]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN ROUTES ====================
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    const [users] = await db.execute('SELECT role FROM users WHERE id = ?', [user.id]);
    if (users.length === 0 || users[0].role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = user;
    next();
  });
};

// Get all users (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, email, membership, status, role, search_count_today, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user status
app.put('/api/admin/users/:id/status', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user membership
app.put('/api/admin/users/:id/membership', authenticateAdmin, async (req, res) => {
  const { membership } = req.body;
  try {
    const dbMembership = convertMembership(membership);
    await db.execute('UPDATE users SET membership = ? WHERE id = ?', [dbMembership, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all feedback (admin only)
app.get('/api/admin/feedback', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT f.*, u.name as user_name FROM feedback f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update feedback status
app.put('/api/admin/feedback/:id/resolve', authenticateAdmin, async (req, res) => {
  try {
    await db.execute('UPDATE feedback SET status = "resolved" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get upgrade requests (admin only)
app.get('/api/admin/upgrade-requests', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT r.*, u.name as user_name FROM upgrade_requests r JOIN users u ON r.user_id = u.id WHERE r.status = "pending" ORDER BY r.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve upgrade request
app.post('/api/admin/upgrade-requests/:id/approve', authenticateAdmin, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [request] = await connection.execute('SELECT user_id, requested_membership FROM upgrade_requests WHERE id = ?', [req.params.id]);
    if (request.length > 0) {
      await connection.execute('UPDATE users SET membership = ? WHERE id = ?', [request[0].requested_membership, request[0].user_id]);
      await connection.execute('UPDATE upgrade_requests SET status = "approved" WHERE id = ?', [req.params.id]);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Reject upgrade request
app.post('/api/admin/upgrade-requests/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    await db.execute('UPDATE upgrade_requests SET status = "rejected" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get statistics (admin only)
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [activeUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status = "active"');
    const [pendingUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status = "pending"');
    const [totalSearches] = await db.execute('SELECT COUNT(*) as count FROM searches');
    const [membershipStats] = await db.execute('SELECT membership, COUNT(*) as count FROM users GROUP BY membership');
    res.json({
      totalUsers: totalUsers[0].count,
      activeUsers: activeUsers[0].count,
      pendingUsers: pendingUsers[0].count,
      totalSearches: totalSearches[0].count,
      membershipStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get search trends for analytics
app.get('/api/admin/searches/trends', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(searched_at) as date, COUNT(*) as count 
      FROM searches 
      WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(searched_at)
      ORDER BY date ASC
    `);
    const dates = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      const found = rows.find(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
      counts.push(found ? found.count : 0);
    }
    res.json({ dates, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 User Portal: http://localhost:${PORT}`);
  console.log(`👑 Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`\n📝 To fix login issues, run this command:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/auth/reset-passwords`);
  console.log(`\n📝 Default Credentials after reset:`);
  console.log(`   Admin: admin@smartloc.com / admin123`);
  console.log(`   User: user@example.com / user123`);
});