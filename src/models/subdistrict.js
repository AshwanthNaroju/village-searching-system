const db = require("../config/db");

const Subdistrict = {
  getSubdistricts: async (districtId) => {
    const [rows] = await db.query(
      "SELECT id, name FROM subdistricts WHERE district_id = ? ORDER BY name",
      [districtId]
    );
    return rows;
  }
};

module.exports = Subdistrict;