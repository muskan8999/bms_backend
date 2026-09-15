const prisma = require("../config/prisma");

const createCustomer = async(customerData)=>{
    const customer = await prisma.customer.create({
        data: customerData
    })
    return customer;
}

const getAllCustomers = async({page=1, limit=10, search = ""})=>{
    const skip = (page-1) * limit
    const where = search ? {
        OR:[
            {name:{
                contains: search,
                mode: "insensitive"
            }},
            {phone:{
                contains: search,
                mode: "insensitive"
            }}
        ]
    }:{};
    const [customers, totalCustomers] = await Promise.all([
        prisma.customer.findMany({
            where,
            skip,
            take:limit,
            orderBy:{
                createdAt: "desc"
            }
        }),
        prisma.customer.count({
            where,
        })
    ])
    return {
        customers,
        totalCustomers,
        totalPages: Math.ceil(totalCustomers/limit),
        currentPage: page
    }
}

const updateCustomer = async(customerId, customerData)=>{
    const customer = await prisma.customer.update({
        where:{
            id: customerId
        },
        data:customerData
    })
    return customer;
}

const getCustomerById = async(customerId)=>{
    const customer = await prisma.customer.findUnique({
        where:{
            id:customerId
        }
    })
    return customer;
}


module.exports = {
    createCustomer,
    getAllCustomers,
    updateCustomer,
    getCustomerById
}