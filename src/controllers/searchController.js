const State = require("../models/state");
const District = require("../models/district");
const Subdistrict = require("../models/subdistrict");
const Village = require("../models/village");

exports.getStates = async (req, res) => {
  const data = await State.getAllStates();
  res.json(data);
};

exports.getDistricts = async (req, res) => {
  const { stateId } = req.params;
  const data = await District.getDistrictsByState(stateId);
  res.json(data);
};

exports.getSubdistricts = async (req, res) => {
  const { districtId } = req.params;
  const data = await Subdistrict.getSubdistricts(districtId);
  res.json(data);
};
exports.getVillages = async (req, res) => {
  const { subdistrictId } = req.params;

  try {
    const data = await Village.getVillagesBySubdistrict(subdistrictId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching villages" });
  }
};
exports.searchVillages = async (req, res) => {
  const { q } = req.query;

  if (!q) return res.json([]);

  const data = await Village.searchVillages(q);
  res.json(data);
};