"use strict";

/* =========================================================
   Sales Operations Platform
   salesIntelligence.js
   تحليلات متقدمة لدعم قرارات الإدارة
========================================================= */

window.DashboardSalesIntelligence = (() => {
    const utils = window.DashboardUtils;
    const targetsModule = window.DashboardTargets;

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before salesIntelligence.js."
        );
    }

    let currentData = {
        filters: {},
        target: [],
        invoices: [],
        collections: [],
        dueOverdue: [],
        updatedAt: ""
    };

    /* =====================================================
       أدوات عامة
    ===================================================== */

    function safeArray(value) {
        return Array.isArray(value)
            ? value
            : [];
    }

    function getValue(
        row,
        keys,
        fallback = ""
    ) {
        return utils.firstValue(
            row || {},
            keys,
            fallback
        );
    }

    function normalizeCode(value) {
        return utils.normalizeCode(value);
    }

    function normalizeText(value) {
        return utils.normalizeText(value);
    }

    function toNumber(value) {
        return utils.toNumber(value);
    }

    function escapeHTML(value) {
        return utils.escapeHTML(value);
    }

    function getSalesmanCode(row) {
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
                    "Branch",
                    "sheetBranch",
                    "city",
                    "City"
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
                    "accountCode",
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
                    "customer",
                    "accountName"
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
                "date"
            ],
            ""
        );
    }

    function getSales(row) {
        return toNumber(
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

    function getCollection(row) {
        return toNumber(
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
        return toNumber(
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

    function getCreditLimit(row) {
        return toNumber(
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

    function getOverdueDays(row) {
        return Math.max(
            0,
            toNumber(
                getValue(
                    row,
                    [
                        "overdueDays",
                        "outstandingDays",
                        "agingDays",
                        "Overdue Days"
                    ],
                    0
                )
            )
        );
    }

    function getStatus(row) {
        const status = normalizeText(
            getValue(
                row,
                [
                    "status",
                    "Status"
                ],
                ""
            )
        ).replace(/\s+/g, "");

        if (
            status === "overdue" ||
            status === "متأخر" ||
            status === "متاخر" ||
            getOverdueDays(row) > 0
        ) {
            return "overdue";
        }

        return "due";
    }

    function parseDate(value) {
        if (
            utils &&
            typeof utils.parseDate ===
                "function"
        ) {
            return utils.parseDate(value);
        }

        const parsed = new Date(value);

        return Number.isNaN(
            parsed.getTime()
        )
            ? null
            : parsed;
    }

    function daysBetween(
        firstDate,
        secondDate
    ) {
        if (
            !firstDate ||
            !secondDate
        ) {
            return 0;
        }

        const millisecondsPerDay =
            24 * 60 * 60 * 1000;

        return Math.floor(
            (
                secondDate.getTime() -
                firstDate.getTime()
            ) /
                millisecondsPerDay
        );
    }

    function formatCurrency(value) {
        return utils.formatCurrency(
            toNumber(value)
        );
    }

    function formatPercentage(value) {
        return utils.formatPercentage(
            toNumber(value)
        );
    }

    function formatDate(value) {
        return value
            ? utils.formatDate(value)
            : utils.t(
                  "common.notAvailable",
                  "غير متاح"
              );
    }

    function getReferenceDate() {
        const toDate =
            currentData.filters?.dateTo;

        const parsedToDate =
            parseDate(toDate);

        return parsedToDate ||
            new Date();
    }

    /* =====================================================
       الهدف الشهري
    ===================================================== */

    function getMonthlyTarget(targetRow) {
        if (!targetRow) {
            return 0;
        }

        if (
            targetsModule &&
            typeof targetsModule
                .getMonthlyTarget ===
                "function"
        ) {
            return toNumber(
                targetsModule.getMonthlyTarget(
                    targetRow
                )
            );
        }

        const referenceDate =
            getReferenceDate();

        const month =
            referenceDate.getMonth() + 1;

        if (
            month >= 1 &&
            month <= 3
        ) {
            return toNumber(
                getValue(
                    targetRow,
                    [
                        "monthlyTargetQ1",
                        "monthlyTarget1"
                    ],
                    0
                )
            );
        }

        if (
            month >= 4 &&
            month <= 6
        ) {
            return toNumber(
                getValue(
                    targetRow,
                    [
                        "monthlyTargetQ2",
                        "monthlyTarget2"
                    ],
                    0
                )
            );
        }

        if (
            month >= 7 &&
            month <= 9
        ) {
            return toNumber(
                getValue(
                    targetRow,
                    [
                        "monthlyTargetQ3",
                        "monthlyTarget3"
                    ],
                    0
                )
            );
        }

        return toNumber(
            getValue(
                targetRow,
                [
                    "monthlyTargetQ4",
                    "monthlyTarget4"
                ],
                0
            )
        );
    }

    /* =====================================================
       حفظ البيانات
    ===================================================== */

    function setData(data = {}) {
        currentData = {
            filters:
                data.filters &&
                typeof data.filters ===
                    "object"
                    ? data.filters
                    : {},

            target:
                safeArray(data.target),

            invoices:
                safeArray(data.invoices),

            collections:
                safeArray(data.collections),

            dueOverdue:
                safeArray(data.dueOverdue),

            updatedAt:
                data.updatedAt || ""
        };

        render();

        return currentData;
    }

    function getData() {
        return {
            ...currentData,
            target:
                [...currentData.target],
            invoices:
                [...currentData.invoices],
            collections:
                [...currentData.collections],
            dueOverdue:
                [...currentData.dueOverdue]
        };
    }

    /* =====================================================
       أداء المندوبين
    ===================================================== */

    function buildSalesmanPerformance() {
        const salesmanMap =
            new Map();

        currentData.target.forEach(
            targetRow => {
                const code =
                    getSalesmanCode(
                        targetRow
                    );

                if (!code) {
                    return;
                }

                salesmanMap.set(
                    code,
                    {
                        salesmanCode:
                            code,

                        salesmanName:
                            getSalesmanName(
                                targetRow
                            ) || code,

                        branch:
                            getBranch(
                                targetRow
                            ),

                        target:
                            getMonthlyTarget(
                                targetRow
                            ),

                        sales: 0,
                        collections: 0,
                        due: 0,
                        overdue: 0,
                        invoiceCount: 0,
                        customerCodes:
                            new Set()
                    }
                );
            }
        );

        function ensureSalesman(row) {
            const code =
                getSalesmanCode(row);

            if (!code) {
                return null;
            }

            if (
                !salesmanMap.has(code)
            ) {
                salesmanMap.set(
                    code,
                    {
                        salesmanCode:
                            code,

                        salesmanName:
                            getSalesmanName(
                                row
                            ) || code,

                        branch:
                            getBranch(row),

                        target: 0,
                        sales: 0,
                        collections: 0,
                        due: 0,
                        overdue: 0,
                        invoiceCount: 0,
                        customerCodes:
                            new Set()
                    }
                );
            }

            return salesmanMap.get(
                code
            );
        }

        currentData.invoices.forEach(
            row => {
                const salesman =
                    ensureSalesman(row);

                if (!salesman) {
                    return;
                }

                salesman.sales +=
                    getSales(row);

                salesman.invoiceCount +=
                    1;

                const customerCode =
                    getCustomerCode(row);

                if (customerCode) {
                    salesman.customerCodes
                        .add(customerCode);
                }
            }
        );

        currentData.collections.forEach(
            row => {
                const salesman =
                    ensureSalesman(row);

                if (!salesman) {
                    return;
                }

                salesman.collections +=
                    getCollection(row);

                const customerCode =
                    getCustomerCode(row);

                if (customerCode) {
                    salesman.customerCodes
                        .add(customerCode);
                }
            }
        );

        currentData.dueOverdue.forEach(
            row => {
                const salesman =
                    ensureSalesman(row);

                if (!salesman) {
                    return;
                }

                const balance =
                    getBalance(row);

                if (
                    getStatus(row) ===
                    "overdue"
                ) {
                    salesman.overdue +=
                        balance;
                } else {
                    salesman.due +=
                        balance;
                }

                const customerCode =
                    getCustomerCode(row);

                if (customerCode) {
                    salesman.customerCodes
                        .add(customerCode);
                }
            }
        );

        return Array.from(
            salesmanMap.values()
        ).map(row => {
            const achievement =
                row.target > 0
                    ? (
                          row.sales /
                          row.target
                      ) * 100
                    : 0;

            return {
                ...row,

                achievement,

                customerCount:
                    row.customerCodes
                        .size
            };
        });
    }

    /* =====================================================
       أداء الفروع
    ===================================================== */

    function buildBranchPerformance() {
        const branchMap =
            new Map();

        currentData.invoices.forEach(
            row => {
                const branch =
                    getBranch(row) ||
                    utils.t(
                        "common.unknown",
                        "غير محدد"
                    );

                if (
                    !branchMap.has(branch)
                ) {
                    branchMap.set(
                        branch,
                        {
                            branch,
                            sales: 0,
                            invoiceCount: 0,
                            customerCodes:
                                new Set()
                        }
                    );
                }

                const branchData =
                    branchMap.get(branch);

                branchData.sales +=
                    getSales(row);

                branchData.invoiceCount +=
                    1;

                const customerCode =
                    getCustomerCode(row);

                if (customerCode) {
                    branchData
                        .customerCodes
                        .add(customerCode);
                }
            }
        );

        return Array.from(
            branchMap.values()
        ).map(row => ({
            ...row,

            customerCount:
                row.customerCodes.size
        }));
    }

    /* =====================================================
       بيانات العملاء
    ===================================================== */

    function buildCustomers() {
        const customerMap =
            new Map();

        function getCustomerKey(row) {
            const code =
                getCustomerCode(row);

            const name =
                getCustomerName(row);

            return (
                code ||
                normalizeText(name)
            );
        }

        function ensureCustomer(row) {
            const key =
                getCustomerKey(row);

            if (!key) {
                return null;
            }

            if (
                !customerMap.has(key)
            ) {
                customerMap.set(
                    key,
                    {
                        customerCode:
                            getCustomerCode(
                                row
                            ),

                        customerName:
                            getCustomerName(
                                row
                            ) ||
                            getCustomerCode(
                                row
                            ),

                        salesmanCode:
                            getSalesmanCode(
                                row
                            ),

                        salesmanName:
                            getSalesmanName(
                                row
                            ),

                        branch:
                            getBranch(row),

                        sales: 0,
                        collections: 0,
                        due: 0,
                        overdue: 0,
                        balance: 0,
                        creditLimit: 0,
                        overdueDays: 0,
                        lastPurchase: "",
                        invoiceCount: 0
                    }
                );
            }

            const customer =
                customerMap.get(key);

            if (
                !customer.customerName
            ) {
                customer.customerName =
                    getCustomerName(row);
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

            return customer;
        }

        currentData.invoices.forEach(
            row => {
                const customer =
                    ensureCustomer(row);

                if (!customer) {
                    return;
                }

                customer.sales +=
                    getSales(row);

                customer.invoiceCount +=
                    1;

                const invoiceDate =
                    getInvoiceDate(row);

                const parsedInvoiceDate =
                    parseDate(invoiceDate);

                const parsedLastPurchase =
                    parseDate(
                        customer.lastPurchase
                    );

                if (
                    parsedInvoiceDate &&
                    (
                        !parsedLastPurchase ||
                        parsedInvoiceDate >
                            parsedLastPurchase
                    )
                ) {
                    customer.lastPurchase =
                        invoiceDate;
                }
            }
        );

        currentData.collections.forEach(
            row => {
                const customer =
                    ensureCustomer(row);

                if (!customer) {
                    return;
                }

                customer.collections +=
                    getCollection(row);
            }
        );

        currentData.dueOverdue.forEach(
            row => {
                const customer =
                    ensureCustomer(row);

                if (!customer) {
                    return;
                }

                const balance =
                    getBalance(row);

                customer.balance +=
                    balance;

                customer.creditLimit =
                    Math.max(
                        customer.creditLimit,
                        getCreditLimit(row)
                    );

                customer.overdueDays =
                    Math.max(
                        customer.overdueDays,
                        getOverdueDays(row)
                    );

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
            }
        );

        const referenceDate =
            getReferenceDate();

        return Array.from(
            customerMap.values()
        ).map(customer => {
            const purchaseDate =
                parseDate(
                    customer.lastPurchase
                );

            const inactiveDays =
                purchaseDate
                    ? Math.max(
                          0,
                          daysBetween(
                              purchaseDate,
                              referenceDate
                          )
                      )
                    : null;

            const overCreditAmount =
                customer.creditLimit > 0
                    ? Math.max(
                          0,
                          customer.balance -
                              customer.creditLimit
                      )
                    : 0;

            return {
                ...customer,
                inactiveDays,
                overCreditAmount
            };
        });
    }

    /* =====================================================
       تصميم العناصر
    ===================================================== */

    function getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>

                <span>
                    ${escapeHTML(
                        utils.t(
                            "common.noData",
                            "لا توجد بيانات متاحة"
                        )
                    )}
                </span>
            </div>
        `;
    }

    function getProgressWidth(value) {
        return Math.min(
            Math.max(
                toNumber(value),
                0
            ),
            100
        );
    }

    function createSalesmanItem(
        salesman,
        index
    ) {
        const achievement =
            toNumber(
                salesman.achievement
            );

        const statusClass =
            achievement >= 100
                ? "status-success"
                : achievement >= 70
                  ? "status-warning"
                  : "status-danger";

        const performanceClass =
            achievement >= 100
                ? "performance-high"
                : achievement >= 70
                  ? "performance-medium"
                  : "performance-low";

        return `
            <div class="intelligence-list-item intelligence-salesman-item ${performanceClass}">

                <div class="intelligence-rank">
                    ${index + 1}
                </div>

                <div class="intelligence-item-main">

                    <div class="intelligence-item-header">
                        <div class="intelligence-item-identity">
                            <strong title="${escapeHTML(salesman.salesmanName)}">
                                ${escapeHTML(
                                    salesman.salesmanName
                                )}
                            </strong>

                            <small>
                                <i class="fa-solid fa-id-badge"></i>
                                ${escapeHTML(
                                    salesman.salesmanCode
                                )}
                                ${
                                    salesman.branch
                                        ? `<span class="intelligence-meta-separator">•</span><i class="fa-solid fa-location-dot"></i>${escapeHTML(
                                              salesman.branch
                                          )}`
                                        : ""
                                }
                            </small>
                        </div>

                        <span class="status-badge ${statusClass}">
                            ${escapeHTML(
                                formatPercentage(
                                    achievement
                                )
                            )}
                        </span>
                    </div>

                    <div class="intelligence-metric-grid">
                        <div class="intelligence-metric">
                            <span>${escapeHTML(utils.t("targets.sales", "المبيعات"))}</span>
                            <strong>${escapeHTML(formatCurrency(salesman.sales))}</strong>
                        </div>

                        <div class="intelligence-metric">
                            <span>${escapeHTML(utils.t("targets.monthlyTarget", "الهدف الشهري"))}</span>
                            <strong>${escapeHTML(formatCurrency(salesman.target))}</strong>
                        </div>
                    </div>

                    <div class="intelligence-progress-row">
                        <span>${escapeHTML(utils.t("targets.achievement", "نسبة الإنجاز"))}</span>
                        <div class="progress-track">
                            <div
                                class="progress-value"
                                style="width: ${getProgressWidth(achievement)}%"
                            ></div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    function createBranchItem(
        branch,
        index
    ) {
        return `
            <div class="intelligence-list-item intelligence-branch-item">
                <div class="intelligence-rank">
                    ${index + 1}
                </div>

                <div class="intelligence-item-icon branch-icon">
                    <i class="fa-solid fa-store"></i>
                </div>

                <div class="intelligence-item-main">
                    <div class="intelligence-item-header">
                        <div class="intelligence-item-identity">
                            <strong title="${escapeHTML(branch.branch)}">
                                ${escapeHTML(branch.branch)}
                            </strong>
                            <small>
                                <i class="fa-regular fa-file-lines"></i>
                                ${escapeHTML(`${utils.formatNumber(branch.invoiceCount)} ${utils.t("dashboard.invoiceCount", "فاتورة")}`)}
                            </small>
                        </div>

                        <strong class="intelligence-primary-value">
                            ${escapeHTML(formatCurrency(branch.sales))}
                        </strong>
                    </div>

                    <div class="intelligence-branch-stats">
                        <span>
                            <i class="fa-solid fa-users"></i>
                            ${escapeHTML(utils.t("dashboard.activeCustomers", "العملاء"))}
                            <strong>${escapeHTML(utils.formatNumber(branch.customerCount))}</strong>
                        </span>
                        <span>
                            <i class="fa-solid fa-receipt"></i>
                            ${escapeHTML(utils.t("dashboard.invoiceCount", "الفواتير"))}
                            <strong>${escapeHTML(utils.formatNumber(branch.invoiceCount))}</strong>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    function createCustomerItem(
        customer,
        type
    ) {
        let badgeText = "";
        let badgeClass = "status-warning";
        let iconClass = "fa-building-user";
        let itemClass = "customer-inactive";
        let detailItems = [];

        if (type === "inactive") {
            badgeText =
                customer.inactiveDays === null
                    ? utils.t("common.notAvailable", "غير متاح")
                    : `${utils.formatNumber(customer.inactiveDays)} ${utils.t("common.day", "يوم")}`;

            iconClass = "fa-user-clock";
            itemClass = "customer-inactive";
            detailItems = [
                {
                    icon: "fa-calendar-days",
                    label: utils.t("salesmanProfiles.lastPurchase", "آخر شراء"),
                    value: formatDate(customer.lastPurchase)
                },
                {
                    icon: "fa-chart-line",
                    label: utils.t("targets.sales", "المبيعات"),
                    value: formatCurrency(customer.sales)
                }
            ];
        }

        if (type === "credit") {
            badgeText = formatCurrency(customer.overCreditAmount);
            badgeClass = "status-danger";
            iconClass = "fa-credit-card";
            itemClass = "customer-credit";
            detailItems = [
                {
                    icon: "fa-shield-halved",
                    label: utils.t("salesmanProfiles.creditLimit", "الحد الائتماني"),
                    value: formatCurrency(customer.creditLimit)
                },
                {
                    icon: "fa-wallet",
                    label: utils.t("dashboard.outstanding", "الرصيد"),
                    value: formatCurrency(customer.balance)
                }
            ];
        }

        if (type === "risk") {
            badgeText =
                customer.overdueDays > 0
                    ? `${utils.formatNumber(customer.overdueDays)} ${utils.t("common.day", "يوم")}`
                    : formatCurrency(customer.overdue);

            badgeClass =
                customer.overdueDays > 90
                    ? "status-danger"
                    : "status-warning";
            iconClass = "fa-triangle-exclamation";
            itemClass = "customer-risk";
            detailItems = [
                {
                    icon: "fa-clock-rotate-left",
                    label: utils.t("dashboard.overdue", "المتأخر"),
                    value: formatCurrency(customer.overdue)
                },
                {
                    icon: "fa-hand-holding-dollar",
                    label: utils.t("dashboard.collections", "التحصيلات"),
                    value: formatCurrency(customer.collections)
                }
            ];
        }

        return `
            <div class="intelligence-list-item intelligence-customer-item ${itemClass}">
                <div class="intelligence-item-icon">
                    <i class="fa-solid ${iconClass}"></i>
                </div>

                <div class="intelligence-item-main">
                    <div class="intelligence-item-header">
                        <div class="intelligence-item-identity">
                            <strong title="${escapeHTML(customer.customerName)}">
                                ${escapeHTML(customer.customerName)}
                            </strong>

                            <small>
                                ${customer.customerCode ? `<i class="fa-solid fa-hashtag"></i>${escapeHTML(customer.customerCode)}` : ""}
                                ${customer.branch ? `<span class="intelligence-meta-separator">•</span><i class="fa-solid fa-location-dot"></i>${escapeHTML(customer.branch)}` : ""}
                            </small>
                        </div>

                        <span class="status-badge ${badgeClass}">
                            ${escapeHTML(badgeText)}
                        </span>
                    </div>

                    <div class="intelligence-detail-grid">
                        ${detailItems.map(item => `
                            <div class="intelligence-detail-item">
                                <span><i class="fa-solid ${item.icon}"></i>${escapeHTML(item.label)}</span>
                                <strong>${escapeHTML(item.value)}</strong>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    function renderList(
        elementId,
        rows,
        renderer
    ) {
        const container =
            utils.byId(elementId);

        if (!container) {
            return;
        }

        container.classList.add("intelligence-list");
        container.dataset.listType = elementId;

        const card = container.closest(".intelligence-card");
        if (card) {
            card.classList.add(`intelligence-card-${elementId}`);
        }

        container.innerHTML =
            rows.length
                ? rows.map(renderer).join("")
                : getEmptyState();
    }

    /* =====================================================
       العرض
    ===================================================== */

    function render() {
        const salesmen =
            buildSalesmanPerformance();

        const validSalesmen =
            salesmen.filter(
                row =>
                    row.target > 0 ||
                    row.sales > 0
            );

        const topSalesmen =
            [...validSalesmen]
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.achievement -
                            first.achievement ||
                        second.sales -
                            first.sales
                )
                .slice(0, 5);

        const underperformingSalesmen =
            validSalesmen.filter(
                row =>
                    row.target > 0 &&
                    row.achievement < 100
            );

        const lowestSalesmen =
            [...underperformingSalesmen]
                .sort(
                    (
                        first,
                        second
                    ) =>
                        first.achievement -
                            second.achievement ||
                        first.sales -
                            second.sales
                )
                .slice(0, 5);

        const topBranches =
            buildBranchPerformance()
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.sales -
                        first.sales
                )
                .slice(0, 5);

        const customers =
            buildCustomers();

        const inactiveCustomers =
            customers
                .filter(
                    customer =>
                        customer.inactiveDays ===
                            null ||
                        customer.inactiveDays >
                            30
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        (
                            second.inactiveDays ||
                            999999
                        ) -
                        (
                            first.inactiveDays ||
                            999999
                        )
                )
                .slice(0, 10);

        const overCreditCustomers =
            customers
                .filter(
                    customer =>
                        customer.overCreditAmount >
                        0
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.overCreditAmount -
                        first.overCreditAmount
                )
                .slice(0, 10);

        const riskCustomers =
            customers
                .filter(
                    customer =>
                        customer.overdue > 0 &&
                        (
                            customer.overdueDays >=
                                30 ||
                            customer.overCreditAmount >
                                0 ||
                            (
                                customer.inactiveDays !==
                                    null &&
                                customer.inactiveDays >
                                    30
                            )
                        )
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.overdueDays -
                            first.overdueDays ||
                        second.overdue -
                            first.overdue
                )
                .slice(0, 10);

        renderList(
            "topSalesmenList",
            topSalesmen,
            createSalesmanItem
        );

        renderList(
            "lowestSalesmenList",
            lowestSalesmen,
            createSalesmanItem
        );

        renderList(
            "topBranchesList",
            topBranches,
            createBranchItem
        );

        renderList(
            "inactiveCustomersList",
            inactiveCustomers,
            customer =>
                createCustomerItem(
                    customer,
                    "inactive"
                )
        );

        renderList(
            "overCreditCustomersList",
            overCreditCustomers,
            customer =>
                createCustomerItem(
                    customer,
                    "credit"
                )
        );

        renderList(
            "riskCustomersList",
            riskCustomers,
            customer =>
                createCustomerItem(
                    customer,
                    "risk"
                )
        );

        return {
            topSalesmen,
            lowestSalesmen,
            topBranches,
            inactiveCustomers,
            overCreditCustomers,
            riskCustomers
        };
    }

    function refresh() {
        return render();
    }

    function initialize() {
        render();
    }

    return Object.freeze({
        initialize,
        setData,
        getData,
        render,
        refresh,

        buildSalesmanPerformance,
        buildBranchPerformance,
        buildCustomers
    });
})();
