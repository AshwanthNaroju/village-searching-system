const db = require("../config/db");

exports.getVillagesBySubdistrict = async (subdistrictId) => {
  const [rows] = await db.query(
    "SELECT id, name FROM villages WHERE subdistrict_id = ?",
    [subdistrictId]
  );
  return rows;
};
const Village = {
  searchVillages: async (keyword) => {
    const [rows] = await db.query(
      `SELECT 
        v.name AS village,
        sd.name AS subdistrict,
        d.name AS district,
        s.name AS state
       FROM villages v
       JOIN subdistricts sd ON v.subdistrict_id = sd.id
       JOIN districts d ON sd.district_id = d.id
       JOIN states s ON d.state_id = s.id
       WHERE v.name LIKE ?
       LIMIT 20`,
      [`%${keyword}%`]
    );

    return rows;
  }
};

module.exports = Village;