const express = require("express");
const router = express.Router();

const {
  getStates,
  getDistricts,
  getSubdistricts,
  searchVillages
} = require("../controllers/searchController");

router.get("/states", getStates);
router.get("/districts/:stateId", getDistricts);
router.get("/subdistricts/:districtId", getSubdistricts);
router.get("/villages/:subdistrictId", getVillages);
router.get("/search", searchVillages);

module.exports = router;