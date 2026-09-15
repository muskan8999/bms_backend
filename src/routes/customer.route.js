const express = require("express");
const { createCustomer, getAllCustomers, updateCustomer, getCusomerById } = require("../controllers/customer.controller");
const router = express.Router();

router.post("/create", createCustomer)
router.get("/all", getAllCustomers)
router.put("/:id", updateCustomer)
router.get("/:id", getCusomerById)

module.exports = router