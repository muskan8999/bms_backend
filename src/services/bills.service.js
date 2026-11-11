const prisma = require("../config/prisma");

const prisma = require("../config/prisma");

const getAllBills = async ({ page = 1, limit = 10, search = "" }) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 10);
  const skip = (currentPage - 1) * pageSize;

  // 1. Only fetch completed rentals
  const where = {
    status: "COMPLETED",

    ...(search.trim() && {
      OR: [
        {
          id: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          customer: {
            name: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
        {
          customer: {
            phone: {
              contains: search.trim(),
            },
          },
        },
      ],
    }),
  };

  // 2. Fetch bills and total count
  const [rentals, totalBills] = await Promise.all([
    prisma.rental.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        endDate: "desc",
      },
      include: {
        customer: true,
        items: {
          include: {
            material: true,
          },
        },
        payments: true,
      },
    }),

    prisma.rental.count({ where }),
  ]);

  // 3. Transform rentals into bill data
  const bills = rentals.map((rental) => {
    const totalAmount = Number(rental.totalAmount || 0);

    const paidAmount = rental.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const balance = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = "PENDING";

    if (paidAmount >= totalAmount) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);

    const startDay = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    );

    const endDay = Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    );

    const totalDays = Math.max(1, Math.ceil((endDay - startDay) / 86400000));

    return {
      id: rental.id,
      rentalId: rental.id,

      customer: rental.customer,

      issueDate: rental.startDate,
      returnDate: rental.endDate,
      totalDays,

      items: rental.items,

      totalAmount,
      paidAmount,
      balance,

      status: paymentStatus,
    };
  });

  // 4. Pagination information
  const totalPages = Math.ceil(totalBills / pageSize);

  return {
    bills,
    totalBills,
    totalPages,
    currentPage,
    pageSize,
  };
};

const getBillById = async (rentalId) => {
  // 1. Find completed rental
  const rental = await prisma.rental.findFirst({
    where: {
      id: rentalId,
      status: "COMPLETED",
    },
    include: {
      customer: true,
      items: {
        include: {
          material: true,
        },
      },
      payments: true,
    },
  });

  if (!rental) {
    throw new Error("Bill not found");
  }

  // 2. Fetch all return history
  const returns = await prisma.rentalReturn.findMany({
    where: {
      rentalId,
    },
    orderBy: {
      returnDate: "asc",
    },
    include: {
      items: {
        include: {
          rentalItem: {
            include: {
              material: true,
            },
          },
        },
      },
    },
  });

  // 3. Calculate payment summary
  const totalAmount = Number(rental.totalAmount || 0);

  const paidAmount = rental.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const balance = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = "PENDING";

  if (paidAmount >= totalAmount) {
    paymentStatus = "PAID";
  } else if (paidAmount > 0) {
    paymentStatus = "PARTIAL";
  }

  // 4. Calculate rental duration
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);

  const startDay = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );

  const endDay = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  );

  const totalDays = Math.max(1, Math.ceil((endDay - startDay) / 86400000));

  // 5. Calculate bill breakdown
  const subtotal = returns.reduce((sum, record) => {
    const returnDate = new Date(record.returnDate);

    const returnDay = Date.UTC(
      returnDate.getUTCFullYear(),
      returnDate.getUTCMonth(),
      returnDate.getUTCDate(),
    );

    const days = Math.max(1, Math.ceil((returnDay - startDay) / 86400000));

    const returnSubtotal = record.items.reduce((itemSum, item) => {
      return (
        itemSum +
        Number(item.quantity) * Number(item.rentalItem.dailyRentalRate) * days
      );
    }, 0);

    return sum + returnSubtotal;
  }, 0);

  const damageCharges = returns.reduce(
    (sum, record) => sum + Number(record.damageCharges),
    0,
  );

  const additionalCharges = returns.reduce(
    (sum, record) => sum + Number(record.additionalCharges),
    0,
  );

  const discount = returns.reduce(
    (sum, record) => sum + Number(record.discount),
    0,
  );

  // 6. Return complete bill details
  return {
    id: rental.id,
    rentalId: rental.id,

    customer: rental.customer,

    issueDate: rental.startDate,
    returnDate: rental.endDate,
    totalDays,

    items: rental.items,
    returns,

    subtotal,
    damageCharges,
    additionalCharges,
    discount,

    totalAmount,
    paidAmount,
    balance,
    status: paymentStatus,

    payments: rental.payments,
  };
};

module.exports = {
  getAllBills,
  getBillById,
};
