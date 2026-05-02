const State = require("../models/State");
const District = require("../models/District");
const Subdistrict = require("../models/Subdistrict");
const Village = require("../models/Village");
const User = require("../models/User");

exports.getStates = async (req, res) => {
  try {
    const states = await State.getAll();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDistricts = async (req, res) => {
  try {
    const districts = await District.getByStateId(req.params.stateId);
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubdistricts = async (req, res) => {
  try {
    const subdistricts = await Subdistrict.getByDistrictId(req.params.districtId);
    res.json(subdistricts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVillages = async (req, res) => {
  try {
    const villages = await Village.getBySubdistrictId(req.params.subdistrictId);
    res.json(villages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchVillages = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const results = await Village.search(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recordSearch = async (req, res) => {
  try {
    const { villageName, villageId } = req.body;
    const db = require("../config/db");
    await db.execute(
      "INSERT INTO searches (user_id, village_name, village_id, searched_at) VALUES (?, ?, ?, NOW())",
      [req.user.id, villageName, villageId]
    );
    await User.incrementSearchCount(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecentSearches = async (req, res) => {
  try {
    const db = require("../config/db");
    const [rows] = await db.execute(
      "SELECT village_name, searched_at FROM searches WHERE user_id = ? ORDER BY searched_at DESC LIMIT 10",
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};