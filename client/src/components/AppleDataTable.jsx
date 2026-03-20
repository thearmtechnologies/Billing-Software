import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronUp, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './AppleDataTable.css';

// ── Constants ──
const PER_PAGE_OPTIONS = ['Auto', 10, 25, 50];
const HEADER_CHROME_HEIGHT = 200; // Approximate height consumed by page header + toolbar + pagination bar
const ROW_HEIGHT = 44;
const HEADER_ROW_HEIGHT = 40;

/**
 * Compute how many rows fit on screen in "Auto" mode.
 */
function computeAutoRows() {
  const available = window.innerHeight - HEADER_CHROME_HEIGHT - HEADER_ROW_HEIGHT;
  const rows = Math.floor(available / ROW_HEIGHT);
  return Math.max(3, Math.min(rows, 50));
}

/**
 * Generic comparator for sorting.
 */
function defaultCompare(a, b, key, dir) {
  let valA = a[key];
  let valB = b[key];

  // Handle nested keys like 'client.companyName'
  if (key.includes('.')) {
    const parts = key.split('.');
    valA = parts.reduce((obj, k) => obj?.[k], a);
    valB = parts.reduce((obj, k) => obj?.[k], b);
  }

  if (valA == null && valB == null) return 0;
  if (valA == null) return 1;
  if (valB == null) return -1;

  // Numeric
  if (typeof valA === 'number' && typeof valB === 'number') {
    return dir === 'asc' ? valA - valB : valB - valA;
  }

  // Date check
  const dateA = Date.parse(valA);
  const dateB = Date.parse(valB);
  if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && typeof valB === 'string') {
    return dir === 'asc' ? dateA - dateB : dateB - dateA;
  }

  // String
  const strA = String(valA);
  const strB = String(valB);
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'asc' ? collator.compare(strA, strB) : collator.compare(strB, strA);
}

/**
 * AppleDataTable — A reusable, Apple-inspired, paginated & sortable data table.
 *
 * @param {Object} props
 * @param {Array<{key: string, label: string, sortable?: boolean, render?: Function, width?: string, align?: string}>} props.columns
 * @param {Array} props.data - Full data array (already fetched)
 * @param {boolean} props.loading - Show skeleton rows
 * @param {string} [props.searchTerm] - External search filter (applied before paginating — filtering must be done by parent)
 * @param {ReactNode} [props.emptyIcon] - Icon for empty state
 * @param {string} [props.emptyTitle] - Empty state title
 * @param {string} [props.emptySubtitle] - Empty state description
 * @param {ReactNode} [props.emptyAction] - CTA in empty state
 * @param {string|Function} [props.rowKey='_id'] - Unique key accessor
 * @param {string} [props.defaultSortKey] - Initial sort column
 * @param {'asc'|'desc'} [props.defaultSortDir='asc'] - Initial sort direction
 * @param {Function} [props.sortComparator] - Custom sort comparator (a, b, key, dir)
 */
const AppleDataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyIcon,
  emptyTitle = 'No data found',
  emptySubtitle = 'There are no items to display.',
  emptyAction,
  rowKey = '_id',
  defaultSortKey,
  defaultSortDir = 'asc',
  sortComparator,
}) => {
  // ── State ──
  const [sortKey, setSortKey] = useState(defaultSortKey || null);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPageSetting, setPerPageSetting] = useState('Auto');
  const [autoRows, setAutoRows] = useState(computeAutoRows);
  const [pageInputValue, setPageInputValue] = useState('1');
  const tableRef = useRef(null);

  // ── Compute effective perPage ──
  const perPage = perPageSetting === 'Auto' ? autoRows : perPageSetting;

  // ── Recalculate auto rows on resize ──
  useEffect(() => {
    if (perPageSetting !== 'Auto') return;
    const handleResize = () => setAutoRows(computeAutoRows());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [perPageSetting]);

  // ── Sort data ──
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const compare = sortComparator || defaultCompare;
    return [...data].sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [data, sortKey, sortDir, sortComparator]);

  // ── Pagination math ──
  const totalCount = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  // Reset page when data or perPage changes
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, Math.ceil(sortedData.length / perPage))));
  }, [sortedData.length, perPage]);

  // Sync page input
  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  // ── Current page slice ──
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);
  const pageData = useMemo(
    () => sortedData.slice(startIndex, endIndex),
    [sortedData, startIndex, endIndex]
  );

  // ── Prefetch next page data into a ref (for instant future render) ──
  const nextPageDataRef = useRef([]);
  useEffect(() => {
    const nextStart = endIndex;
    const nextEnd = Math.min(nextStart + perPage, totalCount);
    nextPageDataRef.current = sortedData.slice(nextStart, nextEnd);
  }, [sortedData, endIndex, perPage, totalCount]);

  // ── Handlers ──
  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setCurrentPage(1);
    },
    [sortKey]
  );

  const goToPage = useCallback(
    (page) => {
      const p = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(p);
    },
    [totalPages]
  );

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(pageInputValue, 10);
      if (!isNaN(val)) goToPage(val);
    }
  };

  const handlePageInputBlur = () => {
    const val = parseInt(pageInputValue, 10);
    if (!isNaN(val)) goToPage(val);
    else setPageInputValue(String(currentPage));
  };

  const handlePerPageChange = (e) => {
    const val = e.target.value;
    setPerPageSetting(val === 'Auto' ? 'Auto' : parseInt(val, 10));
    setCurrentPage(1);
  };

  const getRowKey = useCallback(
    (row, index) => {
      if (typeof rowKey === 'function') return rowKey(row);
      return row[rowKey] || index;
    },
    [rowKey]
  );

  // ── Skeleton Rows ──
  const renderSkeleton = () => {
    const rows = [];
    const skeletonCount = perPage;
    for (let i = 0; i < skeletonCount; i++) {
      rows.push(
        <tr key={`skeleton-${i}`} className="adt-tr adt-skeleton-row">
          {columns.map((col) => (
            <td key={col.key} className="adt-td">
              <div
                className="adt-skeleton-bar"
                style={{ width: `${50 + Math.random() * 40}%`, animationDelay: `${i * 80}ms` }}
              />
            </td>
          ))}
        </tr>
      );
    }
    return rows;
  };

  // ── Empty State ──
  if (!loading && totalCount === 0) {
    return (
      <div className="adt-container">
        <div className="adt-empty" role="status" aria-live="polite">
          {emptyIcon && <div className="adt-empty-icon">{emptyIcon}</div>}
          <h3 className="adt-empty-title">{emptyTitle}</h3>
          <p className="adt-empty-subtitle">{emptySubtitle}</p>
          {emptyAction}
        </div>
      </div>
    );
  }

  return (
    <div className="adt-container" ref={tableRef}>
      {/* Screen reader summary */}
      <div className="adt-sr-only" role="status" aria-live="polite">
        {loading
          ? 'Loading data…'
          : `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} items. Page ${currentPage} of ${totalPages}.`}
      </div>

      {/* ── Table ── */}
      <div className="adt-table-wrap">
        <table className="adt-table" role="grid" aria-label="Data table">
          <thead className="adt-thead">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`adt-th ${col.sortable ? 'adt-th-sortable' : ''}`}
                  style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSort(col.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                  role="columnheader"
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : col.sortable
                      ? 'none'
                      : undefined
                  }
                  aria-label={
                    col.sortable
                      ? `${col.label}. Click to sort ${sortKey === col.key && sortDir === 'asc' ? 'descending' : 'ascending'}`
                      : col.label
                  }
                >
                  <span className="adt-th-content">
                    {col.label}
                    {col.sortable && (
                      <span
                        className={`adt-sort-icon ${sortKey === col.key ? 'adt-sort-icon--active' : ''} ${
                          sortKey === col.key && sortDir === 'desc' ? 'adt-sort-icon--desc' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronUp size={12} />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="adt-tbody">
            {loading
              ? renderSkeleton()
              : pageData.map((row, rowIndex) => (
                  <tr
                    key={getRowKey(row, startIndex + rowIndex)}
                    className="adt-tr adt-row-enter"
                    style={{ animationDelay: `${rowIndex * 20}ms` }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`adt-td ${col.align === 'right' ? 'adt-td--right' : ''} ${col.key === 'actions' ? 'adt-td--actions' : ''}`}
                        data-label={col.label || ''}
                        style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                      >
                        {col.render ? col.render(row, rowIndex) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalCount > 0 && (
        <div className="adt-pagination" role="navigation" aria-label="Table pagination">
          {/* Info */}
          <div className="adt-pagination-info" aria-live="polite">
            Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of{' '}
            <strong>{totalCount}</strong>
          </div>

          {/* Nav controls */}
          <div className="adt-pagination-controls">
            <button
              className="adt-page-btn"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
              title="First page"
            >
              <ChevronsLeft />
            </button>
            <button
              className="adt-page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft />
            </button>

            {/* Page input */}
            <div className="adt-page-input-wrap">
              <label htmlFor="adt-page-input" className="adt-sr-only">
                Page number
              </label>
              <input
                id="adt-page-input"
                className="adt-page-input"
                type="text"
                inputMode="numeric"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onKeyDown={handlePageInputKeyDown}
                onBlur={handlePageInputBlur}
                aria-label={`Page ${currentPage} of ${totalPages}`}
              />
              <span>of {totalPages}</span>
            </div>

            <button
              className="adt-page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight />
            </button>
            <button
              className="adt-page-btn"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
              title="Last page"
            >
              <ChevronsRight />
            </button>
          </div>

          {/* Per-page selector */}
          <div className="adt-perpage-wrap">
            <label htmlFor="adt-perpage" className="adt-sr-only">
              Rows per page
            </label>
            <span>Rows:</span>
            <select
              id="adt-perpage"
              className="adt-perpage-select"
              value={perPageSetting}
              onChange={handlePerPageChange}
              aria-label="Rows per page"
            >
              {PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Auto' ? `Auto (${autoRows})` : opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppleDataTable;
