"use strict";

/* =========================================================
   Sales Operations Platform
   invoices.js
   عرض وبحث وتصدير وطباعة الفواتير
========================================================= */

window.DashboardInvoices = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;

    if (!config) {
        throw new Error(
            "DashboardConfig is not available. Load utils.js before invoices.js."
        );
    }

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before invoices.js."
        );
    }

    let allRows = [];
    let searchText = "";
    let currentPage = 1;
    let eventsBound = false;

    /* =====================================================
       توحيد بيانات الفواتير
    ===================================================== */

    function normalizeRow(row = {}) {
        return {
            invoiceNo:
                String(
                    utils.firstValue(
                        row,
                        [
                            "invoiceNo",
                            "invoiceNumber",
                            "Invoice Number"
                        ],
                        ""
                    )
                ).trim(),

            invoiceDate:
                utils.firstValue(
                    row,
                    [
                        "invoiceDate",
                        "Invoice Date",
                        "date"
                    ],
                    ""
                ),

            invoiceType:
                String(
                    utils.firstValue(
                        row,
                        [
                            "invoiceType",
                            "Invoice Type",
                            "type"
                        ],
                        ""
                    )
                ).trim(),

            customerCode:
                utils.normalizeCode(
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

            customerName:
                String(
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

            salesmanCode:
                utils.normalizeCode(
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

            salesmanName:
                String(
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

            branch:
                String(
                    utils.firstValue(
                        row,
                        [
                            "branch",
                            "Branch",
                            "sheetBranch"
                        ],
                        ""
                    )
                ).trim(),

            salesWithoutTax:
                utils.toNumber(
                    utils.firstValue(
                        row,
                        [
                            "salesWithoutTax",
                            "netSale",
                            "netSales",
                            "Net Sales"
                        ],
                        0
                    )
                ),

            invoiceAmount:
                utils.toNumber(
                    utils.firstValue(
                        row,
                        [
                            "invoiceAmount",
                            "Invoice Amount",
                            "totalAmount"
                        ],
                        0
                    )
                )
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
       البحث
    ===================================================== */

    function getFilteredRows() {
        const search =
            utils.normalizeText(
                searchText
            );

        if (!search) {
            return [...allRows];
        }

        return allRows.filter(row => {
            const searchableValues = [
                row.invoiceNo,
                row.invoiceDate,
                row.invoiceType,
                row.customerCode,
                row.customerName,
                row.salesmanCode,
                row.salesmanName,
                row.branch,
                row.salesWithoutTax,
                row.invoiceAmount
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

    function clearSearch() {
        searchText = "";

        const input =
            utils.byId(
                "invoicesSearchInput"
            );

        if (input) {
            input.value = "";
        }

        currentPage = 1;
        render();
    }

    /* =====================================================
       إنشاء صف الجدول
    ===================================================== */

    function createTableRow(row) {
        return `
            <tr>
                <td>
                    ${utils.escapeHTML(
                        row.invoiceNo || "--"
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
                        row.invoiceType || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.customerCode || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.customerName || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.salesmanCode || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.salesmanName || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.branch || "--"
                    )}
                </td>

                <td class="amount-positive">
                    ${utils.escapeHTML(
                        utils.formatCurrency(
                            row.salesWithoutTax
                        )
                    )}
                </td>
            </tr>
        `;
    }

    /* =====================================================
       عرض الجدول
    ===================================================== */

    function renderTable(rows) {
        const body =
            utils.byId(
                "invoicesTableBody"
            );

        if (!body) {
            return;
        }

        if (!rows.length) {
            body.innerHTML =
                utils.emptyTableRow(9);

            return;
        }

        body.innerHTML =
            rows
                .map(createTableRow)
                .join("");
    }

    /* =====================================================
       تقسيم الصفحات
    ===================================================== */

    function renderPagination(pagination) {
        const footer =
            utils.byId(
                "invoicesTableFooter"
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
                    id="invoicesPreviousPage"
                    type="button"
                    ${pagination.page <= 1
                        ? "disabled"
                        : ""}
                >
                    <i class="fa-solid fa-chevron-${
                        utils.getLanguage() === "ar"
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
                    id="invoicesNextPage"
                    type="button"
                    ${pagination.page >= pagination.totalPages
                        ? "disabled"
                        : ""}
                >
                    <i class="fa-solid fa-chevron-${
                        utils.getLanguage() === "ar"
                            ? "left"
                            : "right"
                    }"></i>
                </button>
            </div>
        `;

        utils
            .byId("invoicesPreviousPage")
            ?.addEventListener(
                "click",
                previousPage
            );

        utils
            .byId("invoicesNextPage")
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

        const totalPages =
            Math.max(
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

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    rows.length /
                    config.PAGE_SIZE
                )
            );

        currentPage =
            utils.clamp(
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
            pagination
        };
    }

    /* =====================================================
       تصدير Excel
    ===================================================== */

    function getExportRows() {
        return getFilteredRows().map(
            row => ({
                [utils.t(
                    "invoices.invoiceNumber",
                    "رقم الفاتورة"
                )]:
                    row.invoiceNo,

                [utils.t(
                    "invoices.invoiceDate",
                    "تاريخ الفاتورة"
                )]:
                    utils.formatDate(
                        row.invoiceDate
                    ),

                [utils.t(
                    "invoices.invoiceType",
                    "نوع الفاتورة"
                )]:
                    row.invoiceType,

                [utils.t(
                    "invoices.customerCode",
                    "كود العميل"
                )]:
                    row.customerCode,

                [utils.t(
                    "invoices.customerName",
                    "اسم العميل"
                )]:
                    row.customerName,

                [utils.t(
                    "invoices.salesmanCode",
                    "كود المندوب"
                )]:
                    row.salesmanCode,

                [utils.t(
                    "invoices.salesmanName",
                    "اسم المندوب"
                )]:
                    row.salesmanName,

                [utils.t(
                    "invoices.branch",
                    "الفرع"
                )]:
                    row.branch,

                [utils.t(
                    "invoices.netSales",
                    "صافي المبيعات"
                )]:
                    row.salesWithoutTax
            })
        );
    }

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
                "Invoices"
            );

        const fileDate =
            utils.dateToInputValue(
                new Date()
            );

        window.XLSX.writeFile(
            workbook,
            `Invoices_${fileDate}.xlsx`
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

    function printInvoices() {
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

        const tableRows =
            rows.map(row => `
                <tr>
                    <td>${utils.escapeHTML(row.invoiceNo)}</td>
                    <td>${utils.escapeHTML(
                        utils.formatDate(row.invoiceDate)
                    )}</td>
                    <td>${utils.escapeHTML(row.invoiceType)}</td>
                    <td>${utils.escapeHTML(row.customerCode)}</td>
                    <td>${utils.escapeHTML(row.customerName)}</td>
                    <td>${utils.escapeHTML(row.salesmanCode)}</td>
                    <td>${utils.escapeHTML(row.salesmanName)}</td>
                    <td>${utils.escapeHTML(row.branch)}</td>
                    <td>${utils.escapeHTML(
                        utils.formatCurrency(
                            row.salesWithoutTax
                        )
                    )}</td>
                </tr>
            `).join("");

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
            <html lang="${language}" dir="${direction}">
            <head>
                <meta charset="UTF-8">

                <title>
                    ${utils.escapeHTML(
                        utils.t(
                            "invoices.title",
                            "بيانات الفواتير"
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
                        margin-bottom: 18px;
                        color: #64748b;
                        font-size: 12px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                    }

                    th,
                    td {
                        padding: 7px;
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
                            "invoices.title",
                            "بيانات الفواتير"
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

                <table>
                    <thead>
                        <tr>
                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.invoiceNumber",
                                    "رقم الفاتورة"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.invoiceDate",
                                    "تاريخ الفاتورة"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.invoiceType",
                                    "نوع الفاتورة"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.customerCode",
                                    "كود العميل"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.customerName",
                                    "اسم العميل"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.salesmanCode",
                                    "كود المندوب"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.salesmanName",
                                    "اسم المندوب"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.branch",
                                    "الفرع"
                                )
                            )}</th>

                            <th>${utils.escapeHTML(
                                utils.t(
                                    "invoices.netSales",
                                    "صافي المبيعات"
                                )
                            )}</th>
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
       ربط أحداث الصفحة
    ===================================================== */

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const searchInput =
            utils.byId(
                "invoicesSearchInput"
            );

        const exportButton =
            utils.byId(
                "exportInvoicesButton"
            );

        const printButton =
            utils.byId(
                "printInvoicesButton"
            );

        searchInput?.addEventListener(
            "input",
            event => {
                setSearch(
                    event.target.value
                );
            }
        );

        exportButton?.addEventListener(
            "click",
            exportExcel
        );

        printButton?.addEventListener(
            "click",
            printInvoices
        );

        eventsBound = true;
    }

    /* =====================================================
       تهيئة الملف
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
        clearSearch,
        getFilteredRows,

        render,
        goToPage,
        previousPage,
        nextPage,

        exportExcel,
        printInvoices
    });
})();