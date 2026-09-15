const customerService = require("../services/customer.service");

const createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const customer = await customerService.createCustomer({
      name,
      phone,
      address,
    });
    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.log("create customer error :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const limitNumber = Number(limit) || 10;
    const pageNumber = Number(page) || 1;
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit",
      });
    }
    const result = await customerService.getAllCustomers({
      page: pageNumber,
      limit: limitNumber,
      search: search || "",
    });
    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      result,
    });
  } catch (error) {
    console.log("get all customers error :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "customer not found",
      });
    }
    const customer = await customerService.updateCustomer(id, {
      name,
      phone,
      address,
    });
    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.log("update customer error", error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

const getCusomerById = async(req,res)=>{
  try{
    const {id} = req.params;
    if(!id){
      return res.status(404).json({
        success: false,
        message: "customer not found",
      });
    }
    const customer = await customerService.getCustomerById(id);
    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      customer,
    });

  }catch(error){
    console.log("get customer by id error", error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
}

module.exports = {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  getCusomerById
};
