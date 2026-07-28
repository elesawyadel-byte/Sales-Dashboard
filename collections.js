"use strict";

/* =========================================================
   Sales Operations Platform
   collections.js
   عرض وبحث وتصدير وطباعة التحصيلات
========================================================= */

window.DashboardCollections = (() => {
    const config = window.DashboardConfig;
    const utils = window.DashboardUtils;

    if (!config) {
        throw new Error(
            "DashboardConfig is not available. Load utils.js before collections.js."
        );
    }

    if (!utils) {
        throw new Error(
            "DashboardUtils is not available. Load utils.js before collections.js."
        );
    }

    let allRows = [];
    let searchText = "";
    let currentPage = 1;
    let eventsBound = false;

    /* =====================================================
       توحيد بيانات التحصيلات
    ===================================================== */

    function normalizeRow(row = {}) {
        return {
            receiptNo:
                String(
                    utils.firstValue(
                        row,
                        [
                            "receiptNo",
                            "receiptNumber",
                            "Receipt Number"
                        ],
                        ""
                    )
                ).trim(),

            paymentReceiptNo:
                String(
                    utils.firstValue(
                        row,
                        [
                            "paymentReceiptNo",
                            "paymentReceiptNumber",
                            "Payment Receipt Number"
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

            collectionDate:
                utils.firstValue(
                    row,
                    [
                        "collectionDate",
                        "Collection Date",
                        "paymentDate",
                        "date"
                    ],
                    ""
                ),

            chequeNo:
                String(
                    utils.firstValue(
                        row,
                        [
                            "chequeNo",
                            "chequeNumber",
                            "paymentReference",
                            "reference"
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
                            "Branch"
                        ],
                        ""
                    )
                ).trim(),

            amount:
                utils.toNumber(
                    utils.firstValue(
                        row,
                        [
                            "amount",
                            "Amount"
                        ],
                        0
                    )
                ),

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
                        "Invoice Date"
                    ],
                    ""
                ),

            collectionAmount:
                utils.toNumber(
                    utils.firstValue(
                        row,
                        [
                            "collectionAmount",
                            "collection",
                            "Collection Amount"
                        ],
                        0
                    )
                ),

            invoiceBalance:
                utils.toNumber(
                    utils.firstValue(
                        row,
                        [
                            "invoiceBalance",
                            "balance",
                            "Invoice Balance"
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
                row.receiptNo,
                row.paymentReceiptNo,
                row.customerCode,
                row.customerName,
                row.collectionDate,
                row.chequeNo,
                row.salesmanCode,
                row.salesmanName,
                row.branch,
                row.amount,
                row.invoiceNo,
                row.invoiceDate,
                row.collectionAmount,
                row.invoiceBalance
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
                "collectionsSearchInput"
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
                        row.receiptNo || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        row.paymentReceiptNo || "--"
                    )}
                </td>

                <td>
                    ${utils.escapeHTML(
                        utils.formatDate(
                            row.collectionDate
                        )
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
                            row.collectionAmount
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
                "collectionsTableBody"
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
                "collectionsTableFooter"
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
                    id="collectionsPreviousPage"
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
                    id="collectionsNextPage"
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
            .byId(
                "collectionsPreviousPage"
            )
            ?.addEventListener(
                "click",
                previousPage
            );

        utils
            .byId(
                "collectionsNextPage"
            )
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
       تجهيز بيانات Excel
    ===================================================== */

    function getExportRows() {
        return getFilteredRows().map(
            row => ({
                [utils.t(
                    "collections.receiptNumber",
                    "رقم الإيصال"
                )]:
                    row.receiptNo,

                [utils.t(
                    "collections.paymentReceiptNumber",
                    "رقم سند القبض"
                )]:
                    row.paymentReceiptNo,

                [utils.t(
                    "collections.collectionDate",
                    "تاريخ التحصيل"
                )]:
                    utils.formatDate(
                        row.collectionDate
                    ),

                [utils.t(
                    "collections.customerCode",
                    "كود العميل"
                )]:
                    row.customerCode,

                [utils.t(
                    "collections.customerName",
                    "اسم العميل"
                )]:
                    row.customerName,

                [utils.t(
                    "collections.salesmanCode",
                    "كود المندوب"
                )]:
                    row.salesmanCode,

                [utils.t(
                    "collections.salesmanName",
                    "اسم المندوب"
                )]:
                    row.salesmanName,

                [utils.t(
                    "collections.branch",
                    "الفرع"
                )]:
                    row.branch,

                [utils.t(
                    "collections.collectionAmount",
                    "المبلغ المحصل"
                )]:
                    row.collectionAmount,

                ["رقم الشيك / المرجع"]:
                    row.chequeNo,

                ["رقم الفاتورة"]:
                    row.invoiceNo,

                ["تاريخ الفاتورة"]:
                    row.invoiceDate
                        ? utils.formatDate(
                            row.invoiceDate
                        )
                        : "",

                ["رصيد الفاتورة"]:
                    row.invoiceBalance
            })
        );
    }

    /* =====================================================
       تصدير Excel
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
                "Collections"
            );

        const fileDate =
            utils.dateToInputValue(
                new Date()
            );

        window.XLSX.writeFile(
            workbook,
            `Collections_${fileDate}.xlsx`
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

    function printCollections() {
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

        const totalCollections =
            utils.sumBy(
                rows,
                row =>
                    row.collectionAmount
            );

        const tableRows =
            rows.map(row => `
                <tr>
                    <td>
                        ${utils.escapeHTML(
                            row.receiptNo
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            row.paymentReceiptNo
                        )}
                    </td>

                    <td>
                        ${utils.escapeHTML(
                            utils.formatDate(
                                row.collectionDate
                            )
                        )}
                    </td>

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
                            utils.formatCurrency(
                                row.collectionAmount
                            )
                        )}
                    </td>
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
            <html
                lang="${language}"
                dir="${direction}"
            >
            <head>
                <meta charset="UTF-8">

                <title>
                    ${utils.escapeHTML(
                        utils.t(
                            "collections.title",
                            "بيانات التحصيلات"
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
                        margin-bottom: 10px;
                        color: #64748b;
                        font-size: 12px;
                    }

                    .summary {
                        margin-bottom: 18px;
                        padding: 12px;
                        background: #f1f5f9;
                        border: 1px solid #cbd5e1;
                        font-size: 13px;
                        font-weight: bold;
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
                            "collections.title",
                            "بيانات التحصيلات"
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
                    ${utils.escapeHTML(
                        utils.t(
                            "dashboard.collections",
                            "إجمالي التحصيلات"
                        )
                    )}:
                    ${utils.escapeHTML(
                        utils.formatCurrency(
                            totalCollections
                        )
                    )}
                </div>

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
                                        "collections.customerCode",
                                        "كود العميل"
                                    )
                                )}
                            </th>

                            <th>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "collections.customerName",
                                        "اسم العميل"
                                    )
                                )}
                            </th>

                            <th>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "collections.salesmanCode",
                                        "كود المندوب"
                                    )
                                )}
                            </th>

                            <th>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "collections.salesmanName",
                                        "اسم المندوب"
                                    )
                                )}
                            </th>

                            <th>
                                ${utils.escapeHTML(
                                    utils.t(
                                        "collections.branch",
                                        "الفرع"
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
       ربط الأحداث
    ===================================================== */

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const searchInput =
            utils.byId(
                "collectionsSearchInput"
            );

        const exportButton =
            utils.byId(
                "exportCollectionsButton"
            );

        const printButton =
            utils.byId(
                "printCollectionsButton"
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
            printCollections
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
        clearSearch,
        getFilteredRows,

        render,
        goToPage,
        previousPage,
        nextPage,

        exportExcel,
        printCollections
    });
})();