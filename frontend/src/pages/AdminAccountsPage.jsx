import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { authFetch } from '../utils/apiClient.js';
import './AdminAccountsPage.css';

const initialFilters = { search: '', role: 'all', status: 'all', lockState: 'all' };

const formatDate = (value) => {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không xác định' : date.toLocaleString('vi-VN');
};

const formatCountdown = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
};

const auditActionLabel = (action) => {
  const labels = {
    ROLE_CHANGED: 'Thay đổi role',
    STATUS_CHANGED: 'Thay đổi trạng thái',
    LOGIN_LOCK_CLEARED: 'Gỡ khóa đăng nhập',
    RESOURCES_UPDATED: 'Cập nhật Gems/Stamina',
  };
  return labels[action] || action;
};

const AdminAccountsPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [filterDraft, setFilterDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [auditError, setAuditError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionUserId, setActionUserId] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [resourceDraft, setResourceDraft] = useState({ gems: '', stamina: '' });
  const [lockRefresh, setLockRefresh] = useState(0);
  const [detailsLockRemainingSeconds, setDetailsLockRemainingSeconds] = useState(0);
  const detailsDialogRef = useRef(null);
  const detailsTriggerRef = useRef(null);

  useEffect(() => {
    const nextExpiry = users.reduce((nearest, account) => {
      const expiry = account.lock_expires_at;
      return expiry && expiry > Date.now() ? Math.min(nearest, expiry) : nearest;
    }, Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nextExpiry)) return undefined;

    const timer = window.setTimeout(
      () => setLockRefresh((previous) => previous + 1),
      Math.max(0, nextExpiry - Date.now()) + 25
    );
    return () => window.clearTimeout(timer);
  }, [users, lockRefresh]);

  const isAccountLocked = (account) => (
    Boolean(account.lock_expires_at && account.lock_expires_at > Date.now())
  );

  const closeDetails = useCallback(() => {
    setExpandedUserId(null);
    setUserDetails(null);
    setDetailsError('');
    setDetailsLockRemainingSeconds(0);
    setResourceDraft({ gems: '', stamina: '' });
  }, []);

  useEffect(() => {
    if (expandedUserId === null) {
      detailsTriggerRef.current?.focus();
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    detailsDialogRef.current?.querySelector('button')?.focus();

    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDetails();
        return;
      }
      if (event.key !== 'Tab' || !detailsDialogRef.current) return;

      const focusableElements = detailsDialogRef.current.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [expandedUserId, closeDetails]);

  useEffect(() => {
    if (expandedUserId === null || detailsLockRemainingSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setDetailsLockRemainingSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expandedUserId, detailsLockRemainingSeconds > 0]);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setErrorMessage('');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...filters,
      });

      try {
        const data = await authFetch(`/admin/users?${params.toString()}`);
        if (!active) return;
        setUsers(data.users.map((account) => {
          const remaining = Number(account.lock_remaining_seconds);
          return {
            ...account,
            lock_expires_at: remaining > 0 ? Date.now() + remaining * 1000 : null,
          };
        }));
        setPagination(data.pagination);
        if (data.pagination.page !== page) setPage(data.pagination.page);
      } catch (error) {
        if (active) setErrorMessage(error.message || 'Không thể tải danh sách tài khoản.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadAuditLogs = async () => {
      setAuditLoading(true);
      setAuditError('');
      try {
        const data = await authFetch('/admin/audit-logs?limit=10');
        if (active) setAuditLogs(data.logs);
      } catch (error) {
        if (active) setAuditError(error.message || 'Không thể tải nhật ký quản trị.');
      } finally {
        if (active) setAuditLoading(false);
      }
    };

    loadUsers();
    loadAuditLogs();

    return () => {
      active = false;
    };
  }, [filters, page, pageSize, refreshKey]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...filterDraft });
    setNotice('');
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterDraft((previous) => ({ ...previous, [name]: value }));
  };

  const performAction = async (account, action, endpoint, body) => {
    if (!window.confirm(action.confirmation)) return;
    setActionUserId(account.id);
    setNotice('');
    setErrorMessage('');

    try {
      const data = await authFetch(endpoint, {
        method: action.method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setNotice(data.message);
      setExpandedUserId(null);
      setUserDetails(null);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(error.message || 'Không thể cập nhật tài khoản.');
    } finally {
      setActionUserId(null);
    }
  };

  const toggleDetails = async (account, event) => {
    if (expandedUserId === account.id) {
      closeDetails();
      return;
    }

    detailsTriggerRef.current = event.currentTarget;
    setExpandedUserId(account.id);
    setUserDetails(null);
    setDetailsError('');
    setDetailsLockRemainingSeconds(0);
    setDetailsLoading(true);
    try {
      const data = await authFetch(`/admin/users/${account.id}`);
      setUserDetails(data.user);
      const remaining = Number(data.user.lock_remaining_seconds);
      setDetailsLockRemainingSeconds(Number.isFinite(remaining) ? Math.max(0, remaining) : 0);
      setResourceDraft({
        gems: String(data.user.gems),
        stamina: String(data.user.stamina),
      });
    } catch (error) {
      setDetailsError(error.message || 'Không thể tải thông tin tài khoản.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveResources = (event, account) => {
    event.preventDefault();
    const gems = Number(resourceDraft.gems);
    const stamina = Number(resourceDraft.stamina);

    if (!Number.isSafeInteger(gems) || gems < 0 || gems > 2147483647) {
      setErrorMessage('Gems phải là số nguyên từ 0 đến 2.147.483.647.');
      return;
    }
    if (!Number.isInteger(stamina) || stamina < 0 || stamina > 100) {
      setErrorMessage('Stamina phải là số nguyên từ 0 đến 100.');
      return;
    }

    performAction(
      account,
      {
        method: 'PATCH',
        confirmation: `Đặt Gems thành ${gems.toLocaleString('vi-VN')} và Stamina thành ${stamina} cho @${account.username}?`,
      },
      `/admin/users/${account.id}/resources`,
      { gems, stamina }
    );
  };

  const changePageSize = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  return (
    <section className="admin-accounts">
      <header className="admin-accounts-header">
        <div>
          <p className="admin-accounts-eyebrow">ADMIN // USER DIRECTORY</p>
          <h1>QUẢN LÝ TÀI KHOẢN</h1>
          <p className="admin-accounts-description">
            Tra cứu, kiểm tra trạng thái và quản lý quyền truy cập của người chơi.
          </p>
        </div>
        <div className="admin-accounts-total" aria-live="polite">
          <span>TỔNG KẾT QUẢ</span>
          <strong>{loading ? '...' : pagination.total.toLocaleString('vi-VN')}</strong>
        </div>
      </header>

      {notice && <p className="admin-accounts-notice" role="status">{notice}</p>}
      {errorMessage && <p className="admin-accounts-error" role="alert">{errorMessage}</p>}

      <form className="admin-account-filters" onSubmit={handleFilterSubmit}>
        <label className="admin-account-search">
          <span>Tìm tài khoản</span>
          <input
            type="search"
            name="search"
            value={filterDraft.search}
            onChange={handleFilterChange}
            placeholder="Username hoặc email"
          />
        </label>

        <label>
          <span>Role</span>
          <select name="role" value={filterDraft.role} onChange={handleFilterChange}>
            <option value="all">Tất cả</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label>
          <span>Trạng thái</span>
          <select name="status" value={filterDraft.status} onChange={handleFilterChange}>
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="disabled">Vô hiệu hóa</option>
          </select>
        </label>

        <label>
          <span>Đăng nhập</span>
          <select name="lockState" value={filterDraft.lockState} onChange={handleFilterChange}>
            <option value="all">Tất cả</option>
            <option value="locked">Đang bị khóa</option>
            <option value="unlocked">Không bị khóa</option>
          </select>
        </label>

        <button type="submit" className="admin-account-primary-btn">LỌC TÀI KHOẢN</button>
      </form>

      <div className="admin-account-table-wrap">
        <table className="admin-account-table">
          <thead>
            <tr>
              <th>TÀI KHOẢN</th>
              <th>ROLE</th>
              <th>TRẠNG THÁI</th>
              <th>ĐĂNG NHẬP</th>
              <th>GEMS</th>
              <th>STAMINA</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="admin-account-empty">ĐANG TẢI TÀI KHOẢN...</td></tr>
            )}
            {!loading && !errorMessage && users.length === 0 && (
              <tr><td colSpan="7" className="admin-account-empty">KHÔNG TÌM THẤY TÀI KHOẢN PHÙ HỢP.</td></tr>
            )}
            {!loading && users.map((account) => {
              const isSelf = Number(account.id) === Number(currentUser?.id);
              const isBusy = actionUserId === account.id;
              return (
                <React.Fragment key={account.id}>
                  <tr>
                    <td>
                      <strong>@{account.username}</strong>
                      <span className="admin-account-email">{account.email || 'Chưa có email'}</span>
                      <span className="admin-account-id">ID #{account.id}</span>
                    </td>
                    <td>
                      <span className={`admin-account-badge role-${account.role}`}>
                        {account.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-account-badge status-${account.status}`}>
                        {account.status === 'active' ? 'HOẠT ĐỘNG' : 'ĐÃ VÔ HIỆU HÓA'}
                      </span>
                    </td>
                    <td>
                      {isAccountLocked(account)
                        ? <span className="admin-account-lock">ĐANG KHÓA</span>
                        : 'Bình thường'}
                      {Number(account.failed_login_attempts) > 0 && (
                        <span className="admin-account-email">
                          Sai {account.failed_login_attempts} lần
                        </span>
                      )}
                    </td>
                    <td>{Number(account.gems || 0).toLocaleString('vi-VN')}</td>
                    <td>{account.stamina}/100</td>
                    <td>
                      <div className="admin-account-actions">
                        <button
                          type="button"
                          className="admin-account-secondary-btn"
                          onClick={(event) => toggleDetails(account, event)}
                          aria-expanded={expandedUserId === account.id}
                          aria-controls={`account-details-dialog-${account.id}`}
                        >
                          CHI TIẾT
                        </button>
                        <button
                          type="button"
                          className="admin-account-secondary-btn"
                          disabled={isSelf || isBusy}
                          title={isSelf ? 'Không thể tự thay đổi role của mình' : undefined}
                          onClick={() => performAction(
                            account,
                            {
                              method: 'PATCH',
                              confirmation: account.role === 'admin'
                                ? `Hạ quyền @${account.username} xuống user?`
                                : `Cấp quyền admin cho @${account.username}?`,
                            },
                            `/admin/users/${account.id}/role`,
                            { role: account.role === 'admin' ? 'user' : 'admin' }
                          )}
                        >
                          {account.role === 'admin' ? 'HẠ ROLE' : 'CẤP ADMIN'}
                        </button>
                        <button
                          type="button"
                          className="admin-account-secondary-btn"
                          disabled={isSelf || isBusy}
                          title={isSelf ? 'Không thể tự vô hiệu hóa tài khoản' : undefined}
                          onClick={() => performAction(
                            account,
                            {
                              method: 'PATCH',
                              confirmation: account.status === 'active'
                                ? `Vô hiệu hóa @${account.username}? Tài khoản sẽ không thể đăng nhập.`
                                : `Kích hoạt lại @${account.username}?`,
                            },
                            `/admin/users/${account.id}/status`,
                            { status: account.status === 'active' ? 'disabled' : 'active' }
                          )}
                        >
                          {account.status === 'active' ? 'VÔ HIỆU HÓA' : 'KÍCH HOẠT'}
                        </button>
                        {isAccountLocked(account) && (
                          <button
                            type="button"
                            className="admin-account-warning-btn"
                            disabled={isBusy}
                            onClick={() => performAction(
                              account,
                              {
                                method: 'POST',
                                confirmation: `Gỡ khóa và xóa bộ đếm đăng nhập sai của @${account.username}?`,
                              },
                              `/admin/users/${account.id}/clear-login-lock`
                            )}
                          >
                            GỠ KHÓA
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {expandedUserId !== null && (
        <div
          className="admin-account-dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            ref={detailsDialogRef}
            id={`account-details-dialog-${expandedUserId}`}
            className="admin-account-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-account-dialog-title"
          >
            <header className="admin-account-dialog-header">
              <h2 id="admin-account-dialog-title">
                CHI TIẾT TÀI KHOẢN
                {userDetails?.id === expandedUserId ? ` // @${userDetails.username}` : ''}
              </h2>
              <button
                type="button"
                className="admin-account-warning-btn"
                onClick={closeDetails}
                aria-label="Đóng chi tiết tài khoản"
              >
                ĐÓNG
              </button>
            </header>

            {detailsLoading && <p>ĐANG TẢI CHI TIẾT...</p>}
            {detailsError && <p className="admin-accounts-error" role="alert">{detailsError}</p>}
            {userDetails && userDetails.id === expandedUserId && (
              <>
                <dl className="admin-account-details">
                  <div><dt>Email</dt><dd>{userDetails.email || 'Chưa có'}</dd></div>
                  <div><dt>Ngày tạo</dt><dd>{formatDate(userDetails.created_at)}</dd></div>
                  <div><dt>Đăng nhập gần nhất</dt><dd>{formatDate(userDetails.last_login_at)}</dd></div>
                  <div><dt>Gems</dt><dd>{Number(userDetails.gems || 0).toLocaleString('vi-VN')}</dd></div>
                  <div><dt>Stamina</dt><dd>{userDetails.stamina}/100</dd></div>
                  <div><dt>Pity</dt><dd>{userDetails.pity_count}/90</dd></div>
                  <div><dt>Tầng Boss cao nhất</dt><dd>{userDetails.highest_boss_floor}</dd></div>
                  <div><dt>Lần đăng nhập sai</dt><dd>{userDetails.failed_login_attempts}</dd></div>
                  <div><dt>Khóa đến</dt><dd>{formatDate(userDetails.locked_until)}</dd></div>
                  <div>
                    <dt>Thời gian khóa còn lại</dt>
                    <dd className={detailsLockRemainingSeconds > 0 ? 'admin-account-lock-countdown' : ''}>
                      {detailsLockRemainingSeconds > 0
                        ? formatCountdown(detailsLockRemainingSeconds)
                        : 'Không bị khóa'}
                    </dd>
                  </div>
                </dl>
                <form
                  className="admin-account-resource-form"
                  onSubmit={(event) => saveResources(event, users.find((account) => account.id === expandedUserId))}
                >
                  <label htmlFor={`account-gems-${expandedUserId}`}>
                    Gems
                    <input
                      id={`account-gems-${expandedUserId}`}
                      type="number"
                      min="0"
                      max="2147483647"
                      step="1"
                      required
                      value={resourceDraft.gems}
                      onChange={(event) => setResourceDraft((draft) => ({
                        ...draft,
                        gems: event.target.value,
                      }))}
                    />
                  </label>
                  <label htmlFor={`account-stamina-${expandedUserId}`}>
                    Stamina (0–100)
                    <input
                      id={`account-stamina-${expandedUserId}`}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      value={resourceDraft.stamina}
                      onChange={(event) => setResourceDraft((draft) => ({
                        ...draft,
                        stamina: event.target.value,
                      }))}
                    />
                  </label>
                  <button
                    type="submit"
                    className="admin-account-primary-btn"
                    disabled={actionUserId === expandedUserId}
                  >
                    {actionUserId === expandedUserId ? 'ĐANG LƯU...' : 'LƯU TÀI NGUYÊN'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      <footer className="admin-account-pagination">
        <label>
          <span>Số dòng</span>
          <select value={pageSize} onChange={changePageSize}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </label>
        <span>
          Trang {pagination.page} / {pagination.totalPages} · {pagination.total.toLocaleString('vi-VN')} tài khoản
        </span>
        <div>
          <button
            type="button"
            className="admin-account-secondary-btn"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            TRƯỚC
          </button>
          <button
            type="button"
            className="admin-account-secondary-btn"
            disabled={loading || page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            TIẾP
          </button>
        </div>
      </footer>

      <section className="admin-account-audit">
        <header>
          <div>
            <p className="admin-accounts-eyebrow">SECURITY // ACTIVITY</p>
            <h2>NHẬT KÝ QUẢN TRỊ</h2>
          </div>
          <span>10 thao tác gần nhất</span>
        </header>
        {auditError && <p className="admin-accounts-error" role="alert">{auditError}</p>}
        {auditLoading && <p className="admin-account-empty">ĐANG TẢI NHẬT KÝ...</p>}
        {!auditLoading && !auditError && auditLogs.length === 0 && (
          <p className="admin-account-empty">CHƯA CÓ THAO TÁC QUẢN TRỊ.</p>
        )}
        {!auditLoading && auditLogs.length > 0 && (
          <div className="admin-account-audit-list">
            {auditLogs.map((log) => (
              <article key={log.id} className="admin-account-audit-item">
                <div>
                  <strong>{auditActionLabel(log.action)}</strong>
                  <p>
                    @{log.actor_username || 'Tài khoản đã xóa'} đã thao tác với{' '}
                    @{log.target_username || `ID ${log.target_user_id ?? 'không xác định'}`}
                  </p>
                  {log.details && (
                    <small>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </small>
                  )}
                </div>
                <time dateTime={log.created_at}>{formatDate(log.created_at)}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

export default AdminAccountsPage;
