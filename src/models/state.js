const db = require("../config/db");

const State = {
  getAllStates: async () => {
    const [rows] = await db.query(
      "SELECT id, name FROM states ORDER BY name"
    );
    return rows;
  }
};

module.exports = State;