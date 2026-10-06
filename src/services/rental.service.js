const prisma = require("../config/prisma");

    const createRental = async (rentalData) => {
        return await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({
                where: {
                    id: rentalData.customerId
                }
            });
            if (!customer) {
                throw new Error("customer not found")
            }


            const startDate = new Date(rentalData.startDate);
            if (Number.isNaN(startDate.getTime())) {
                throw new Error("Invalid issue date");
            }
            const endDate = rentalData.endDate
                ? new Date(rentalData.endDate)
                : null;

            if (endDate && Number.isNaN(endDate.getTime())) {
                throw new Error("Invalid end date");
            }

            if (!Array.isArray(rentalData.items) || rentalData.items.length === 0) {
                throw new Error("At least one material is required");
            }


            const rental = await tx.rental.create({
                data: {
                    customerId: rentalData.customerId,
                    startDate: startDate,
                    endDate: endDate,
                    totalAmount: null,
                    notes: rentalData.notes || null
                }
            });

            for (const item of rentalData.items) {
                const material = await tx.material.findUnique({
                    where: {
                        id: item.materialId
                    }
                })

                if (!material || !material.isActive) {
                    throw new Error("Active material not found");
                }

                if (item.quantity <= 0) {
                    throw new Error("Quantity must be greater than 0");
                }

                if (item.quantity > material.availableUnits) {
                    throw new Error(
                        `Requested quantity for ${material.name} is not available`
                    );
                }

                const dailyRentalRate = Number(material.dailyRentalRate);

                // Create rental item
                await tx.rentalItem.create({
                    data: {
                        rentalId: rental.id,
                        materialId: item.materialId,
                        quantity: item.quantity,
                        dailyRentalRate
                    }
                });
                await tx.material.update({
                    where: {
                        id: item.materialId
                    },
                    data: {
                        availableUnits: {
                            decrement: item.quantity
                        }
                    }
                });
            }


            return await tx.rental.findUnique({
                where: {
                    id: rental.id,
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            material: true
                        }
                    }
                }
            })
        })
    }

const getAllRentals = async (page = 1, limit = 10, search = "", status = "") => {

    const skip = (page - 1) * limit
    const where = {
        ...(status ? { status } : {}),
        ...(search ? {
            OR: [
                {
                    customer: {
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                },
                {
                    items:{
                        some:{
                            material: {
                                name: {
                                    contains: search,
                                    mode: "insensitive"
                                }
        
                            }

                        }
                    }
                }
            ]
        } : {})
    };

    const [rentals, totalRentals] = await Promise.all([
        prisma.rental.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                customer: true,
                items:{
                    include:{
                        material:true
                    }
                }
            }
        }),
        prisma.rental.count({
            where
        })
    ]);

    return {
        rentals,
        totalRentals,
        totalPages: Math.ceil(totalRentals / limit),
        currentPage: page

    }

}

const getRentalById = async(id)=>{
    const rental = await prisma.rental.findUnique({
        where: {
            id 
        },
        include:{
            customer: true,
            items:{
                include:{
                    material:true
                }
            }
        }
    })
    if(!rental){
        throw new Error("Rental not found")
    }
    return rental;
}

module.exports = {
    createRental,
    getAllRentals,
    getRentalById
}