"use strict";

/* =========================================================
   Sales Operations Platform
   due.js
   عرض المستحقات والمتأخرات والبحث والفلترة والتصدير
========================================================= */

window.DashboardDue = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;

    if (!config) {
        throw new Error(
            "DashboardConfig is not available. Load utils.js before due.js."
        );
    }

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before due.js."
        );
    }

    let allRows = [];
    let searchText = "";
    let agingFilter = "";
    let currentPage = 1;
    let eventsBound = false;

    /* =====================================================
       توحيد حالة المستحق والمتأخر
    ===================================================== */

    function normalizeStatus(value, overdueDays = 0) {
        const status = utils
            .normalizeText(value)
            .replace(/\s+/g, "");

        if (
            status === "overdue" ||
            status === "متأخر" ||
            utils.toNumber(overdueDays) > 0
        ) {
            return "overdue";
        }

        return "due";
    }

    /* =====================================================
       توحيد بيانات الصف
    ===================================================== */

    function normalizeRow(row = {}) {
        const allowedDays = utils.toNumber(
            utils.firstValue(
                row,
                [
                    "allowedDays",
                    "allowedCreditDays",
                    "Allowed Days"
                ],
                0
            )
        );

        const invoiceAge = utils.toNumber(
            utils.firstValue(
                row,
                [
                    "invoiceAge",
                    "invoiceAgeDays",
                    "agingDays",
                    "outstandingDays",
                    "Invoice Age"
                ],
                0
            )
        );

        const suppliedOverdueDays = utils.toNumber(
            utils.firstValue(
                row,
                [
                    "overdueDays",
                    "Overdue Days"
                ],
                0
            )
        );

        const overdueDays = Math.max(
            suppliedOverdueDays,
            invoiceAge - allowedDays,
            0
        );

        const status = normalizeStatus(
            utils.firstValue(
                row,
                ["status", "Status"],
                ""
            ),
            overdueDays
        );

        const invoiceBalance = utils.toNumber(
            utils.firstValue(
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

        return {
            salesmanCode: utils.normalizeCode(
                utils.firstValue(
                    row,
                    [
                        "salesmanCode",
                        "Salesman Code",
                        "salesCode"
                    ],
                    ""
                )
            ),

            salesmanName: String(
                utils.firstValue(
                    row,
                    [
                        "salesmanName",
                        "Salesman Name",
                        "name"
                    ],
                    ""
                )
            ).trim(),

            branch: String(
                utils.firstValue(
                    row,
                    [
                        "branch",
                        "Branch"
                    ],
                    ""
                )
            ).trim(),

            customerCode: utils.normalizeCode(
                utils.firstValue(
                    row,
                    [
                        "customerCode",
                        "Customer Code",
                        "accountCode"
                    ],
                    ""
                )
            ),

            customerName: String(
                utils.firstValue(
                    row,
                    [
                        "customerName",
                        "Customer Name",
                        "customer"
                    ],
                    ""
                )
            ).trim(),

            allowedDays,

            creditLimit: utils.toNumber(
                utils.firstValue(
                    row,
                    [
                        "creditLimit",
                        "Credit Limit",
                        "credit"
                    ],
                    0
                )
            ),

            invoiceNo: utils.normalizeCode(
                utils.firstValue(
                    row,
                    [
                        "invoiceNo",
                        "invoiceNumber",
                        "Invoice Number"
                    ],
                    ""
                )
            ),

            invoiceDate: utils.firstValue(
                row,
                [
                    "invoiceDate",
                    "Invoice Date",
                    "date"
                ],
                ""
            ),

            invoiceBalance,
            invoiceAge,
            overdueDays,
            outstandingDays: overdueDays,
            status,

            dueAmount:
                status === "due"
                    ? invoiceBalance
                    : 0,

            overdueAmount:
                status === "overdue"
                    ? invoiceBalance
                    : 0,

            totalBalance: invoiceBalance
        };
    }

    function normalizeRows(rows) {
        if (!Array.isArray(rows)) {
            return [];
        }

        return rows
            .filter(
                row =>
                    row &&
                    typeof row === "object"
            )
            .map(normalizeRow);
    }

    /* =====================================================
       حفظ البيانات
    ===================================================== */

    function setData(rows = []) {
        allRows = normalizeRows(rows);
        currentPage = 1;

        render();

        return allRows;
    }

    function getData() {
        return [...allRows];
    }

    /* =====================================================
       Aging
    ===================================================== */

    function getAgingKey(rowOrDays) {
        const row =
            rowOrDays &&
            typeof rowOrDays === "object"
                ? rowOrDays
                : null;

        const status = row
            ? row.status
            : "";

        const days = utils.toNumber(
            row
                ? row.overdueDays
                : rowOrDays
        );

        if (status === "due" || days <= 0) {
            return "due";
        }

        if (days <= 30) {
            return "1-30";
        }

        if (days <= 60) {
            return "31-60";
        }

        if (days <= 90) {
            return "61-90";
        }

        return "90+";
    }

    function getAgingLabel(row) {
        const key = getAgingKey(row);

        const translationKeys = {
            due:
                "dueOverdue.dueStatus",

            "1-30":
                "dueOverdue.days1To30",

            "31-60":
                "dueOverdue.days31To60",

            "61-90":
                "dueOverdue.days61To90",

            "90+":
                "dueOverdue.moreThan90Days"
        };

        const fallbackLabels = {
            due: "مستحق",
            "1-30": "من 1 إلى 30 يومًا",
            "31-60": "من 31 إلى 60 يومًا",
            "61-90": "من 61 إلى 90 يومًا",
            "90+": "أكثر من 90 يومًا"
        };

        return utils.t(
            translationKeys[key],
            fallbackLabels[key]
        );
    }

    /* =====================================================
       حالة الصف
    ===================================================== */

    function getRowStatus(row) {
        if (
            row.creditLimit > 0 &&
            row.invoiceBalance >
                row.creditLimit
        ) {
            return {
                text: utils.t(
                    "dueOverdue.overCreditLimit",
                    "تجاوز الحد الائتماني"
                ),

                className:
                    "status-danger"
            };
        }

        if (row.status === "overdue") {
            return {
                text: utils.t(
                    "dueOverdue.overdueStatus",
                    "متأخر"
                ),

                className:
                    row.overdueDays > 90
                        ? "status-danger"
                        : "status-warning"
            };
        }

        return {
            text: utils.t(
                "dueOverdue.dueStatus",
                "مستحق"
            ),

            className:
                "status-info"
        };
    }

    /* =====================================================
       البحث والفلترة
    ===================================================== */

    function getFilteredRows() {
        const search = utils.normalizeText(
            searchText
        );

        return allRows.filter(row => {
            if (
                agingFilter &&
                getAgingKey(row) !==
                    agingFilter
            ) {
                return false;
            }

            if (!search) {
                return true;
            }

            const searchableValues = [
                row.salesmanCode,
                row.salesmanName,
                row.branch,
                row.customerCode,
                row.customerName,
                row.allowedDays,
                row.creditLimit,
                row.invoiceNo,
                row.invoiceDate,
                row.invoiceBalance,
                row.invoiceAge,
                row.overdueDays,
                row.status,
                getAgingLabel(row)
            ];

            return searchableValues.some(
                value =>
                    utils
                        .normalizeText(value)
                        .includes(search)
            );
        });
    }

    function setSearch(value = "") {
        searchText =
            String(value ?? "").trim();

        currentPage = 1;
        render();
    }

    function setAgingFilter(value = "") {
        agingFilter =
            String(value ?? "").trim();

        currentPage = 1;
        render();
    }

    function clearFilters() {
        searchText = "";
        agingFilter = "";
        currentPage = 1;

        const searchInput = utils.byId(
            "dueOverdueSearchInput"
        );

        const agingSelect = utils.byId(
            "agingFilter"
        );

        if (searchInput) {
            searchInput.value = "";
        }

        if (agingSelect) {
            agingSelect.value = "";
        }

        render();
    }

    /* =====================================================
       ملخص المستحقات
    ===================================================== */

    function calculateSummary(rows = allRows) {
        const safeRows =
            Array.isArray(rows)
                ? rows
                : [];

        const dueRows = safeRows.filter(
            row => row.status === "due"
        );

        const overdueRows =
            safeRows.filter(
                row =>
                    row.status ===
                    "overdue"
            );

        const totalDue = utils.sumBy(
            dueRows,
            row => row.invoiceBalance
        );

        const totalOverdue = utils.sumBy(
            overdueRows,
            row => row.invoiceBalance
        );

        return {
            totalDue,
            totalOverdue,

            totalOutstanding:
                totalDue +
                totalOverdue,

            dueCount:
                dueRows.length,

            overdueCount:
                overdueRows.length,

            over90DaysCount:
                overdueRows.filter(
                    row =>
                        row.overdueDays > 90
                ).length
        };
    }

    function renderSummary() {
        const summary =
            calculateSummary(allRows);

        utils.setText(
            "duePageTotal",
            utils.formatCurrency(
                summary.totalDue
            )
        );

        utils.setText(
            "overduePageTotal",
            utils.formatCurrency(
                summary.totalOverdue
            )
        );

        utils.setText(
            "outstandingPageTotal",
            utils.formatCurrency(
                summary.totalOutstanding
            )
        );

        utils.setText(
            "over90DaysCount",
            utils.formatNumber(
                summary.over90DaysCount
            )
        );

        return summary;
    }

    /* =====================================================
       صف الجدول
    ===================================================== */

    function createTableRow(row) {
        const status =
            getRowStatus(row);

        return `
            <tr>
                <td>
                    ${utils.escapeHTML(
                        row.customerCode ||
                        "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.customerName ||
                        "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.salesmanCode ||
                        "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.salesmanName ||
                        "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.branch ||
                        "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        utils.formatCurrency(
                            row.creditLimit
                        )
                    )}
                </td>

                <td class="amount-warning">
                    ${utils.escapeHTML(
                        utils.formatCurrency(
                            row.dueAmount
                        )
                    )}
                </td>

                <td class="amount-danger">
                    ${utils.escapeHTML(
                        utils.formatCurrency(
                            row.overdueAmount
                        )
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        utils.formatCurrency(
                            row.totalBalance
                        )
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        utils.formatNumber(
                            row.overdueDays
                        )
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        getAgingLabel(row)
                    )}
                </td>

                <td>
                    <span
                        class="status-badge ${status.className}"
                    >
                        ${utils.escapeHTML(
                            status.text
                        )}
                    </span>
                </td>
            </tr>
        `;
    }

    /* =====================================================
       عرض الجدول
    ===================================================== */

    function renderTable(rows) {
        const body = utils.byId(
            "dueOverdueTableBody"
        );

        if (!body) {
            return;
        }

        if (!rows.length) {
            body.innerHTML =
                utils.emptyTableRow(12);

            return;
        }

        body.innerHTML = rows
            .map(createTableRow)
            .join("");
    }

    /* =====================================================
       Pagination
    ===================================================== */

    function renderPagination(pagination) {
        const footer = utils.byId(
            "dueOverdueTableFooter"
        );

        if (!footer) {
            return;
        }

        footer.innerHTML = `
            <span>
                ${utils.escapeHTML(
                    `${pagination.firstRecord} - ${pagination.lastRecord} / ${pagination.totalRows}`
                )}
            </span>

            <div class="table-pagination">
                <button
                    class="pagination-button"
                    id="duePreviousPage"
                    type="button"
                    ${
                        pagination.page <= 1
                            ? "disabled"
                            : ""
                    }
                >
                    <i class="fa-solid fa-chevron-${
                        utils.getLanguage() ===
                        "ar"
                            ? "right"
                            : "left"
                    }"></i>
                </button>

                <span class="pagination-button active">
                    ${utils.escapeHTML(
                        `${pagination.page} / ${pagination.totalPages}`
                    )}
                </span>

                <button
                    class="pagination-button"
                    id="dueNextPage"
                    type="button"
                    ${
                        pagination.page >=
                        pagination.totalPages
                            ? "disabled"
                            : ""
                    }
                >
                    <i class="fa-solid fa-chevron-${
                        utils.getLanguage() ===
                        "ar"
                            ? "left"
                            : "right"
                    }"></i>
                </button>
            </div>
        `;

        utils
            .byId("duePreviousPage")
            ?.addEventListener(
                "click",
                previousPage
            );

        utils
            .byId("dueNextPage")
            ?.addEventListener(
                "click",
                nextPage
            );
    }

    function previousPage() {
        if (currentPage <= 1) {
            return;
        }

        currentPage -= 1;
        render();
    }

    function nextPage() {
        const rows =
            getFilteredRows();

        const totalPages = Math.max(
            1,
            Math.ceil(
                rows.length /
                config.PAGE_SIZE
            )
        );

        if (currentPage >= totalPages) {
            return;
        }

        currentPage += 1;
        render();
    }

    function goToPage(page) {
        const rows =
            getFilteredRows();

        const totalPages = Math.max(
            1,
            Math.ceil(
                rows.length /
                config.PAGE_SIZE
            )
        );

        currentPage = utils.clamp(
            page,
            1,
            totalPages
        );

        render();
    }

    /* =====================================================
       العرض الكامل
    ===================================================== */

    function render() {
        renderSummary();

        const filteredRows =
            getFilteredRows();

        const pagination =
            utils.paginate(
                filteredRows,
                currentPage,
                config.PAGE_SIZE
            );

        currentPage =
            pagination.page;

        renderTable(
            pagination.rows
        );

        renderPagination(
            pagination
        );

        return {
            rows: filteredRows,
            pagination,
            summary:
                calculateSummary(allRows)
        };
    }

    /* =====================================================
       تجهيز التصدير
    ===================================================== */

    function getExportRows() {
        return getFilteredRows().map(
            row => ({
                [utils.t(
                    "dueOverdue.customerCode",
                    "كود العميل"
                )]:
                    row.customerCode,

                [utils.t(
                    "dueOverdue.customerName",
                    "اسم العميل"
                )]:
                    row.customerName,

                [utils.t(
                    "dueOverdue.salesmanCode",
                    "كود المندوب"
                )]:
                    row.salesmanCode,

                [utils.t(
                    "dueOverdue.salesmanName",
                    "اسم المندوب"
                )]:
                    row.salesmanName,

                [utils.t(
                    "dueOverdue.branch",
                    "الفرع"
                )]:
                    row.branch,

                [utils.t(
                    "dueOverdue.creditLimit",
                    "الحد الائتماني"
                )]:
                    row.creditLimit,

                ["رقم الفاتورة"]:
                    row.invoiceNo,

                ["تاريخ الفاتورة"]:
                    row.invoiceDate
                        ? utils.formatDate(
                            row.invoiceDate
                        )
                        : "",

                ["أيام الائتمان"]:
                    row.allowedDays,

                ["عمر الفاتورة"]:
                    row.invoiceAge,

                [utils.t(
                    "dueOverdue.dueAmount",
                    "المستحق"
                )]:
                    row.dueAmount,

                [utils.t(
                    "dueOverdue.overdueAmount",
                    "المتأخر"
                )]:
                    row.overdueAmount,

                [utils.t(
                    "dueOverdue.totalBalance",
                    "إجمالي الرصيد"
                )]:
                    row.totalBalance,

                [utils.t(
                    "dueOverdue.outstandingDays",
                    "أيام التأخير"
                )]:
                    row.overdueDays,

                [utils.t(
                    "dueOverdue.aging",
                    "فترة التأخير"
                )]:
                    getAgingLabel(row),

                [utils.t(
                    "common.status",
                    "الحالة"
                )]:
                    getRowStatus(row).text
            })
        );
    }

    /* =====================================================
       Excel
    ===================================================== */

    function exportExcel() {
        const rows =
            getExportRows();

        if (!rows.length) {
            utils.showToast(
                utils.t(
                    "messages.noExportData",
                    "لا توجد بيانات لتصديرها"
                ),
                "warning"
            );

            return false;
        }

        if (
            typeof window.XLSX ===
            "undefined"
        ) {
            utils.showToast(
                "XLSX library is not available.",
                "error"
            );

            return false;
        }

        const worksheet =
            window.XLSX.utils
                .json_to_sheet(rows);

        const workbook =
            window.XLSX.utils
                .book_new();

        window.XLSX.utils
            .book_append_sheet(
                workbook,
                worksheet,
                "Due Overdue"
            );

        const fileDate =
            utils.dateToInputValue(
                new Date()
            );

        window.XLSX.writeFile(
            workbook,
            `Due_Overdue_${fileDate}.xlsx`
        );

        utils.showToast(
            utils.t(
                "messages.excelCreated",
                "تم تجهيز ملف Excel"
            ),
            "success"
        );

        return true;
    }

    /* =====================================================
       الطباعة
    ===================================================== */

    function printDueOverdue() {
        const rows =
            getFilteredRows();

        if (!rows.length) {
            utils.showToast(
                utils.t(
                    "common.noData",
                    "لا توجد بيانات متاحة"
                ),
                "warning"
            );

            return false;
        }

        const direction =
            utils.getLanguage() === "ar"
                ? "rtl"
                : "ltr";

        const language =
            utils.getLanguage() === "ar"
                ? "ar"
                : "en";

        const summary =
            calculateSummary(rows);

        const tableRows = rows
            .map(row => {
                const status =
                    getRowStatus(row);

                return `
                    <tr>
                        <td>
                            ${utils.escapeHTML(
                                row.customerCode
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                row.customerName
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                row.salesmanCode
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                row.salesmanName
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                row.branch
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                row.invoiceNo
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                utils.formatDate(
                                    row.invoiceDate
                                )
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                utils.formatCurrency(
                                    row.creditLimit
                                )
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                utils.formatCurrency(
                                    row.dueAmount
                                )
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                utils.formatCurrency(
                                    row.overdueAmount
                                )
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                utils.formatNumber(
                                    row.overdueDays
                                )
                            )}
                        </td>

                        <td>
                            ${utils.escapeHTML(
                                status.text
                            )}
                        </td>
                    </tr>
                `;
            })
            .join("");

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1400,height=900"
            );

        if (!printWindow) {
            utils.showToast(
                "Please allow pop-ups to print the report.",
                "warning"
            );

            return false;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html
                lang="${language}"
                dir="${direction}"
            >
            <head>
                <meta charset="UTF-8">

                <title>
                    ${utils.escapeHTML(
                        utils.t(
                            "dueOverdue.title",
                            "المستحقات والمتأخرات"
                        )
                    )}
                </title>

                <style>
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 20px;
                        color: #111827;
                        font-family: Arial, sans-serif;
                        direction: ${direction};
                    }

                    h1 {
                        margin: 0 0 8px;
                        font-size: 22px;
                    }

                    .meta {
                        margin-bottom: 14px;
                        color: #64748b;
                        font-size: 12px;
                    }

                    .summary {
                        margin-bottom: 18px;
                        display: grid;
                        grid-template-columns:
                            repeat(3, 1fr);
                        gap: 10px;
                    }

                    .summary div {
                        padding: 10px;
                        border: 1px solid #cbd5e1;
                        background: #f8fafc;
                        font-size: 12px;
                        font-weight: bold;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9px;
                    }

                    th,
                    td {
                        padding: 6px;
                        border: 1px solid #cbd5e1;
                        text-align: start;
                    }

                    th {
                        background: #f1f5f9;
                        font-weight: bold;
                    }

                    thead {
                        display: table-header-group;
                    }

                    tr {
                        page-break-inside: avoid;
                    }
                </style>
            </head>

            <body>
                <h1>
                    ${utils.escapeHTML(
                        utils.t(
                            "dueOverdue.title",
                            "المستحقات والمتأخرات"
                        )
                    )}
                </h1>

                <div class="meta">
                    ${utils.escapeHTML(
                        utils.formatDateTime(
                            new Date()
                        )
                    )}
                    —
                    ${utils.escapeHTML(
                        `${rows.length} ${utils.t(
                            "common.records",
                            "سجل"
                        )}`
                    )}
                </div>

                <div class="summary">
                    <div>
                        ${utils.escapeHTML(
                            utils.t(
                                "dashboard.due",
                                "المستحقات"
                            )
                        )}:
                        ${utils.escapeHTML(
                            utils.formatCurrency(
                                summary.totalDue
                            )
                        )}
                    </div>

                    <div>
                        ${utils.escapeHTML(
                            utils.t(
                                "dashboard.overdue",
                                "المتأخرات"
                            )
                        )}:
                        ${utils.escapeHTML(
                            utils.formatCurrency(
                                summary.totalOverdue
                            )
                        )}
                    </div>

                    <div>
                        ${utils.escapeHTML(
                            utils.t(
                                "dashboard.outstanding",
                                "الرصيد القائم"
                            )
                        )}:
                        ${utils.escapeHTML(
                            utils.formatCurrency(
                                summary.totalOutstanding
                            )
                        )}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>كود العميل</th>
                            <th>اسم العميل</th>
                            <th>كود المندوب</th>
                            <th>اسم المندوب</th>
                            <th>الفرع</th>
                            <th>رقم الفاتورة</th>
                            <th>تاريخ الفاتورة</th>
                            <th>الحد الائتماني</th>
                            <th>المستحق</th>
                            <th>المتأخر</th>
                            <th>أيام التأخير</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        window.setTimeout(() => {
            printWindow.print();
        }, 300);

        return true;
    }

    /* =====================================================
       الأحداث
    ===================================================== */

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const searchInput =
            utils.byId(
                "dueOverdueSearchInput"
            );

        const agingSelect =
            utils.byId(
                "agingFilter"
            );

        const exportButton =
            utils.byId(
                "exportDueOverdueButton"
            );

        const printButton =
            utils.byId(
                "printDueOverdueButton"
            );

        searchInput?.addEventListener(
            "input",
            event => {
                setSearch(
                    event.target.value
                );
            }
        );

        agingSelect?.addEventListener(
            "change",
            event => {
                setAgingFilter(
                    event.target.value
                );
            }
        );

        exportButton?.addEventListener(
            "click",
            exportExcel
        );

        /*
         * الزر اختياري؛ إذا لم يكن موجودًا في HTML
         * فلن يحدث أي خطأ.
         */
        printButton?.addEventListener(
            "click",
            printDueOverdue
        );

        eventsBound = true;
    }

    /* =====================================================
       التهيئة
    ===================================================== */

    function initialize() {
        bindEvents();
        render();
    }

    return Object.freeze({
        initialize,
        bindEvents,

        setData,
        getData,

        setSearch,
        setAgingFilter,
        clearFilters,

        getFilteredRows,
        getAgingKey,
        getAgingLabel,
        getRowStatus,

        calculateSummary,

        render,
        goToPage,
        previousPage,
        nextPage,

        exportExcel,
        printDueOverdue
    });
})();