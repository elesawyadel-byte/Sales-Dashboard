/* =========================
   profiles.js
========================= */

"use strict";

window.DashboardProfiles = (() => {
    const utils = window.DashboardUtils;
    const targetsModule = window.DashboardTargets;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before profiles.js."
        );
    }

    let targetRows = [];
    let invoiceRows = [];
    let collectionRows = [];
    let dueRows = [];
    let eventsBound = false;

    function normalizeCode(value) {
        return utils.normalizeCode(value);
    }

    function getValue(row, keys, fallback = "") {
        return utils.firstValue(
            row,
            keys,
            fallback
        );
    }

    function getTargetCode(row) {
        return normalizeCode(
            getValue(
                row,
                [
                    "salesmanCode",
                    "Salesman Code",
                    "salesCode",
                    "code"
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
                    "name"
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
                    "Branch"
                ],
                ""
            )
        ).trim();
    }

    function getCustomerCode(row) {
        return normalizeCode(
            getValue(
                row,
                [
                    "customerCode",
                    "Customer Code",
                    "accountCode"
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
                    "customer"
                ],
                ""
            )
        ).trim();
    }

    function getInvoiceSales(row) {
        return utils.toNumber(
            getValue(
                row,
                [
                    "salesWithoutTax",
                    "netSale",
                    "netSales",
                    "Net Sales",
                    "amount"
                ],
                0
            )
        );
    }

    function getCollectionAmount(row) {
        return utils.toNumber(
            getValue(
                row,
                [
                    "collectionAmount",
                    "collection",
                    "Collection Amount",
                    "amount"
                ],
                0
            )
        );
    }

    function getBalance(row) {
        return utils.toNumber(
            getValue(
                row,
                [
                    "invoiceBalance",
                    "balance",
                    "totalBalance",
                    "Invoice Balance"
                ],
                0
            )
        );
    }

    function getStatus(row) {
        const suppliedStatus = utils
            .normalizeText(
                getValue(
                    row,
                    ["status", "Status"],
                    ""
                )
            )
            .replace(/\s+/g, "");

        const overdueDays = utils.toNumber(
            getValue(
                row,
                [
                    "overdueDays",
                    "outstandingDays",
                    "Overdue Days"
                ],
                0
            )
        );

        if (
            suppliedStatus === "overdue" ||
            suppliedStatus === "متأخر" ||
            overdueDays > 0
        ) {
            return "overdue";
        }

        return "due";
    }

    function getOverdueDays(row) {
        return Math.max(
            0,
            utils.toNumber(
                getValue(
                    row,
                    [
                        "overdueDays",
                        "outstandingDays",
                        "Overdue Days"
                    ],
                    0
                )
            )
        );
    }

    function getCreditLimit(row) {
        return utils.toNumber(
            getValue(
                row,
                [
                    "creditLimit",
                    "Credit Limit",
                    "credit"
                ],
                0
            )
        );
    }

    function getInvoiceDate(row) {
        return getValue(
            row,
            [
                "invoiceDate",
                "Invoice Date",
                "date"
            ],
            ""
        );
    }

    function getCurrentMonthlyTarget(targetRow) {
        if (!targetRow) {
            return 0;
        }

        if (
            targetsModule &&
            typeof targetsModule.getMonthlyTarget ===
                "function"
        ) {
            return utils.toNumber(
                targetsModule.getMonthlyTarget(
                    targetRow
                )
            );
        }

        const quarter =
            Math.floor(
                new Date().getMonth() / 3
            ) + 1;

        return utils.toNumber(
            getValue(
                targetRow,
                [
                    `monthlyTargetQ${quarter}`,
                    `monthlyTarget${quarter}`,
                    `Q${quarter} Monthly Target`,
                    "monthlyTarget",
                    "Monthly Target",
                    "target"
                ],
                0
            )
        );
    }

    function setData(data = {}) {
        targetRows = Array.isArray(data.target)
            ? data.target
            : [];

        invoiceRows = Array.isArray(data.invoices)
            ? data.invoices
            : [];

        collectionRows = Array.isArray(
            data.collections
        )
            ? data.collections
            : [];

        dueRows = Array.isArray(data.dueOverdue)
            ? data.dueOverdue
            : [];

        populateSalesmen();
        render();
    }

    function setTargets(rows = []) {
        targetRows = Array.isArray(rows)
            ? rows
            : [];

        populateSalesmen();
        render();
    }

    function setInvoices(rows = []) {
        invoiceRows = Array.isArray(rows)
            ? rows
            : [];

        render();
    }

    function setCollections(rows = []) {
        collectionRows = Array.isArray(rows)
            ? rows
            : [];

        render();
    }

    function setDueOverdue(rows = []) {
        dueRows = Array.isArray(rows)
            ? rows
            : [];

        render();
    }

    function getSalesmen() {
        const map = new Map();

        targetRows.forEach(row => {
            const code = getTargetCode(row);

            if (!code) {
                return;
            }

            map.set(code, {
                code,
                name:
                    getSalesmanName(row) ||
                    code,
                branch:
                    getBranch(row)
            });
        });

        [
            ...invoiceRows,
            ...collectionRows,
            ...dueRows
        ].forEach(row => {
            const code = normalizeCode(
                getValue(
                    row,
                    [
                        "salesmanCode",
                        "Salesman Code",
                        "salesCode"
                    ],
                    ""
                )
            );

            if (!code || map.has(code)) {
                return;
            }

            map.set(code, {
                code,
                name:
                    getSalesmanName(row) ||
                    code,
                branch:
                    getBranch(row)
            });
        });

        return Array.from(map.values()).sort(
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

    function populateSalesmen() {
        const select = utils.byId(
            "profileSalesmanSelect"
        );

        if (!select) {
            return;
        }

        const currentValue = select.value;
        const salesmen = getSalesmen();

        select.innerHTML = salesmen
            .map(
                salesman => `
                    <option value="${utils.escapeHTML(
                        salesman.code
                    )}">
                        ${utils.escapeHTML(
                            salesman.name
                        )}
                        (${utils.escapeHTML(
                            salesman.code
                        )})
                    </option>
                `
            )
            .join("");

        const authenticatedCode =
            window.DashboardAuth?.getSalesmanCode?.() ||
            "";

        const selectedCode =
            currentValue ||
            authenticatedCode ||
            salesmen[0]?.code ||
            "";

        select.value = selectedCode;
    }

    function getSelectedSalesmanCode() {
        return (
            normalizeCode(
                utils.byId(
                    "profileSalesmanSelect"
                )?.value
            ) ||
            normalizeCode(
                window.DashboardAuth
                    ?.getSalesmanCode?.()
            ) ||
            getSalesmen()[0]?.code ||
            ""
        );
    }

    function buildProfile(code) {
        const targetRow =
            targetRows.find(
                row =>
                    getTargetCode(row) === code
            ) || {};

        const invoices =
            invoiceRows.filter(
                row =>
                    normalizeCode(
                        getValue(
                            row,
                            [
                                "salesmanCode",
                                "Salesman Code",
                                "salesCode"
                            ],
                            ""
                        )
                    ) === code
            );

        const collections =
            collectionRows.filter(
                row =>
                    normalizeCode(
                        getValue(
                            row,
                            [
                                "salesmanCode",
                                "Salesman Code",
                                "salesCode"
                            ],
                            ""
                        )
                    ) === code
            );

        const balances =
            dueRows.filter(
                row =>
                    normalizeCode(
                        getValue(
                            row,
                            [
                                "salesmanCode",
                                "Salesman Code",
                                "salesCode"
                            ],
                            ""
                        )
                    ) === code
            );

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
            balances.filter(
                row =>
                    getStatus(row) === "due"
            ),
            getBalance
        );

        const overdue = utils.sumBy(
            balances.filter(
                row =>
                    getStatus(row) ===
                    "overdue"
            ),
            getBalance
        );

        const target =
            getCurrentMonthlyTarget(
                targetRow
            );

        const achievement =
            target > 0
                ? (sales / target) * 100
                : 0;

        return {
            code,
            name:
                getSalesmanName(targetRow) ||
                getSalesmanName(
                    invoices[0] ||
                        collections[0] ||
                        balances[0] ||
                        {}
                ) ||
                code,

            branch:
                getBranch(targetRow) ||
                getBranch(
                    invoices[0] ||
                        collections[0] ||
                        balances[0] ||
                        {}
                ) ||
                "--",

            target,
            sales,
            collections:
                collectionsTotal,
            due,
            overdue,
            achievement,
            invoiceCount:
                invoices.length,

            customers:
                buildCustomers(
                    invoices,
                    collections,
                    balances
                )
        };
    }

    function buildCustomers(
        invoices,
        collections,
        balances
    ) {
        const customerMap = new Map();

        function ensureCustomer(row) {
            const code =
                getCustomerCode(row);

            const name =
                getCustomerName(row);

            const key =
                code || name;

            if (!key) {
                return null;
            }

            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    customerCode: code,
                    customerName: name,
                    lastPurchase: "",
                    sales: 0,
                    collections: 0,
                    due: 0,
                    overdue: 0,
                    overdueDays: 0,
                    creditLimit: 0
                });
            }

            const customer =
                customerMap.get(key);

            if (
                !customer.customerCode &&
                code
            ) {
                customer.customerCode =
                    code;
            }

            if (
                !customer.customerName &&
                name
            ) {
                customer.customerName =
                    name;
            }

            return customer;
        }

        invoices.forEach(row => {
            const customer =
                ensureCustomer(row);

            if (!customer) {
                return;
            }

            customer.sales +=
                getInvoiceSales(row);

            const invoiceDate =
                getInvoiceDate(row);

            const currentDate =
                utils.parseDate(
                    customer.lastPurchase
                );

            const candidateDate =
                utils.parseDate(
                    invoiceDate
                );

            if (
                candidateDate &&
                (
                    !currentDate ||
                    candidateDate > currentDate
                )
            ) {
                customer.lastPurchase =
                    invoiceDate;
            }
        });

        collections.forEach(row => {
            const customer =
                ensureCustomer(row);

            if (!customer) {
                return;
            }

            customer.collections +=
                getCollectionAmount(row);
        });

        balances.forEach(row => {
            const customer =
                ensureCustomer(row);

            if (!customer) {
                return;
            }

            const balance =
                getBalance(row);

            if (
                getStatus(row) ===
                "overdue"
            ) {
                customer.overdue +=
                    balance;
            } else {
                customer.due +=
                    balance;
            }

            customer.overdueDays =
                Math.max(
                    customer.overdueDays,
                    getOverdueDays(row)
                );

            customer.creditLimit =
                Math.max(
                    customer.creditLimit,
                    getCreditLimit(row)
                );
        });

        return Array.from(
            customerMap.values()
        ).sort(
            (first, second) =>
                second.overdue -
                    first.overdue ||
                second.sales -
                    first.sales
        );
    }

    function getFilteredCustomers(
        customers
    ) {
        const searchText =
            utils.normalizeText(
                utils.byId(
                    "profileCustomersSearchInput"
                )?.value || ""
            );

        if (!searchText) {
            return customers;
        }

        return customers.filter(
            customer =>
                [
                    customer.customerCode,
                    customer.customerName,
                    customer.lastPurchase,
                    customer.sales,
                    customer.collections,
                    customer.due,
                    customer.overdue
                ].some(value =>
                    utils
                        .normalizeText(value)
                        .includes(searchText)
                )
        );
    }

    function setProfileValues(profile) {
        utils.setText(
            "profileSalesmanName",
            profile.name
        );

        utils.setText(
            "profileSalesmanCode",
            profile.code
        );

        utils.setText(
            "profileSalesmanBranch",
            profile.branch
        );

        utils.setText(
            "profileTargetValue",
            utils.formatCurrency(
                profile.target
            )
        );

        utils.setText(
            "profileSalesValue",
            utils.formatCurrency(
                profile.sales
            )
        );

        utils.setText(
            "profileCollectionsValue",
            utils.formatCurrency(
                profile.collections
            )
        );

        utils.setText(
            "profileDueValue",
            utils.formatCurrency(
                profile.due
            )
        );

        utils.setText(
            "profileOverdueValue",
            utils.formatCurrency(
                profile.overdue
            )
        );

        utils.setText(
            "profileAchievementValue",
            utils.formatPercentage(
                profile.achievement
            )
        );

        utils.setText(
            "profileInvoiceCount",
            utils.formatNumber(
                profile.invoiceCount
            )
        );

        utils.setText(
            "profileCustomerCount",
            utils.formatNumber(
                profile.customers.length
            )
        );
    }

    function createCustomerRow(customer) {
        const hasOverdue =
            customer.overdue > 0;

        return `
            <tr>
                <td>
                    ${utils.escapeHTML(
                        customer.customerCode ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        customer.customerName ||
                            "--"
                    )}
                </td>

                <td>
                    ${utils.formatDate(
                        customer.lastPurchase
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        customer.sales
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        customer.collections
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        customer.due
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        customer.overdue
                    )}
                </td>

                <td>
                    ${utils.formatNumber(
                        customer.overdueDays
                    )}
                </td>

                <td>
                    ${utils.formatCurrency(
                        customer.creditLimit
                    )}
                </td>

                <td>
                    <span class="status-badge ${
                        hasOverdue
                            ? "status-warning"
                            : "status-success"
                    }">
                        ${utils.escapeHTML(
                            hasOverdue
                                ? utils.t(
                                      "salesmanProfiles.overdueCustomer",
                                      "متأخر"
                                  )
                                : utils.t(
                                      "salesmanProfiles.active",
                                      "نشط"
                                  )
                        )}
                    </span>
                </td>
            </tr>
        `;
    }

    function renderCustomers(customers) {
        const tableBody = utils.byId(
            "profileCustomersTableBody"
        );

        if (!tableBody) {
            return;
        }

        const filteredCustomers =
            getFilteredCustomers(
                customers
            );

        tableBody.innerHTML =
            filteredCustomers.length > 0
                ? filteredCustomers
                      .map(
                          createCustomerRow
                      )
                      .join("")
                : utils.emptyTableRow(
                      10,
                      utils.t(
                          "common.noData",
                          "لا توجد بيانات متاحة"
                      )
                  );
    }

    function render() {
        const code =
            getSelectedSalesmanCode();

        if (!code) {
            return null;
        }

        const profile =
            buildProfile(code);

        setProfileValues(profile);
        renderCustomers(
            profile.customers
        );

        return profile;
    }

    function getExportRows() {
        const profile = render();

        if (!profile) {
            return [];
        }

        return profile.customers.map(
            customer => ({
                "Customer Code":
                    customer.customerCode,

                "Customer Name":
                    customer.customerName,

                "Last Purchase":
                    utils.formatDate(
                        customer.lastPurchase
                    ),

                Sales:
                    customer.sales,

                Collections:
                    customer.collections,

                Due:
                    customer.due,

                Overdue:
                    customer.overdue,

                "Overdue Days":
                    customer.overdueDays,

                "Credit Limit":
                    customer.creditLimit,

                Status:
                    customer.overdue > 0
                        ? "Overdue"
                        : "Active"
            })
        );
    }

    function exportExcel() {
        if (
            !window.DashboardReports ||
            typeof window
                .DashboardReports
                .exportRows !==
                "function"
        ) {
            return false;
        }

        return window.DashboardReports
            .exportRows(
                getExportRows(),
                "Salesman_Profile"
            );
    }

    function printProfile() {
        const profile = render();

        if (!profile) {
            return false;
        }

        const rows =
            getFilteredCustomers(
                profile.customers
            );

        const bodyRows = rows
            .map(createCustomerRow)
            .join("");

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1200,height=800"
            );

        if (!printWindow) {
            return false;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="${
                utils.getLanguage()
            }" dir="${
                utils.getLanguage() ===
                "ar"
                    ? "rtl"
                    : "ltr"
            }">
            <head>
                <meta charset="UTF-8">
                <title>
                    ${utils.escapeHTML(
                        profile.name
                    )}
                </title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 24px;
                        color: #172033;
                    }

                    h1 {
                        margin-bottom: 8px;
                    }

                    .summary {
                        display: grid;
                        grid-template-columns:
                            repeat(4, 1fr);
                        gap: 10px;
                        margin: 20px 0;
                    }

                    .summary div {
                        border: 1px solid #dbe3ea;
                        padding: 12px;
                        border-radius: 8px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th,
                    td {
                        border: 1px solid #dbe3ea;
                        padding: 8px;
                        text-align: center;
                    }

                    th {
                        background: #f3f6f8;
                    }
                </style>
            </head>

            <body>
                <h1>
                    ${utils.escapeHTML(
                        profile.name
                    )}
                </h1>

                <p>
                    ${utils.escapeHTML(
                        profile.code
                    )}
                    -
                    ${utils.escapeHTML(
                        profile.branch
                    )}
                </p>

                <div class="summary">
                    <div>
                        Target:
                        ${utils.formatCurrency(
                            profile.target
                        )}
                    </div>

                    <div>
                        Sales:
                        ${utils.formatCurrency(
                            profile.sales
                        )}
                    </div>

                    <div>
                        Collections:
                        ${utils.formatCurrency(
                            profile.collections
                        )}
                    </div>

                    <div>
                        Achievement:
                        ${utils.formatPercentage(
                            profile.achievement
                        )}
                    </div>

                    <div>
                        Due:
                        ${utils.formatCurrency(
                            profile.due
                        )}
                    </div>

                    <div>
                        Overdue:
                        ${utils.formatCurrency(
                            profile.overdue
                        )}
                    </div>

                    <div>
                        Invoices:
                        ${utils.formatNumber(
                            profile.invoiceCount
                        )}
                    </div>

                    <div>
                        Customers:
                        ${utils.formatNumber(
                            profile.customers
                                .length
                        )}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Customer Code</th>
                            <th>Customer Name</th>
                            <th>Last Purchase</th>
                            <th>Sales</th>
                            <th>Collections</th>
                            <th>Due</th>
                            <th>Overdue</th>
                            <th>Overdue Days</th>
                            <th>Credit Limit</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        window.setTimeout(
            () => printWindow.print(),
            300
        );

        return true;
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        utils.byId(
            "profileSalesmanSelect"
        )?.addEventListener(
            "change",
            render
        );

        utils.byId(
            "profileCustomersSearchInput"
        )?.addEventListener(
            "input",
            render
        );

        utils.byId(
            "exportSalesmanProfileButton"
        )?.addEventListener(
            "click",
            exportExcel
        );

        utils.byId(
            "printSalesmanProfileButton"
        )?.addEventListener(
            "click",
            printProfile
        );

        eventsBound = true;
    }

    function initialize() {
        bindEvents();
        populateSalesmen();
        render();
    }

    return Object.freeze({
        initialize,
        bindEvents,

        setData,
        setTargets,
        setInvoices,
        setCollections,
        setDueOverdue,

        getSalesmen,
        getSelectedSalesmanCode,
        getExportRows,

        render,
        exportExcel,
        printProfile
    });
})();