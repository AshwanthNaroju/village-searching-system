const fs = require("fs");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();

// Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "villages_api",
  waitForConnections: true,
  connectionLimit: 10,
});

// Path to your CSV file
const filePath = path.join(__dirname, "../../data.csv");

console.log("📁 Looking for CSV at:", filePath);

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error("❌ CSV file not found at:", filePath);
  console.log("\n💡 Please place your data.csv file in the project root folder");
  process.exit(1);
}

// Read CSV
const data = fs.readFileSync(filePath, "utf-8");
const rows = data.split("\n");

// Get headers from first row
const headers = rows[0].split(",").map(h => h.trim().replace(/"/g, ''));

console.log("🧠 Headers found:", headers);
console.log("📊 Total rows to process:", rows.length - 1);

const stateMap = new Map();
const districtMap = new Map();
const subdistrictMap = new Map();

let inserted = 0;
let skipped = 0;
let errors = 0;

(async () => {
  try {
    // Test connection first
    const connection = await db.getConnection();
    console.log("✅ Database connected");
    connection.release();

    // Check if data already exists
    const [existingVillages] = await db.execute("SELECT COUNT(*) as count FROM villages");
    if (existingVillages[0].count > 0) {
      console.log(`📊 Database already has ${existingVillages[0].count} villages`);
      console.log("📦 Keeping existing data, will add new records only");
    }

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) {
        skipped++;
        continue;
      }

      // Parse CSV line
      const cols = [];
      let inQuote = false;
      let current = '';
      const line = rows[i];
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          cols.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current.trim());

      if (cols.length < headers.length) {
        skipped++;
        continue;
      }

      const row = {};
      headers.forEach((h, index) => {
        row[h] = cols[index]?.replace(/^"|"$/g, '').trim();
      });

      // Map your CSV columns
      const stateName = row["STATE NAME"];
      const districtName = row["DISTRICT NAME"];
      const subdistrictName = row["SUB-DISTRICT NAME"];
      const villageName = row["VILLAGE/TOWN NAME"];

      if (!stateName || !districtName || !subdistrictName || !villageName) {
        skipped++;
        continue;
      }

      try {
        // Insert State
        if (!stateMap.has(stateName)) {
          const [existing] = await db.execute("SELECT id FROM states WHERE name = ?", [stateName]);
          let stateId;
          if (existing.length > 0) {
            stateId = existing[0].id;
          } else {
            const [result] = await db.execute(
              "INSERT INTO states (name) VALUES (?)",
              [stateName]
            );
            stateId = result.insertId;
          }
          stateMap.set(stateName, stateId);
        }

        const stateId = stateMap.get(stateName);

        // Insert District
        const districtKey = `${stateId}-${districtName}`;
        if (!districtMap.has(districtKey)) {
          const [existing] = await db.execute(
            "SELECT id FROM districts WHERE name = ? AND state_id = ?",
            [districtName, stateId]
          );
          let districtId;
          if (existing.length > 0) {
            districtId = existing[0].id;
          } else {
            const [result] = await db.execute(
              "INSERT INTO districts (name, state_id) VALUES (?, ?)",
              [districtName, stateId]
            );
            districtId = result.insertId;
          }
          districtMap.set(districtKey, districtId);
        }

        const districtId = districtMap.get(districtKey);

        // Insert Subdistrict
        const subdistrictKey = `${districtId}-${subdistrictName}`;
        if (!subdistrictMap.has(subdistrictKey)) {
          const [existing] = await db.execute(
            "SELECT id FROM subdistricts WHERE name = ? AND district_id = ?",
            [subdistrictName, districtId]
          );
          let subdistrictId;
          if (existing.length > 0) {
            subdistrictId = existing[0].id;
          } else {
            const [result] = await db.execute(
              "INSERT INTO subdistricts (name, district_id) VALUES (?, ?)",
              [subdistrictName, districtId]
            );
            subdistrictId = result.insertId;
          }
          subdistrictMap.set(subdistrictKey, subdistrictId);
        }

        const subdistrictId = subdistrictMap.get(subdistrictKey);

        // Check if village already exists
        const [existingVillage] = await db.execute(
          "SELECT id FROM villages WHERE name = ? AND subdistrict_id = ?",
          [villageName, subdistrictId]
        );
        
        if (existingVillage.length === 0) {
          await db.execute(
            "INSERT INTO villages (name, subdistrict_id) VALUES (?, ?)",
            [villageName, subdistrictId]
          );
          inserted++;
        }

        if (inserted % 10000 === 0 && inserted > 0) {
          console.log(`🚀 Inserted: ${inserted} villages...`);
        }

      } catch (err) {
        errors++;
        if (errors < 10) {
          console.error(`❌ Error at row ${i}:`, err.message);
        }
      }
    }

    console.log("\n📊 Import Summary:");
    console.log("✅ New villages inserted:", inserted);
    console.log("⚠️ Skipped rows:", skipped);
    console.log("❌ Errors:", errors);

    // Show final counts
    const [stateCount] = await db.execute("SELECT COUNT(*) as count FROM states");
    const [districtCount] = await db.execute("SELECT COUNT(*) as count FROM districts");
    const [subdistrictCount] = await db.execute("SELECT COUNT(*) as count FROM subdistricts");
    const [villageCount] = await db.execute("SELECT COUNT(*) as count FROM villages");
    
    console.log("\n📊 Database Summary:");
    console.log(`   States: ${stateCount[0].count}`);
    console.log(`   Districts: ${districtCount[0].count}`);
    console.log(`   Subdistricts: ${subdistrictCount[0].count}`);
    console.log(`   Villages: ${villageCount[0].count}`);

    console.log("\n🎉 Import completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Run the SQL ALTER statements above to fix users table");
    console.log("2. Start the server: node server.js");
    console.log("3. Access the app: http://localhost:5000");
    
    process.exit(0);

  } catch (err) {
    console.error("❌ Fatal error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
