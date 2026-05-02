const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { authenticateToken } = require("../middleware/auth");

router.get("/states", locationController.getStates);
router.get("/districts/:stateId", locationController.getDistricts);
router.get("/subdistricts/:districtId", locationController.getSubdistricts);
router.get("/villages/:subdistrictId", locationController.getVillages);
router.get("/search/villages", locationController.searchVillages);
router.post("/searches", authenticateToken, locationController.recordSearch);
router.get("/searches/recent", authenticateToken, locationController.getRecentSearches);

module.exports = router;