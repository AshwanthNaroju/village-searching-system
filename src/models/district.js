const db = require("../config/db");

const District = {
  getDistrictsByState: async (stateId) => {
    const [rows] = await db.query(
      "SELECT id, name FROM districts WHERE state_id = ? ORDER BY name",
      [stateId]
    );
    return rows;
  }
};

module.exports = District;
