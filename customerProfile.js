/* =========================
   customerProfile.js
========================= */

"use strict";

window.DashboardCustomerProfile = (() => {
    const utils = window.DashboardUtils;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before customerProfile.js."
        );
    }

    let invoiceRows = [];
    let collectionRows = [];
    let dueRows = [];
    let targetRows = [];

    let selectedCustomerCode = "";
    let selectedCustomerName = "";

    let invoiceSearchText = "";
    let collectionSearchText = "";
    let dueSearchText = "";

    let eventsBound = false;

    let salesChart = null;
    let collectionsChart = null;
    let balanceChart = null;

    /* =========================
       Helpers
    ========================= */

    function normalizeCode(value) {
        return utils.normalizeCode(value);
    }

    function normalizeText(value) {
        return utils.normalizeText(value);
    }

    function getValue(row, keys, fallback = "") {
        return utils.firstValue(
            row || {},
            keys,
            fallback
        );
    }

    function toNumber(value) {
        return utils.toNumber(value);
    }

    function getCustomerCode(row) {
        return normalizeCode(
            getValue(
                row,
                [
                    "customerCode",
                    "Customer Code",
                    "customer_code",
                    "accountCode",
                    "Account Code",
                    "account",
                    "code"
                ],
                ""
            )
        );
    }

    function getCustomerName(row) {
        return String(
            getValue(
                row,
                [
                    "customerName",
                    "Customer Name",
                    "customer_name",
                    "customer",
                    "accountName",
                    "Account Name"
                ],
                ""
            )
        ).trim();
    }

    function getSalesmanCode(row) {
        return normalizeCode(
            getValue(
                row,
                [
                    "salesmanCode",
                    "Salesman Code",
                    "salesman_code",
                    "salesCode",
                    "Sales Code"
                ],
                ""
            )
        );
    }

    function getSalesmanName(row) {
        return String(
            getValue(
                row,
                [
                    "salesmanName",
                    "Salesman Name",
                    "salesman_name",
                    "salesName",
                    "Sales Name"
                ],
                ""
            )
        ).trim();
    }

    function getBranch(row) {
        return String(
            getValue(
                row,
                [
                    "branch",
                    "Branch",
                    "city",
                    "City",
                    "region",
                    "Region"
                ],
                ""
            )
        ).trim();
    }

    function getInvoiceNumber(row) {
        return String(
            getValue(
                row,
                [
                    "invoiceNumber",
                    "Invoice Number",
                    "invoiceNo",
                    "Invoice No",
                    "invoice",
                    "documentNumber",
                    "Document Number"
                ],
                ""
            )
        ).trim();
    }

    function getInvoiceType(row) {
        return String(
            getValue(
                row,
                [
                    "invoiceType",
                    "Invoice Type",
                    "type",
                    "Type"
                ],
                ""
            )
        ).trim();
    }

    function getInvoiceDate(row) {
        return getValue(
            row,
            [
                "invoiceDate",
                "Invoice Date",
                "invoice_date",
                "date",
                "Date"
            ],
            ""
        );
    }

    function getInvoiceSales(row) {
        return toNumber(
            getValue(
                row,
                [
                    "salesWithoutTax",
                    "Sales Without Tax",
                    "netSale",
                    "netSales",
                    "Net Sales",
                    "netAmount",
                    "Net Amount",
                    "amount",
                    "Amount"
                ],
                0
            )
        );
    }

    function getReceiptNumber(row) {
        return String(
            getValue(
                row,
                [
                    "receiptNumber",
                    "Receipt Number",
                    "receiptNo",
                    "Receipt No",
                    "paymentReceiptNumber",
                    "Payment Receipt Number",
                    "voucherNumber",
                    "Voucher Number"
                ],
                ""
            )
        ).trim();
    }

    function getPaymentReceiptNumber(row) {
        return String(
            getValue(
                row,
                [
                    "paymentReceiptNumber",
                    "Payment Receipt Number",
                    "paymentReceiptNo",
                    "Payment Receipt No",
                    "voucherNumber",
                    "Voucher Number"
                ],
                ""
            )
        ).trim();
    }

    function getCollectionDate(row) {
        return getValue(
            row,
            [
                "collectionDate",
                "Collection Date",
                "paymentDate",
                "Payment Date",
                "receiptDate",
                "Receipt Date",
                "date",
                "Date"
            ],
            ""
        );
    }

    function getCollectionAmount(row) {
        return toNumber(
            getValue(
                row,
                [
                    "collectionAmount",
                    "Collection Amount",
                    "collection",
                    "paymentAmount",
                    "Payment Amount",
                    "paidAmount",
                    "Paid Amount",
                    "amount",
                    "Amount"
                ],
                0
            )
        );
    }

    function getBalance(row) {
        return toNumber(
            getValue(
                row,
                [
                    "invoiceBalance",
                    "Invoice Balance",
                    "balance",
                    "Balance",
                    "totalBalance",
                    "Total Balance",
                    "outstanding",
                    "Outstanding",
                    "amount",
                    "Amount"
                ],
                0
            )
        );
    }

    function getDueAmount(row) {
        const directDue = getValue(
            row,
            [
                "dueAmount",
                "Due Amount",
                "due",
                "Due"
            ],
            null
        );

        if (
            directDue !== null &&
            directDue !== ""
        ) {
            return toNumber(directDue);
        }

        return getStatus(row) === "due"
            ? getBalance(row)
            : 0;
    }

    function getOverdueAmount(row) {
        const directOverdue = getValue(
            row,
            [
                "overdueAmount",
                "Overdue Amount",
                "overdue",
                "Overdue"
            ],
            null
        );

        if (
            directOverdue !== null &&
            directOverdue !== ""
        ) {
            return toNumber(directOverdue);
        }

        return getStatus(row) === "overdue"
            ? getBalance(row)
            : 0;
    }

    function getOverdueDays(row) {
        return Math.max(
            0,
            toNumber(
                getValue(
                    row,
                    [
                        "overdueDays",
                        "Overdue Days",
                        "outstandingDays",
                        "Outstanding Days",
                        "agingDays",
                        "Aging Days"
                    ],
                    0
                )
            )
        );
    }

    function getCreditLimit(row) {
        return toNumber(
            getValue(
                row,
                [
                    "creditLimit",
                    "Credit Limit",
                    "credit",
                    "Credit"
                ],
                0
            )
        );
    }

    function getDueDate(row) {
        return getValue(
            row,
            [
                "dueDate",
                "Due Date",
                "maturityDate",
                "Maturity Date"
            ],
            ""
        );
    }

    function getStatus(row) {
        const rawStatus = normalizeText(
            getValue(
                row,
                [
                    "status",
                    "Status",
                    "paymentStatus",
                    "Payment Status"
                ],
                ""
            )
        ).replace(/\s+/g, "");

        if (
            rawStatus === "overdue" ||
            rawStatus === "متأخر" ||
            rawStatus === "متاخر" ||
            rawStatus === "pastdue" ||
            getOverdueDays(row) > 0
        ) {
            return "overdue";
        }

        return "due";
    }

    function getAgingLabel(row) {
        const days = getOverdueDays(row);

        if (days <= 0) {
            return utils.t(
                "dueOverdue.notOverdue",
                "غير متأخر"
            );
        }

        if (days <= 30) {
            return utils.t(
                "dueOverdue.days1To30",
                "من 1 إلى 30 يومًا"
            );
        }

        if (days <= 60) {
            return utils.t(
                "dueOverdue.days31To60",
                "من 31 إلى 60 يومًا"
            );
        }

        if (days <= 90) {
            return utils.t(
                "dueOverdue.days61To90",
                "من 61 إلى 90 يومًا"
            );
        }

        return utils.t(
            "dueOverdue.moreThan90Days",
            "أكثر من 90 يومًا"
        );
    }

    function getTargetSalesmanName(code) {
        const row = targetRows.find(
            item =>
                getSalesmanCode(item) === code
        );

        return row
            ? getSalesmanName(row)
            : "";
    }

    function getTargetBranch(code) {
        const row = targetRows.find(
            item =>
                getSalesmanCode(item) === code
        );

        return row
            ? getBranch(row)
            : "";
    }

    function isSameCustomer(row) {
        const rowCode = getCustomerCode(row);
        const rowName = normalizeText(
            getCustomerName(row)
        );

        if (
            selectedCustomerCode &&
            rowCode
        ) {
            return (
                rowCode === selectedCustomerCode
            );
        }

        if (
            selectedCustomerName &&
            rowName
        ) {
            return (
                rowName ===
                normalizeText(
                    selectedCustomerName
                )
            );
        }

        return false;
    }

    function getLatestDate(rows, dateGetter) {
        let latestValue = "";
        let latestDate = null;

        rows.forEach(row => {
            const value = dateGetter(row);
            const parsed = utils.parseDate(value);

            if (
                parsed &&
                (
                    !latestDate ||
                    parsed > latestDate
                )
            ) {
                latestDate = parsed;
                latestValue = value;
            }
        });

        return latestValue;
    }

    function getEarliestDate(rows, dateGetter) {
        let earliestValue = "";
        let earliestDate = null;

        rows.forEach(row => {
            const value = dateGetter(row);
            const parsed = utils.parseDate(value);

            if (
                parsed &&
                (
                    !earliestDate ||
                    parsed < earliestDate
                )
            ) {
                earliestDate = parsed;
                earliestValue = value;
            }
        });

        return earliestValue;
    }

    function getMonthKey(value) {
        const date = utils.parseDate(value);

        if (!date) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        return `${year}-${month}`;
    }

    function formatMonthLabel(monthKey) {
        if (!monthKey) {
            return "--";
        }

        const [year, month] =
            monthKey.split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            1
        );

        try {
            return new Intl.DateTimeFormat(
                utils.getLocale(),
                {
                    month: "short",
                    year: "numeric"
                }
            ).format(date);
        } catch (error) {
            return monthKey;
        }
    }

    function escapeAttribute(value) {
        return utils
            .escapeHTML(value)
            .replace(/"/g, "&quot;");
    }

    function destroyChart(chart) {
        if (
            chart &&
            typeof chart.destroy ===
                "function"
        ) {
            chart.destroy();
        }
    }

    /* =========================
       Data setters
    ========================= */

    function setData(data = {}) {
        invoiceRows = Array.isArray(
            data.invoices
        )
            ? data.invoices
            : [];

        collectionRows = Array.isArray(
            data.collections
        )
            ? data.collections
            : [];

        dueRows = Array.isArray(
            data.dueOverdue
        )
            ? data.dueOverdue
            : [];

        targetRows = Array.isArray(
            data.target
        )
            ? data.target
            : [];

        if (selectedCustomerCode) {
            render();
        }
    }

    function setInvoices(rows = []) {
        invoiceRows = Array.isArray(rows)
            ? rows
            : [];

        if (selectedCustomerCode) {
            render();
        }
    }

    function setCollections(rows = []) {
        collectionRows = Array.isArray(rows)
            ? rows
            : [];

        if (selectedCustomerCode) {
            render();
        }
    }

    function setDueOverdue(rows = []) {
        dueRows = Array.isArray(rows)
            ? rows
            : [];

        if (selectedCustomerCode) {
            render();
        }
    }

    function setTargets(rows = []) {
        targetRows = Array.isArray(rows)
            ? rows
            : [];

        if (selectedCustomerCode) {
            render();
        }
    }

    /* =========================
       Customer lists
    ========================= */

    function getCustomers() {
        const map = new Map();

        [
            ...invoiceRows,
            ...collectionRows,
            ...dueRows
        ].forEach(row => {
            const code = getCustomerCode(row);
            const name = getCustomerName(row);

            const key =
                code ||
                normalizeText(name);

            if (!key) {
                return;
            }

            if (!map.has(key)) {
                map.set(key, {
                    code,
                    name,
                    salesmanCode:
                        getSalesmanCode(row),
                    salesmanName:
                        getSalesmanName(row),
                    branch:
                        getBranch(row)
                });

                return;
            }

            const customer = map.get(key);

            if (
                !customer.code &&
                code
            ) {
                customer.code = code;
            }

            if (
                !customer.name &&
                name
            ) {
                customer.name = name;
            }

            if (
                !customer.salesmanCode
            ) {
                customer.salesmanCode =
                    getSalesmanCode(row);
            }

            if (
                !customer.salesmanName
            ) {
                customer.salesmanName =
                    getSalesmanName(row);
            }

            if (!customer.branch) {
                customer.branch =
                    getBranch(row);
            }
        });

        return Array.from(
            map.values()
        ).sort(
            (first, second) =>
                first.name.localeCompare(
                    second.name,
                    utils.getLocale(),
                    {
                        numeric: true
                    }
                )
        );
    }

    function populateCustomerSelect() {
        const select = utils.byId(
            "customerProfileSelect"
        );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const customers =
            getCustomers();

        select.innerHTML = `
            <option value="">
                ${utils.escapeHTML(
                    utils.t(
                        "customerProfile.selectCustomer",
                        "اختر العميل"
                    )
                )}
            </option>

            ${customers
                .map(customer => `
                    <option
                        value="${escapeAttribute(
                            customer.code ||
                                customer.name
                        )}"
                        data-customer-code="${escapeAttribute(
                            customer.code
                        )}"
                        data-customer-name="${escapeAttribute(
                            customer.name
                        )}"
                    >
                        ${utils.escapeHTML(
                            customer.name ||
                                customer.code
                        )}
                        ${
                            customer.code
                                ? `(${utils.escapeHTML(
                                      customer.code
                                  )})`
                                : ""
                        }
                    </option>
                `)
                .join("")}
        `;

        if (
            selectedCustomerCode ||
            selectedCustomerName
        ) {
            const option =
                Array.from(
                    select.options
                ).find(item => {
                    const code =
                        normalizeCode(
                            item.dataset
                                .customerCode
                        );

                    const name =
                        normalizeText(
                            item.dataset
                                .customerName
                        );

                    return (
                        (
                            selectedCustomerCode &&
                            code ===
                                selectedCustomerCode
                        ) ||
                        (
                            selectedCustomerName &&
                            name ===
                                normalizeText(
                                    selectedCustomerName
                                )
                        )
                    );
                });

            if (option) {
                select.value =
                    option.value;
                return;
            }
        }

        select.value =
            currentValue || "";
    }

    /* =========================
       Build customer profile
    ========================= */

    function buildProfile(
        customerCode,
        customerName = ""
    ) {
        selectedCustomerCode =
            normalizeCode(customerCode);

        selectedCustomerName =
            String(customerName || "")
                .trim();

        const invoices =
            invoiceRows.filter(
                isSameCustomer
            );

        const collections =
            collectionRows.filter(
                isSameCustomer
            );

        const balances =
            dueRows.filter(
                isSameCustomer
            );

        const firstRow =
            invoices[0] ||
            collections[0] ||
            balances[0] ||
            {};

        const resolvedCode =
            selectedCustomerCode ||
            getCustomerCode(firstRow);

        const resolvedName =
            selectedCustomerName ||
            getCustomerName(firstRow) ||
            resolvedCode ||
            "--";

        const salesmanCodes =
            [
                ...invoices,
                ...collections,
                ...balances
            ]
                .map(getSalesmanCode)
                .filter(Boolean);

        const salesmanCode =
            salesmanCodes[0] || "";

        const suppliedSalesmanName =
            [
                ...invoices,
                ...collections,
                ...balances
            ]
                .map(getSalesmanName)
                .find(Boolean) || "";

        const salesmanName =
            suppliedSalesmanName ||
            getTargetSalesmanName(
                salesmanCode
            ) ||
            salesmanCode ||
            "--";

        const branch =
            [
                ...invoices,
                ...collections,
                ...balances
            ]
                .map(getBranch)
                .find(Boolean) ||
            getTargetBranch(
                salesmanCode
            ) ||
            "--";

        const sales = utils.sumBy(
            invoices,
            getInvoiceSales
        );

        const collectionsTotal =
            utils.sumBy(
                collections,
                getCollectionAmount
            );

        const due = utils.sumBy(
            balances,
            getDueAmount
        );

        const overdue = utils.sumBy(
            balances,
            getOverdueAmount
        );

        const outstanding =
            due + overdue;

        const collectionRate =
            sales > 0
                ? (
                    collectionsTotal /
                    sales
                ) * 100
                : 0;

        const averageInvoice =
            invoices.length > 0
                ? sales /
                  invoices.length
                : 0;

        const creditLimit =
            balances.reduce(
                (maximum, row) =>
                    Math.max(
                        maximum,
                        getCreditLimit(row)
                    ),
                0
            );

        const maxOverdueDays =
            balances.reduce(
                (maximum, row) =>
                    Math.max(
                        maximum,
                        getOverdueDays(row)
                    ),
                0
            );

        const lastPurchase =
            getLatestDate(
                invoices,
                getInvoiceDate
            );

        const firstPurchase =
            getEarliestDate(
                invoices,
                getInvoiceDate
            );

        const lastCollection =
            getLatestDate(
                collections,
                getCollectionDate
            );

        const availableCredit =
            creditLimit > 0
                ? Math.max(
                    0,
                    creditLimit -
                        outstanding
                )
                : 0;

        const creditUsageRate =
            creditLimit > 0
                ? (
                    outstanding /
                    creditLimit
                ) * 100
                : 0;

        let status = "active";

        if (overdue > 0) {
            status = "overdue";
        } else if (
            outstanding > creditLimit &&
            creditLimit > 0
        ) {
            status = "overLimit";
        } else if (
            invoices.length === 0 &&
            collections.length === 0
        ) {
            status = "inactive";
        }

        return {
            code: resolvedCode,
            name: resolvedName,

            salesmanCode,
            salesmanName,
            branch,

            sales,
            collections:
                collectionsTotal,

            due,
            overdue,
            outstanding,

            creditLimit,
            availableCredit,
            creditUsageRate,

            collectionRate,
            averageInvoice,

            invoiceCount:
                invoices.length,

            collectionCount:
                collections.length,

            balanceCount:
                balances.length,

            maxOverdueDays,

            lastPurchase,
            firstPurchase,
            lastCollection,

            status,

            invoices,
            collectionsRows:
                collections,

            balances
        };
    }

    function getSelectedCustomer() {
        const select = utils.byId(
            "customerProfileSelect"
        );

        if (!select) {
            return {
                code:
                    selectedCustomerCode,
                name:
                    selectedCustomerName
            };
        }

        const selectedOption =
            select.options[
                select.selectedIndex
            ];

        return {
            code:
                normalizeCode(
                    selectedOption?.dataset
                        ?.customerCode
                ) ||
                normalizeCode(
                    select.value
                ),

            name:
                String(
                    selectedOption?.dataset
                        ?.customerName ||
                        ""
                ).trim()
        };
    }

    /* =========================
       Status
    ========================= */

    function getStatusLabel(status) {
        switch (status) {
            case "overdue":
                return utils.t(
                    "customerProfile.overdue",
                    "متأخر"
                );

            case "overLimit":
                return utils.t(
                    "customerProfile.overLimit",
                    "متجاوز الحد الائتماني"
                );

            case "inactive":
                return utils.t(
                    "customerProfile.inactive",
                    "غير نشط"
                );

            default:
                return utils.t(
                    "customerProfile.active",
                    "نشط"
                );
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case "overdue":
            case "overLimit":
                return "status-warning";

            case "inactive":
                return "status-neutral";

            default:
                return "status-success";
        }
    }

    /* =========================
       Header and KPIs
    ========================= */

    function setProfileValues(profile) {
        utils.setText(
            "customerProfileName",
            profile.name
        );

        utils.setText(
            "customerProfileCode",
            profile.code || "--"
        );

        utils.setText(
            "customerProfileSalesman",
            profile.salesmanName
        );

        utils.setText(
            "customerProfileSalesmanCode",
            profile.salesmanCode ||
                "--"
        );

        utils.setText(
            "customerProfileBranch",
            profile.branch
        );

        utils.setText(
            "customerProfileCreditLimit",
            utils.formatCurrency(
                profile.creditLimit
            )
        );

        utils.setText(
            "customerProfileSalesValue",
            utils.formatCurrency(
                profile.sales
            )
        );

        utils.setText(
            "customerProfileCollectionsValue",
            utils.formatCurrency(
                profile.collections
            )
        );

        utils.setText(
            "customerProfileDueValue",
            utils.formatCurrency(
                profile.due
            )
        );

        utils.setText(
            "customerProfileOverdueValue",
            utils.formatCurrency(
                profile.overdue
            )
        );

        utils.setText(
            "customerProfileOutstandingValue",
            utils.formatCurrency(
                profile.outstanding
            )
        );

        utils.setText(
            "customerProfileCollectionRateValue",
            utils.formatPercentage(
                profile.collectionRate
            )
        );

        utils.setText(
            "customerProfileAverageInvoiceValue",
            utils.formatCurrency(
                profile.averageInvoice
            )
        );

        utils.setText(
            "customerProfileLastPurchaseValue",
            utils.formatDate(
                profile.lastPurchase
            )
        );

        utils.setText(
            "customerProfileLastCollectionValue",
            utils.formatDate(
                profile.lastCollection
            )
        );

        utils.setText(
            "customerProfileInvoiceCountValue",
            utils.formatNumber(
                profile.invoiceCount
            )
        );

        utils.setText(
            "customerProfileOverdueDaysValue",
            utils.formatNumber(
                profile.maxOverdueDays
            )
        );

        utils.setText(
            "customerProfileAvailableCreditValue",
            utils.formatCurrency(
                profile.availableCredit
            )
        );

        utils.setText(
            "customerProfileCreditUsageValue",
            utils.formatPercentage(
                profile.creditUsageRate
            )
        );

        const statusElement =
            utils.byId(
                "customerProfileStatus"
            );

        if (statusElement) {
            statusElement.textContent =
                getStatusLabel(
                    profile.status
                );

            statusElement.className =
                `status-badge ${getStatusClass(
                    profile.status
                )}`;
        }

        const creditProgress =
            utils.byId(
                "customerCreditUsageProgress"
            );

        if (creditProgress) {
            creditProgress.style.width =
                `${Math.min(
                    100,
                    Math.max(
                        0,
                        profile.creditUsageRate
                    )
                )}%`;
        }
    }

    /* =========================
       Invoices table
    ========================= */

    function getFilteredInvoices(rows) {
        const searchText =
            normalizeText(
                invoiceSearchText ||
                    utils.byId(
                        "customerInvoicesSearchInput"
                    )?.value ||
                    ""
            );

        if (!searchText) {
            return rows;
        }

        return rows.filter(row =>
            [
                getInvoiceNumber(row),
                getInvoiceDate(row),
                getInvoiceType(row),
                getInvoiceSales(row),
                getSalesmanName(row),
                getBranch(row)
            ].some(value =>
                normalizeText(value)
                    .includes(searchText)
            )
        );
    }

    function createInvoiceRow(row) {
        return `
            <tr>
                <td>
                    ${utils.escapeHTML(
                        getInvoiceNumber(row) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.formatDate(
                        getInvoiceDate(row)
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getInvoiceType(row) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getSalesmanCode(row) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getSalesmanName(row) ||
                            getTargetSalesmanName(
                                getSalesmanCode(
                                    row
                                )
                            ) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getBranch(row) ||
                            getTargetBranch(
                                getSalesmanCode(
                                    row
                                )
                            ) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        getInvoiceSales(row)
                    )}
                </td>
            </tr>
        `;
    }

    function renderInvoices(profile) {
        const tableBody =
            utils.byId(
                "customerInvoicesTableBody"
            );

        if (!tableBody) {
            return;
        }

        const rows =
            getFilteredInvoices(
                profile.invoices
            ).sort((first, second) => {
                const firstDate =
                    utils.parseDate(
                        getInvoiceDate(first)
                    );

                const secondDate =
                    utils.parseDate(
                        getInvoiceDate(second)
                    );

                return (
                    (
                        secondDate?.getTime() ||
                        0
                    ) -
                    (
                        firstDate?.getTime() ||
                        0
                    )
                );
            });

        tableBody.innerHTML =
            rows.length > 0
                ? rows
                      .map(createInvoiceRow)
                      .join("")
                : utils.emptyTableRow(
                      7,
                      utils.t(
                          "common.noData",
                          "لا توجد بيانات متاحة"
                      )
                  );

        const total = utils.sumBy(
            rows,
            getInvoiceSales
        );

        const footer =
            utils.byId(
                "customerInvoicesTableFooter"
            );

        if (footer) {
            footer.innerHTML = `
                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "common.records",
                            "عدد السجلات"
                        )
                    )}:
                    <strong>
                        ${utils.formatNumber(
                            rows.length
                        )}
                    </strong>
                </span>

                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "customerProfile.totalSales",
                            "إجمالي المبيعات"
                        )
                    )}:
                    <strong>
                        ${utils.formatCurrency(
                            total
                        )}
                    </strong>
                </span>
            `;
        }
    }

    /* =========================
       Collections table
    ========================= */

    function getFilteredCollections(rows) {
        const searchText =
            normalizeText(
                collectionSearchText ||
                    utils.byId(
                        "customerCollectionsSearchInput"
                    )?.value ||
                    ""
            );

        if (!searchText) {
            return rows;
        }

        return rows.filter(row =>
            [
                getReceiptNumber(row),
                getPaymentReceiptNumber(
                    row
                ),
                getCollectionDate(row),
                getCollectionAmount(row),
                getSalesmanName(row),
                getBranch(row)
            ].some(value =>
                normalizeText(value)
                    .includes(searchText)
            )
        );
    }

    function createCollectionRow(row) {
        return `
            <tr>
                <td>
                    ${utils.escapeHTML(
                        getReceiptNumber(row) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getPaymentReceiptNumber(
                            row
                        ) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.formatDate(
                        getCollectionDate(row)
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getSalesmanCode(row) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getSalesmanName(row) ||
                            getTargetSalesmanName(
                                getSalesmanCode(
                                    row
                                )
                            ) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getBranch(row) ||
                            getTargetBranch(
                                getSalesmanCode(
                                    row
                                )
                            ) ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        getCollectionAmount(
                            row
                        )
                    )}
                </td>
            </tr>
        `;
    }

    function renderCollections(profile) {
        const tableBody =
            utils.byId(
                "customerCollectionsTableBody"
            );

        if (!tableBody) {
            return;
        }

        const rows =
            getFilteredCollections(
                profile.collectionsRows
            ).sort((first, second) => {
                const firstDate =
                    utils.parseDate(
                        getCollectionDate(
                            first
                        )
                    );

                const secondDate =
                    utils.parseDate(
                        getCollectionDate(
                            second
                        )
                    );

                return (
                    (
                        secondDate?.getTime() ||
                        0
                    ) -
                    (
                        firstDate?.getTime() ||
                        0
                    )
                );
            });

        tableBody.innerHTML =
            rows.length > 0
                ? rows
                      .map(
                          createCollectionRow
                      )
                      .join("")
                : utils.emptyTableRow(
                      7,
                      utils.t(
                          "common.noData",
                          "لا توجد بيانات متاحة"
                      )
                  );

        const total = utils.sumBy(
            rows,
            getCollectionAmount
        );

        const footer =
            utils.byId(
                "customerCollectionsTableFooter"
            );

        if (footer) {
            footer.innerHTML = `
                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "common.records",
                            "عدد السجلات"
                        )
                    )}:
                    <strong>
                        ${utils.formatNumber(
                            rows.length
                        )}
                    </strong>
                </span>

                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "customerProfile.totalCollections",
                            "إجمالي التحصيلات"
                        )
                    )}:
                    <strong>
                        ${utils.formatCurrency(
                            total
                        )}
                    </strong>
                </span>
            `;
        }
    }

    /* =========================
       Due table
    ========================= */

    function getFilteredBalances(rows) {
        const searchText =
            normalizeText(
                dueSearchText ||
                    utils.byId(
                        "customerDueSearchInput"
                    )?.value ||
                    ""
            );

        if (!searchText) {
            return rows;
        }

        return rows.filter(row =>
            [
                getDueDate(row),
                getBalance(row),
                getDueAmount(row),
                getOverdueAmount(row),
                getOverdueDays(row),
                getAgingLabel(row),
                getStatusLabel(
                    getStatus(row)
                )
            ].some(value =>
                normalizeText(value)
                    .includes(searchText)
            )
        );
    }

    function createBalanceRow(row) {
        const status =
            getStatus(row);

        return `
            <tr>
                <td>
                    ${utils.formatDate(
                        getDueDate(row)
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        getCreditLimit(row)
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        getDueAmount(row)
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        getOverdueAmount(row)
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        getBalance(row)
                    )}
                </td>

                <td>
                    ${utils.formatNumber(
                        getOverdueDays(row)
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getAgingLabel(row)
                    )}
                </td>

                <td>
                    <span class="status-badge ${
                        status === "overdue"
                            ? "status-warning"
                            : "status-success"
                    }">
                        ${utils.escapeHTML(
                            status === "overdue"
                                ? utils.t(
                                      "customerProfile.overdue",
                                      "متأخر"
                                  )
                                : utils.t(
                                      "customerProfile.due",
                                      "مستحق"
                                  )
                        )}
                    </span>
                </td>
            </tr>
        `;
    }

    function renderBalances(profile) {
        const tableBody =
            utils.byId(
                "customerDueTableBody"
            );

        if (!tableBody) {
            return;
        }

        const rows =
            getFilteredBalances(
                profile.balances
            ).sort(
                (first, second) =>
                    getOverdueDays(second) -
                    getOverdueDays(first)
            );

        tableBody.innerHTML =
            rows.length > 0
                ? rows
                      .map(createBalanceRow)
                      .join("")
                : utils.emptyTableRow(
                      8,
                      utils.t(
                          "common.noData",
                          "لا توجد بيانات متاحة"
                      )
                  );

        const dueTotal =
            utils.sumBy(
                rows,
                getDueAmount
            );

        const overdueTotal =
            utils.sumBy(
                rows,
                getOverdueAmount
            );

        const footer =
            utils.byId(
                "customerDueTableFooter"
            );

        if (footer) {
            footer.innerHTML = `
                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "common.records",
                            "عدد السجلات"
                        )
                    )}:
                    <strong>
                        ${utils.formatNumber(
                            rows.length
                        )}
                    </strong>
                </span>

                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "customerProfile.totalDue",
                            "إجمالي المستحق"
                        )
                    )}:
                    <strong>
                        ${utils.formatCurrency(
                            dueTotal
                        )}
                    </strong>
                </span>

                <span>
                    ${utils.escapeHTML(
                        utils.t(
                            "customerProfile.totalOverdue",
                            "إجمالي المتأخر"
                        )
                    )}:
                    <strong>
                        ${utils.formatCurrency(
                            overdueTotal
                        )}
                    </strong>
                </span>
            `;
        }
    }

    /* =========================
       Charts
    ========================= */

    function buildMonthlySeries(
        rows,
        dateGetter,
        amountGetter
    ) {
        const map = new Map();

        rows.forEach(row => {
            const key = getMonthKey(
                dateGetter(row)
            );

            if (!key) {
                return;
            }

            map.set(
                key,
                (
                    map.get(key) ||
                    0
                ) +
                    amountGetter(row)
            );
        });

        return map;
    }

    function renderCharts(profile) {
        if (
            typeof window.Chart !==
            "function"
        ) {
            return;
        }

        const salesCanvas =
            utils.byId(
                "customerSalesChart"
            );

        const collectionsCanvas =
            utils.byId(
                "customerCollectionsChart"
            );

        const balanceCanvas =
            utils.byId(
                "customerBalanceChart"
            );

        const salesSeries =
            buildMonthlySeries(
                profile.invoices,
                getInvoiceDate,
                getInvoiceSales
            );

        const collectionsSeries =
            buildMonthlySeries(
                profile.collectionsRows,
                getCollectionDate,
                getCollectionAmount
            );

        const monthKeys =
            Array.from(
                new Set([
                    ...salesSeries.keys(),
                    ...collectionsSeries.keys()
                ])
            ).sort();

        const labels =
            monthKeys.map(
                formatMonthLabel
            );

        destroyChart(salesChart);
        destroyChart(collectionsChart);
        destroyChart(balanceChart);

        if (salesCanvas) {
            salesChart = new Chart(
                salesCanvas,
                {
                    type: "line",

                    data: {
                        labels,

                        datasets: [
                            {
                                label:
                                    utils.t(
                                        "customerProfile.sales",
                                        "المبيعات"
                                    ),

                                data:
                                    monthKeys.map(
                                        key =>
                                            salesSeries.get(
                                                key
                                            ) || 0
                                    ),

                                borderWidth: 2,
                                tension: 0.35,
                                fill: false
                            }
                        ]
                    },

                    options: {
                        responsive: true,
                        maintainAspectRatio:
                            false,

                        interaction: {
                            intersect: false,
                            mode: "index"
                        },

                        plugins: {
                            legend: {
                                display: true
                            },

                            tooltip: {
                                callbacks: {
                                    label(context) {
                                        return (
                                            context
                                                .dataset
                                                .label +
                                            ": " +
                                            utils.formatCurrency(
                                                context.raw
                                            )
                                        );
                                    }
                                }
                            }
                        },

                        scales: {
                            y: {
                                beginAtZero: true,

                                ticks: {
                                    callback(value) {
                                        return utils.formatNumber(
                                            value
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            );
        }

        if (collectionsCanvas) {
            collectionsChart =
                new Chart(
                    collectionsCanvas,
                    {
                        type: "bar",

                        data: {
                            labels,

                            datasets: [
                                {
                                    label:
                                        utils.t(
                                            "customerProfile.collections",
                                            "التحصيلات"
                                        ),

                                    data:
                                        monthKeys.map(
                                            key =>
                                                collectionsSeries.get(
                                                    key
                                                ) ||
                                                0
                                        ),

                                    borderWidth: 1
                                }
                            ]
                        },

                        options: {
                            responsive: true,
                            maintainAspectRatio:
                                false,

                            plugins: {
                                legend: {
                                    display: true
                                },

                                tooltip: {
                                    callbacks: {
                                        label(
                                            context
                                        ) {
                                            return (
                                                context
                                                    .dataset
                                                    .label +
                                                ": " +
                                                utils.formatCurrency(
                                                    context.raw
                                                )
                                            );
                                        }
                                    }
                                }
                            },

                            scales: {
                                y: {
                                    beginAtZero:
                                        true,

                                    ticks: {
                                        callback(
                                            value
                                        ) {
                                            return utils.formatNumber(
                                                value
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                );
        }

        if (balanceCanvas) {
            balanceChart =
                new Chart(
                    balanceCanvas,
                    {
                        type: "doughnut",

                        data: {
                            labels: [
                                utils.t(
                                    "customerProfile.due",
                                    "المستحق"
                                ),

                                utils.t(
                                    "customerProfile.overdue",
                                    "المتأخر"
                                )
                            ],

                            datasets: [
                                {
                                    data: [
                                        profile.due,
                                        profile.overdue
                                    ],

                                    borderWidth: 1
                                }
                            ]
                        },

                        options: {
                            responsive: true,
                            maintainAspectRatio:
                                false,

                            plugins: {
                                legend: {
                                    position:
                                        "bottom"
                                },

                                tooltip: {
                                    callbacks: {
                                        label(
                                            context
                                        ) {
                                            return (
                                                context
                                                    .label +
                                                ": " +
                                                utils.formatCurrency(
                                                    context.raw
                                                )
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                );
        }
    }

    /* =========================
       Empty state
    ========================= */

    function showEmptyState() {
        const emptyState =
            utils.byId(
                "customerProfileEmptyState"
            );

        const content =
            utils.byId(
                "customerProfileContent"
            );

        if (emptyState) {
            emptyState.classList.remove(
                "hidden"
            );
        }

        if (content) {
            content.classList.add(
                "hidden"
            );
        }
    }

    function showProfileContent() {
        const emptyState =
            utils.byId(
                "customerProfileEmptyState"
            );

        const content =
            utils.byId(
                "customerProfileContent"
            );

        if (emptyState) {
            emptyState.classList.add(
                "hidden"
            );
        }

        if (content) {
            content.classList.remove(
                "hidden"
            );
        }
    }

    /* =========================
       Main rendering
    ========================= */

    function render() {
        const selected =
            getSelectedCustomer();

        const code =
            selected.code ||
            selectedCustomerCode;

        const name =
            selected.name ||
            selectedCustomerName;

        if (!code && !name) {
            showEmptyState();
            return null;
        }

        selectedCustomerCode = code;
        selectedCustomerName = name;

        const profile =
            buildProfile(
                code,
                name
            );

        if (
            profile.invoiceCount === 0 &&
            profile.collectionCount === 0 &&
            profile.balanceCount === 0
        ) {
            showEmptyState();
            return null;
        }

        showProfileContent();

        setProfileValues(profile);
        renderInvoices(profile);
        renderCollections(profile);
        renderBalances(profile);
        renderCharts(profile);

        return profile;
    }

    /* =========================
       Navigation
    ========================= */

    function open(
        customerCode,
        customerName = ""
    ) {
        selectedCustomerCode =
            normalizeCode(customerCode);

        selectedCustomerName =
            String(customerName || "")
                .trim();

        populateCustomerSelect();

        const select =
            utils.byId(
                "customerProfileSelect"
            );

        if (select) {
            const option =
                Array.from(
                    select.options
                ).find(item => {
                    const optionCode =
                        normalizeCode(
                            item.dataset
                                .customerCode
                        );

                    const optionName =
                        normalizeText(
                            item.dataset
                                .customerName
                        );

                    return (
                        (
                            selectedCustomerCode &&
                            optionCode ===
                                selectedCustomerCode
                        ) ||
                        (
                            selectedCustomerName &&
                            optionName ===
                                normalizeText(
                                    selectedCustomerName
                                )
                        )
                    );
                });

            if (option) {
                select.value =
                    option.value;
            }
        }

        if (
            window.DashboardApp &&
            typeof window
                .DashboardApp
                .openPage ===
                "function"
        ) {
            window.DashboardApp.openPage(
                "customerProfile"
            );
        } else {
            document
                .querySelectorAll(
                    "[data-page-section]"
                )
                .forEach(section => {
                    section.classList.toggle(
                        "active",
                        section.dataset
                            .pageSection ===
                            "customerProfile"
                    );
                });
        }

        return render();
    }

    function close() {
        selectedCustomerCode = "";
        selectedCustomerName = "";

        invoiceSearchText = "";
        collectionSearchText = "";
        dueSearchText = "";

        const select =
            utils.byId(
                "customerProfileSelect"
            );

        if (select) {
            select.value = "";
        }

        [
            "customerInvoicesSearchInput",
            "customerCollectionsSearchInput",
            "customerDueSearchInput"
        ].forEach(id => {
            const input =
                utils.byId(id);

            if (input) {
                input.value = "";
            }
        });

        showEmptyState();

        if (
            window.DashboardApp &&
            typeof window
                .DashboardApp
                .openPage ===
                "function"
        ) {
            window.DashboardApp.openPage(
                "salesmanProfiles"
            );
        }

        return true;
    }

    /* =========================
       Export
    ========================= */

    function getInvoiceExportRows(
        profile
    ) {
        return profile.invoices.map(
            row => ({
                "Invoice Number":
                    getInvoiceNumber(row),

                "Invoice Date":
                    utils.formatDate(
                        getInvoiceDate(row)
                    ),

                "Invoice Type":
                    getInvoiceType(row),

                "Customer Code":
                    profile.code,

                "Customer Name":
                    profile.name,

                "Salesman Code":
                    getSalesmanCode(row) ||
                    profile.salesmanCode,

                "Salesman Name":
                    getSalesmanName(row) ||
                    profile.salesmanName,

                Branch:
                    getBranch(row) ||
                    profile.branch,

                "Net Sales":
                    getInvoiceSales(row)
            })
        );
    }

    function getCollectionExportRows(
        profile
    ) {
        return profile.collectionsRows.map(
            row => ({
                "Receipt Number":
                    getReceiptNumber(row),

                "Payment Receipt Number":
                    getPaymentReceiptNumber(
                        row
                    ),

                "Collection Date":
                    utils.formatDate(
                        getCollectionDate(row)
                    ),

                "Customer Code":
                    profile.code,

                "Customer Name":
                    profile.name,

                "Salesman Code":
                    getSalesmanCode(row) ||
                    profile.salesmanCode,

                "Salesman Name":
                    getSalesmanName(row) ||
                    profile.salesmanName,

                Branch:
                    getBranch(row) ||
                    profile.branch,

                "Collection Amount":
                    getCollectionAmount(
                        row
                    )
            })
        );
    }

    function getDueExportRows(profile) {
        return profile.balances.map(
            row => ({
                "Customer Code":
                    profile.code,

                "Customer Name":
                    profile.name,

                "Due Date":
                    utils.formatDate(
                        getDueDate(row)
                    ),

                "Credit Limit":
                    getCreditLimit(row),

                Due:
                    getDueAmount(row),

                Overdue:
                    getOverdueAmount(row),

                Balance:
                    getBalance(row),

                "Overdue Days":
                    getOverdueDays(row),

                Aging:
                    getAgingLabel(row),

                Status:
                    getStatus(row) ===
                    "overdue"
                        ? "Overdue"
                        : "Due"
            })
        );
    }

    function getSummaryExportRows(
        profile
    ) {
        return [
            {
                Field:
                    "Customer Code",
                Value:
                    profile.code
            },

            {
                Field:
                    "Customer Name",
                Value:
                    profile.name
            },

            {
                Field:
                    "Salesman Code",
                Value:
                    profile.salesmanCode
            },

            {
                Field:
                    "Salesman Name",
                Value:
                    profile.salesmanName
            },

            {
                Field:
                    "Branch",
                Value:
                    profile.branch
            },

            {
                Field:
                    "Credit Limit",
                Value:
                    profile.creditLimit
            },

            {
                Field:
                    "Net Sales",
                Value:
                    profile.sales
            },

            {
                Field:
                    "Collections",
                Value:
                    profile.collections
            },

            {
                Field:
                    "Due",
                Value:
                    profile.due
            },

            {
                Field:
                    "Overdue",
                Value:
                    profile.overdue
            },

            {
                Field:
                    "Outstanding",
                Value:
                    profile.outstanding
            },

            {
                Field:
                    "Collection Rate",
                Value:
                    profile.collectionRate
            },

            {
                Field:
                    "Average Invoice",
                Value:
                    profile.averageInvoice
            },

            {
                Field:
                    "Last Purchase",
                Value:
                    utils.formatDate(
                        profile.lastPurchase
                    )
            },

            {
                Field:
                    "Last Collection",
                Value:
                    utils.formatDate(
                        profile.lastCollection
                    )
            },

            {
                Field:
                    "Status",
                Value:
                    getStatusLabel(
                        profile.status
                    )
            }
        ];
    }

    function exportExcel() {
        const profile = render();

        if (!profile) {
            return false;
        }

        if (
            typeof window.XLSX ===
            "undefined"
        ) {
            if (
                window.DashboardReports &&
                typeof window
                    .DashboardReports
                    .exportRows ===
                    "function"
            ) {
                return window
                    .DashboardReports
                    .exportRows(
                        getInvoiceExportRows(
                            profile
                        ),
                        `Customer_${profile.code ||
                            "Profile"}`
                    );
            }

            return false;
        }

        const workbook =
            window.XLSX.utils.book_new();

        const summarySheet =
            window.XLSX.utils.json_to_sheet(
                getSummaryExportRows(
                    profile
                )
            );

        const invoicesSheet =
            window.XLSX.utils.json_to_sheet(
                getInvoiceExportRows(
                    profile
                )
            );

        const collectionsSheet =
            window.XLSX.utils.json_to_sheet(
                getCollectionExportRows(
                    profile
                )
            );

        const dueSheet =
            window.XLSX.utils.json_to_sheet(
                getDueExportRows(
                    profile
                )
            );

        window.XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            "Summary"
        );

        window.XLSX.utils.book_append_sheet(
            workbook,
            invoicesSheet,
            "Invoices"
        );

        window.XLSX.utils.book_append_sheet(
            workbook,
            collectionsSheet,
            "Collections"
        );

        window.XLSX.utils.book_append_sheet(
            workbook,
            dueSheet,
            "Due & Overdue"
        );

        const safeCode =
            String(
                profile.code ||
                profile.name ||
                "Customer"
            )
                .replace(
                    /[\\/:*?"<>|]+/g,
                    "_"
                )
                .trim();

        window.XLSX.writeFile(
            workbook,
            `Customer_Profile_${safeCode}.xlsx`
        );

        return true;
    }

    /* =========================
       Printing
    ========================= */

    function buildPrintSummary(profile) {
        const items = [
            [
                utils.t(
                    "customerProfile.netSales",
                    "صافي المبيعات"
                ),
                utils.formatCurrency(
                    profile.sales
                )
            ],

            [
                utils.t(
                    "customerProfile.collections",
                    "التحصيلات"
                ),
                utils.formatCurrency(
                    profile.collections
                )
            ],

            [
                utils.t(
                    "customerProfile.due",
                    "المستحق"
                ),
                utils.formatCurrency(
                    profile.due
                )
            ],

            [
                utils.t(
                    "customerProfile.overdue",
                    "المتأخر"
                ),
                utils.formatCurrency(
                    profile.overdue
                )
            ],

            [
                utils.t(
                    "customerProfile.outstanding",
                    "الرصيد القائم"
                ),
                utils.formatCurrency(
                    profile.outstanding
                )
            ],

            [
                utils.t(
                    "customerProfile.collectionRate",
                    "نسبة التحصيل"
                ),
                utils.formatPercentage(
                    profile.collectionRate
                )
            ],

            [
                utils.t(
                    "customerProfile.averageInvoice",
                    "متوسط الفاتورة"
                ),
                utils.formatCurrency(
                    profile.averageInvoice
                )
            ],

            [
                utils.t(
                    "customerProfile.creditLimit",
                    "الحد الائتماني"
                ),
                utils.formatCurrency(
                    profile.creditLimit
                )
            ],

            [
                utils.t(
                    "customerProfile.invoiceCount",
                    "عدد الفواتير"
                ),
                utils.formatNumber(
                    profile.invoiceCount
                )
            ],

            [
                utils.t(
                    "customerProfile.lastPurchase",
                    "آخر عملية شراء"
                ),
                utils.formatDate(
                    profile.lastPurchase
                )
            ],

            [
                utils.t(
                    "customerProfile.lastCollection",
                    "آخر تحصيل"
                ),
                utils.formatDate(
                    profile.lastCollection
                )
            ],

            [
                utils.t(
                    "common.status",
                    "الحالة"
                ),
                getStatusLabel(
                    profile.status
                )
            ]
        ];

        return items
            .map(
                ([label, value]) => `
                    <div class="summary-item">
                        <span>
                            ${utils.escapeHTML(
                                label
                            )}
                        </span>

                        <strong>
                            ${utils.escapeHTML(
                                value
                            )}
                        </strong>
                    </div>
                `
            )
            .join("");
    }

    function buildPrintInvoiceRows(
        profile
    ) {
        const rows =
            getFilteredInvoices(
                profile.invoices
            );

        if (rows.length === 0) {
            return `
                <tr>
                    <td colspan="5">
                        ${utils.escapeHTML(
                            utils.t(
                                "common.noData",
                                "لا توجد بيانات متاحة"
                            )
                        )}
                    </td>
                </tr>
            `;
        }

        return rows
            .map(row => `
                <tr>
                    <td>
                        ${utils.escapeHTML(
                            getInvoiceNumber(
                                row
                            ) ||
                                "--"
                        )}
                    </td>

                    <td>
                        ${utils.formatDate(
                            getInvoiceDate(row)
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            getInvoiceType(row) ||
                                "--"
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            getSalesmanName(row) ||
                                profile.salesmanName
                        )}
                    </td>

                    <td>
                        ${utils.formatCurrency(
                            getInvoiceSales(row)
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    function buildPrintCollectionRows(
        profile
    ) {
        const rows =
            getFilteredCollections(
                profile.collectionsRows
            );

        if (rows.length === 0) {
            return `
                <tr>
                    <td colspan="4">
                        ${utils.escapeHTML(
                            utils.t(
                                "common.noData",
                                "لا توجد بيانات متاحة"
                            )
                        )}
                    </td>
                </tr>
            `;
        }

        return rows
            .map(row => `
                <tr>
                    <td>
                        ${utils.escapeHTML(
                            getReceiptNumber(row) ||
                                "--"
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            getPaymentReceiptNumber(
                                row
                            ) ||
                                "--"
                        )}
                    </td>

                    <td>
                        ${utils.formatDate(
                            getCollectionDate(row)
                        )}
                    </td>

                    <td>
                        ${utils.formatCurrency(
                            getCollectionAmount(
                                row
                            )
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    function buildPrintDueRows(
        profile
    ) {
        const rows =
            getFilteredBalances(
                profile.balances
            );

        if (rows.length === 0) {
            return `
                <tr>
                    <td colspan="6">
                        ${utils.escapeHTML(
                            utils.t(
                                "common.noData",
                                "لا توجد بيانات متاحة"
                            )
                        )}
                    </td>
                </tr>
            `;
        }

        return rows
            .map(row => `
                <tr>
                    <td>
                        ${utils.formatDate(
                            getDueDate(row)
                        )}
                    </td>

                    <td>
                        ${utils.formatCurrency(
                            getDueAmount(row)
                        )}
                    </td>

                    <td>
                        ${utils.formatCurrency(
                            getOverdueAmount(
                                row
                            )
                        )}
                    </td>

                    <td>
                        ${utils.formatCurrency(
                            getBalance(row)
                        )}
                    </td>

                    <td>
                        ${utils.formatNumber(
                            getOverdueDays(row)
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            getAgingLabel(row)
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    function printProfile() {
        const profile = render();

        if (!profile) {
            return false;
        }

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1400,height=900"
            );

        if (!printWindow) {
            return false;
        }

        const language =
            utils.getLanguage();

        const direction =
            language === "ar"
                ? "rtl"
                : "ltr";

        const timestamp =
            new Intl.DateTimeFormat(
                utils.getLocale(),
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            ).format(new Date());

        printWindow.document.write(`
            <!DOCTYPE html>

            <html
                lang="${language}"
                dir="${direction}"
            >
            <head>
                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <title>
                    ${utils.escapeHTML(
                        profile.name
                    )}
                </title>

                <style>
                    @page {
                        size: A4 landscape;
                        margin: 12mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        font-family:
                            Arial,
                            Tahoma,
                            sans-serif;
                        color: #172033;
                        background: #ffffff;
                        font-size: 11px;
                    }

                    .print-header {
                        display: flex;
                        justify-content:
                            space-between;
                        align-items: center;
                        gap: 20px;
                        padding-bottom: 12px;
                        margin-bottom: 16px;
                        border-bottom:
                            2px solid #172033;
                    }

                    .brand {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .brand-icon {
                        width: 46px;
                        height: 46px;
                        border-radius: 12px;
                        display: grid;
                        place-items: center;
                        background: #172033;
                        color: #ffffff;
                        font-size: 22px;
                        font-weight: 700;
                    }

                    .brand h1 {
                        margin: 0 0 4px;
                        font-size: 20px;
                    }

                    .brand p,
                    .print-meta p {
                        margin: 2px 0;
                        color: #5b6577;
                    }

                    .print-meta {
                        text-align: end;
                    }

                    .customer-header {
                        display: grid;
                        grid-template-columns:
                            1fr auto;
                        gap: 18px;
                        padding: 14px;
                        border:
                            1px solid #dbe3ea;
                        border-radius: 10px;
                        margin-bottom: 14px;
                    }

                    .customer-header h2 {
                        margin: 0 0 8px;
                        font-size: 18px;
                    }

                    .customer-details {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px 22px;
                    }

                    .customer-details span {
                        color: #5b6577;
                    }

                    .status {
                        align-self: center;
                        border:
                            1px solid #dbe3ea;
                        border-radius: 999px;
                        padding: 7px 12px;
                        font-weight: 700;
                    }

                    .summary-grid {
                        display: grid;
                        grid-template-columns:
                            repeat(4, 1fr);
                        gap: 9px;
                        margin-bottom: 18px;
                    }

                    .summary-item {
                        border:
                            1px solid #dbe3ea;
                        border-radius: 8px;
                        padding: 10px;
                    }

                    .summary-item span {
                        display: block;
                        margin-bottom: 5px;
                        color: #5b6577;
                        font-size: 10px;
                    }

                    .summary-item strong {
                        font-size: 12px;
                    }

                    .report-section {
                        margin-top: 18px;
                        break-inside: avoid;
                    }

                    .report-section h3 {
                        margin: 0 0 8px;
                        padding-bottom: 6px;
                        border-bottom:
                            1px solid #dbe3ea;
                        font-size: 14px;
                    }

                    table {
                        width: 100%;
                        border-collapse:
                            collapse;
                        table-layout: fixed;
                    }

                    th,
                    td {
                        padding: 7px 6px;
                        border:
                            1px solid #dbe3ea;
                        text-align: center;
                        overflow-wrap:
                            anywhere;
                    }

                    th {
                        background: #f3f6f8;
                        font-weight: 700;
                    }

                    tbody tr:nth-child(even) {
                        background: #fafbfc;
                    }

                    .print-footer {
                        margin-top: 18px;
                        padding-top: 10px;
                        border-top:
                            1px solid #dbe3ea;
                        display: flex;
                        justify-content:
                            space-between;
                        color: #687386;
                        font-size: 9px;
                    }

                    @media print {
                        body {
                            -webkit-print-color-adjust:
                                exact;
                            print-color-adjust:
                                exact;
                        }

                        .report-section {
                            break-inside: avoid;
                        }

                        thead {
                            display:
                                table-header-group;
                        }

                        tr {
                            break-inside: avoid;
                        }
                    }
                </style>
            </head>

            <body>
                <header class="print-header">

                    <div class="brand">
                        <div class="brand-icon">
                            SO
                        </div>

                        <div>
                            <h1>
                                Sales Operations
                            </h1>

                            <p>
                                Al-Howail Talbees
                            </p>
                        </div>
                    </div>

                    <div class="print-meta">
                        <strong>
                            ${utils.escapeHTML(
                                utils.t(
                                    "customerProfile.title",
                                    "ملف العميل"
                                )
                            )}
                        </strong>

                        <p>
                            ${utils.escapeHTML(
                                timestamp
                            )}
                        </p>
                    </div>

                </header>

                <section class="customer-header">

                    <div>
                        <h2>
                            ${utils.escapeHTML(
                                profile.name
                            )}
                        </h2>

                        <div class="customer-details">

                            <span>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "customerProfile.customerCode",
                                        "كود العميل"
                                    )
                                )}:
                                <strong>
                                    ${utils.escapeHTML(
                                        profile.code ||
                                            "--"
                                    )}
                                </strong>
                            </span>

                            <span>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "customerProfile.salesman",
                                        "المندوب"
                                    )
                                )}:
                                <strong>
                                    ${utils.escapeHTML(
                                        profile.salesmanName
                                    )}
                                </strong>
                            </span>

                            <span>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "customerProfile.branch",
                                        "الفرع"
                                    )
                                )}:
                                <strong>
                                    ${utils.escapeHTML(
                                        profile.branch
                                    )}
                                </strong>
                            </span>

                            <span>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "customerProfile.creditLimit",
                                        "الحد الائتماني"
                                    )
                                )}:
                                <strong>
                                    ${utils.formatCurrency(
                                        profile.creditLimit
                                    )}
                                </strong>
                            </span>

                        </div>
                    </div>

                    <div class="status">
                        ${utils.escapeHTML(
                            getStatusLabel(
                                profile.status
                            )
                        )}
                    </div>

                </section>

                <section class="summary-grid">
                    ${buildPrintSummary(
                        profile
                    )}
                </section>

                <section class="report-section">

                    <h3>
                        ${utils.escapeHTML(
                            utils.t(
                                "customerProfile.invoiceHistory",
                                "سجل الفواتير"
                            )
                        )}
                    </h3>

                    <table>
                        <thead>
                            <tr>
                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "invoices.invoiceNumber",
                                            "رقم الفاتورة"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "invoices.invoiceDate",
                                            "تاريخ الفاتورة"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "invoices.invoiceType",
                                            "نوع الفاتورة"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "invoices.salesmanName",
                                            "اسم المندوب"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "invoices.netSales",
                                            "صافي المبيعات"
                                        )
                                    )}
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            ${buildPrintInvoiceRows(
                                profile
                            )}
                        </tbody>
                    </table>

                </section>

                <section class="report-section">

                    <h3>
                        ${utils.escapeHTML(
                            utils.t(
                                "customerProfile.collectionHistory",
                                "سجل التحصيلات"
                            )
                        )}
                    </h3>

                    <table>
                        <thead>
                            <tr>
                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "collections.receiptNumber",
                                            "رقم الإيصال"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "collections.paymentReceiptNumber",
                                            "رقم سند القبض"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "collections.collectionDate",
                                            "تاريخ التحصيل"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "collections.collectionAmount",
                                            "المبلغ المحصل"
                                        )
                                    )}
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            ${buildPrintCollectionRows(
                                profile
                            )}
                        </tbody>
                    </table>

                </section>

                <section class="report-section">

                    <h3>
                        ${utils.escapeHTML(
                            utils.t(
                                "customerProfile.dueHistory",
                                "سجل المستحقات والمتأخرات"
                            )
                        )}
                    </h3>

                    <table>
                        <thead>
                            <tr>
                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "dueOverdue.dueDate",
                                            "تاريخ الاستحقاق"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "dueOverdue.dueAmount",
                                            "المستحق"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "dueOverdue.overdueAmount",
                                            "المتأخر"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "dueOverdue.totalBalance",
                                            "إجمالي الرصيد"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "dueOverdue.outstandingDays",
                                            "أيام التأخير"
                                        )
                                    )}
                                </th>

                                <th>
                                    ${utils.escapeHTML(
                                        utils.t(
                                            "dueOverdue.aging",
                                            "فترة التأخير"
                                        )
                                    )}
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            ${buildPrintDueRows(
                                profile
                            )}
                        </tbody>
                    </table>

                </section>

                <footer class="print-footer">
                    <span>
                        Developed by Adel Elesawy
                    </span>

                    <span>
                        Sales Operations Platform
                    </span>
                </footer>

                <script>
                    window.addEventListener(
                        "load",
                        function () {
                            window.setTimeout(
                                function () {
                                    window.print();
                                },
                                300
                            );
                        }
                    );
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        return true;
    }

    /* =========================
       Events
    ========================= */

    function handleCustomerChange() {
        const selected =
            getSelectedCustomer();

        selectedCustomerCode =
            selected.code;

        selectedCustomerName =
            selected.name;

        render();
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        utils.byId(
            "customerProfileSelect"
        )?.addEventListener(
            "change",
            handleCustomerChange
        );

        utils.byId(
            "customerInvoicesSearchInput"
        )?.addEventListener(
            "input",
            event => {
                invoiceSearchText =
                    event.target.value;

                render();
            }
        );

        utils.byId(
            "customerCollectionsSearchInput"
        )?.addEventListener(
            "input",
            event => {
                collectionSearchText =
                    event.target.value;

                render();
            }
        );

        utils.byId(
            "customerDueSearchInput"
        )?.addEventListener(
            "input",
            event => {
                dueSearchText =
                    event.target.value;

                render();
            }
        );

        utils.byId(
            "exportCustomerProfileButton"
        )?.addEventListener(
            "click",
            exportExcel
        );

        utils.byId(
            "printCustomerProfileButton"
        )?.addEventListener(
            "click",
            printProfile
        );

        utils.byId(
            "closeCustomerProfileButton"
        )?.addEventListener(
            "click",
            close
        );

        eventsBound = true;
    }

    function initialize() {
        bindEvents();
        populateCustomerSelect();

        if (
            selectedCustomerCode ||
            selectedCustomerName
        ) {
            render();
        } else {
            showEmptyState();
        }
    }

    /* =========================
       Public API
    ========================= */

    return Object.freeze({
        initialize,
        bindEvents,

        setData,
        setInvoices,
        setCollections,
        setDueOverdue,
        setTargets,

        getCustomers,
        populateCustomerSelect,

        buildProfile,
        getSelectedCustomer,

        open,
        close,
        render,

        exportExcel,
        printProfile
    });
})();