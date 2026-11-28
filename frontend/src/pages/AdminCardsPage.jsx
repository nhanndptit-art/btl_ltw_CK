import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '../utils/apiClient.js';
import { getCardImageUrl } from '../utils/cardImage.js';
import './AdminCardsPage.css';

const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'];
const ELEMENTS = ['PLASMA', 'AETHER', 'VOLT', 'CYBER', 'THERMAL', 'SONIC', 'KINETIC'];
const RARITY_RATES = { Legendary: 1.5, Epic: 8.5, Rare: 30, Common: 60 };
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const INITIAL_DRAFT = {
  name: '',
  title: '',
  rarity: 'Common',
  element: '',
  weight: '100',
  base_atk: '100',
  base_def: '100',
};

const CardFormField = ({ id, label, wide = false, children }) => (
  <div className={`admin-card-form-field${wide ? ' admin-card-form-wide' : ''}`}>
    <label htmlFor={id}>{label}</label>
    {children}
  </div>
);

const AdminCardsPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [imageFile, setImageFile] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionCardId, setActionCardId] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const dialogRef = useRef(null);
  const dialogTriggerRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadCards = async () => {
      setLoading(true);
      setPageError('');
      try {
        const data = await authFetch('/admin/cards');
        if (active) setCards(data.cards);
      } catch (error) {
        if (active) setPageError(error.message || 'Không thể tải danh sách thẻ bài.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCards();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setImagePreview(editingCard ? getCardImageUrl(editingCard.image_url) : '');
    return undefined;
  }, [editingCard, imageFile]);

  const closeDialog = useCallback(() => {
    if (saving) return;
    setIsDialogOpen(false);
    setEditingCard(null);
    setDraft(INITIAL_DRAFT);
    setImageFile(null);
    setDialogError('');
  }, [saving]);

  useEffect(() => {
    if (!isDialogOpen) {
      dialogTriggerRef.current?.focus();
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('input')?.focus();

    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDialog();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
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
  }, [isDialogOpen, closeDialog]);

  const activeCount = cards.filter((card) => Number(card.is_active) === 1).length;
  const inactiveCount = cards.length - activeCount;
  const draftWeight = Number(draft.weight);
  const hasValidDraftWeight = Number.isSafeInteger(draftWeight) && draftWeight >= 1;
  const activePeerWeight = cards.reduce((total, card) => {
    const isActivePeer = Number(card.is_active) === 1
      && card.rarity === draft.rarity
      && Number(card.id) !== Number(editingCard?.id);
    return isActivePeer ? total + Number(card.weight) : total;
  }, 0);
  const projectedPoolWeight = activePeerWeight + (hasValidDraftWeight ? draftWeight : 0);
  const projectedWeightShare = hasValidDraftWeight && projectedPoolWeight > 0
    ? (draftWeight / projectedPoolWeight) * 100
    : null;
  const projectedPullChance = projectedWeightShare === null
    ? null
    : (RARITY_RATES[draft.rarity] * projectedWeightShare) / 100;
  const weightProjectionContext = editingCard && Number(editingCard.is_active) !== 1
    ? 'nếu phát hành lại thẻ này'
    : 'nếu lưu trọng số này';

  const filteredCards = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return cards.filter((card) => {
      const matchesSearch = !normalizedSearch
        || [card.name, card.title, card.element]
          .some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
      const matchesRarity = rarityFilter === 'all' || card.rarity === rarityFilter;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' ? Number(card.is_active) === 1 : Number(card.is_active) === 0);
      return matchesSearch && matchesRarity && matchesStatus;
    });
  }, [cards, search, rarityFilter, statusFilter]);

  const openDialog = (card, event) => {
    dialogTriggerRef.current = event.currentTarget;
    setEditingCard(card);
    setDraft(card ? {
      name: card.name,
      title: card.title,
      rarity: card.rarity,
      element: card.element,
      weight: String(card.weight),
      base_atk: String(card.base_atk),
      base_def: String(card.base_def),
    } : INITIAL_DRAFT);
    setImageFile(null);
    setDialogError('');
    setPageError('');
    setNotice('');
    setIsDialogOpen(true);
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setDialogError('');
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      setDialogError('Ảnh phải có định dạng JPEG, PNG hoặc WebP.');
      event.target.value = '';
      setImageFile(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setDialogError('Ảnh tải lên không được vượt quá 5 MB.');
      event.target.value = '';
      setImageFile(null);
      return;
    }
    setDialogError('');
    setImageFile(file);
  };

  const saveCard = async (event) => {
    event.preventDefault();
    if (!editingCard && !imageFile) {
      setDialogError('Vui lòng chọn ảnh cho thẻ bài.');
      return;
    }

    setSaving(true);
    setDialogError('');
    const formData = new FormData();
    Object.entries(draft).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append('image', imageFile);

    try {
      const endpoint = editingCard
        ? `/admin/cards/${editingCard.id}`
        : '/admin/cards';
      const data = await authFetch(endpoint, {
        method: editingCard ? 'PATCH' : 'POST',
        body: formData,
      });
      setNotice(data.message);
      setIsDialogOpen(false);
      setEditingCard(null);
      setDraft(INITIAL_DRAFT);
      setImageFile(null);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setDialogError(error.message || 'Không thể lưu thẻ bài.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCardStatus = async (card) => {
    const isActive = Number(card.is_active) === 1;
    if (
      isActive
      && !window.confirm(
        `Ngừng phát hành "${card.name}"? Thẻ đã có trong kho người chơi và lịch sử quay vẫn được giữ nguyên.`
      )
    ) {
      return;
    }

    setActionCardId(card.id);
    setPageError('');
    setNotice('');
    try {
      const data = await authFetch(`/admin/cards/${card.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !isActive }),
      });
      setNotice(data.message);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setPageError(error.message || 'Không thể cập nhật trạng thái phát hành.');
    } finally {
      setActionCardId(null);
    }
  };

  return (
    <section className="admin-cards">
      <header className="admin-cards-header">
        <div>
          <p className="admin-cards-eyebrow">ADMIN // CARD CATALOG</p>
          <h1>QUẢN LÝ THẺ BÀI</h1>
          <p className="admin-cards-description">
            Quản lý dữ liệu thẻ, ảnh và trạng thái phát hành trong pool triệu hồi.
          </p>
        </div>
        <button
          type="button"
          className="admin-card-primary-btn"
          onClick={(event) => openDialog(null, event)}
        >
          + THÊM THẺ BÀI
        </button>
      </header>

      <div className="admin-cards-summary" aria-live="polite">
        <div><span>TỔNG SỐ THẺ</span><strong>{loading ? '...' : cards.length}</strong></div>
        <div><span>ĐANG PHÁT HÀNH</span><strong>{loading ? '...' : activeCount}</strong></div>
        <div><span>NGỪNG PHÁT HÀNH</span><strong>{loading ? '...' : inactiveCount}</strong></div>
      </div>

      {notice && <p className="admin-cards-notice" role="status">{notice}</p>}
      {pageError && <p className="admin-cards-error" role="alert">{pageError}</p>}

      <form className="admin-card-filters" onSubmit={(event) => event.preventDefault()}>
        <label className="admin-card-search">
          <span>Tìm thẻ</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tên, tiêu đề hoặc hệ"
          />
        </label>
        <label>
          <span>Độ hiếm</span>
          <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            {RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
          </select>
        </label>
        <label>
          <span>Phát hành</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="active">Đang phát hành</option>
            <option value="inactive">Ngừng phát hành</option>
          </select>
        </label>
      </form>

      <div className="admin-card-table-wrap">
        <table className="admin-card-table">
          <thead>
            <tr>
              <th>THẺ BÀI</th>
              <th>ĐỘ HIẾM / HỆ</th>
              <th>CHỈ SỐ</th>
              <th>TRỌNG SỐ</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="admin-card-empty">ĐANG TẢI DANH SÁCH THẺ...</td></tr>
            )}
            {!loading && !pageError && filteredCards.length === 0 && (
              <tr><td colSpan="6" className="admin-card-empty">KHÔNG TÌM THẤY THẺ BÀI PHÙ HỢP.</td></tr>
            )}
            {!loading && filteredCards.map((card) => {
              const isActive = Number(card.is_active) === 1;
              const isLastActiveOfRarity = isActive && cards.filter(
                (item) => item.rarity === card.rarity && Number(item.is_active) === 1
              ).length <= 1;
              const isBusy = actionCardId === card.id;

              return (
                <tr key={card.id} className={!isActive ? 'is-retired' : ''}>
                  <td data-label="THẺ BÀI">
                    <div className="admin-card-identity">
                      <img src={getCardImageUrl(card.image_url)} alt="" loading="lazy" />
                      <div>
                        <strong>{card.name}</strong>
                        <span>{card.title}</span>
                        <small>ID #{card.id}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label="ĐỘ HIẾM / HỆ">
                    <span className={`admin-card-rarity rarity-${card.rarity.toLowerCase()}`}>
                      {card.rarity}
                    </span>
                    <span className="admin-card-element">{card.element}</span>
                  </td>
                  <td className="admin-card-stats" data-label="CHỈ SỐ">
                    ATK {card.base_atk} / DEF {card.base_def}
                  </td>
                  <td data-label="TRỌNG SỐ">{card.weight}</td>
                  <td data-label="TRẠNG THÁI">
                    <span className={`admin-card-status ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? 'ĐANG PHÁT HÀNH' : 'ĐÃ NGỪNG'}
                    </span>
                    {isLastActiveOfRarity && (
                      <small className="admin-card-status-hint">
                        Thẻ phát hành cuối của độ hiếm
                      </small>
                    )}
                  </td>
                  <td data-label="THAO TÁC">
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="admin-card-secondary-btn"
                        onClick={(event) => openDialog(card, event)}
                      >
                        CHỈNH SỬA
                      </button>
                      <button
                        type="button"
                        className={isActive ? 'admin-card-warning-btn' : 'admin-card-secondary-btn'}
                        disabled={isBusy || (isActive && isLastActiveOfRarity)}
                        title={isLastActiveOfRarity ? 'Cần giữ lại ít nhất một thẻ đang phát hành ở mỗi độ hiếm.' : undefined}
                        onClick={() => toggleCardStatus(card)}
                      >
                        {isBusy ? 'ĐANG LƯU...' : isActive ? 'NGỪNG PHÁT HÀNH' : 'PHÁT HÀNH LẠI'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isDialogOpen && (
        <div
          className="admin-card-dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            ref={dialogRef}
            className="admin-card-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-card-dialog-title"
          >
            <header className="admin-card-dialog-header">
              <div>
                <p className="admin-cards-eyebrow">CARD CATALOG // EDITOR</p>
                <h2 id="admin-card-dialog-title">
                  {editingCard ? 'CHỈNH SỬA THẺ BÀI' : 'THÊM THẺ BÀI'}
                </h2>
              </div>
              <button
                type="button"
                className="admin-card-secondary-btn"
                onClick={closeDialog}
                disabled={saving}
                aria-label="Đóng cửa sổ thẻ bài"
              >
                ĐÓNG
              </button>
            </header>

            {dialogError && <p className="admin-cards-error" role="alert">{dialogError}</p>}

            <form className="admin-card-form" onSubmit={saveCard}>
              <div className="admin-card-form-fields">
                <CardFormField
                  id="admin-card-name"
                  label="Tên thẻ"
                  wide
                >
                  <input
                    id="admin-card-name"
                    name="name"
                    value={draft.name}
                    onChange={handleDraftChange}
                    maxLength="100"
                    required
                  />
                </CardFormField>
                <CardFormField
                  id="admin-card-title"
                  label="Tiêu đề"
                  wide
                >
                  <input
                    id="admin-card-title"
                    name="title"
                    value={draft.title}
                    onChange={handleDraftChange}
                    maxLength="120"
                    required
                  />
                </CardFormField>
                <CardFormField
                  id="admin-card-rarity"
                  label="Độ hiếm"
                >
                  <select
                    id="admin-card-rarity"
                    name="rarity"
                    value={draft.rarity}
                    onChange={handleDraftChange}
                  >
                    {RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
                  </select>
                </CardFormField>
                <CardFormField
                  id="admin-card-element"
                  label="Hệ"
                >
                  <select
                    id="admin-card-element"
                    name="element"
                    value={draft.element}
                    onChange={handleDraftChange}
                    required
                  >
                    <option value="" disabled>CHỌN HỆ</option>
                    {draft.element && !ELEMENTS.includes(draft.element) && (
                      <option value={draft.element}>{draft.element} (hiện tại)</option>
                    )}
                    {ELEMENTS.map((element) => <option key={element} value={element}>{element}</option>)}
                  </select>
                </CardFormField>
                <CardFormField
                  id="admin-card-weight"
                  label="Trọng số trong độ hiếm"
                >
                  <input
                    id="admin-card-weight"
                    name="weight"
                    type="number"
                    min="1"
                    max="2147483647"
                    step="1"
                    value={draft.weight}
                    onChange={handleDraftChange}
                    aria-describedby="admin-card-weight-guidance admin-card-weight-hint"
                    required
                  />
                  <small id="admin-card-weight-guidance" className="admin-card-field-hint">
                    Mốc tham khảo theo dữ liệu mẫu: Legendary = 50; Epic, Rare, Common = 100. Các trọng số chỉ so sánh
                    trong cùng độ hiếm: cùng trọng số thì cơ hội bằng nhau, gấp đôi trọng số thì gấp đôi cơ hội trong nhóm.
                    Ví dụ pool mẫu: Legendary 50/100 = 50% nhóm, tức 0,75% mỗi lượt; Epic 100/300 = 33,33%, tức 2,83%;
                    Rare 100/400 = 25%, tức 7,5%; Common 100/500 = 20%, tức 12%. Tỉ lệ độ hiếm gốc lần lượt là
                    Legendary 1,5%, Epic 8,5%, Rare 30%, Common 60%. Đây là tỉ lệ trước pity.
                  </small>
                  <small id="admin-card-weight-hint" className="admin-card-field-hint">
                    {loading
                      ? 'Đang tải pool để tính tỉ trọng...'
                      : pageError
                        ? 'Không thể tính tỉ trọng khi chưa tải được danh mục thẻ.'
                        : projectedWeightShare === null
                          ? 'Nhập trọng số nguyên từ 1 trở lên để xem tỉ trọng dự kiến.'
                          : `${weightProjectionContext}: trong nhóm ${draft.rarity}, ${draftWeight} / ${projectedPoolWeight} = ${projectedWeightShare.toFixed(2)}%; xác suất cơ bản khoảng ${projectedPullChance.toFixed(3)}% mỗi lượt, chưa tính pity.`}
                  </small>
                </CardFormField>
                <CardFormField
                  id="admin-card-atk"
                  label="ATK cơ bản"
                >
                  <input
                    id="admin-card-atk"
                    name="base_atk"
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    value={draft.base_atk}
                    onChange={handleDraftChange}
                    required
                  />
                </CardFormField>
                <CardFormField
                  id="admin-card-def"
                  label="DEF cơ bản"
                >
                  <input
                    id="admin-card-def"
                    name="base_def"
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    value={draft.base_def}
                    onChange={handleDraftChange}
                    required
                  />
                </CardFormField>
                <CardFormField
                  id="admin-card-image"
                  label={`Ảnh thẻ ${editingCard ? '(để trống nếu giữ ảnh hiện tại)' : ''}`}
                  wide
                >
                  <input
                    id="admin-card-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    aria-describedby="admin-card-image-hint"
                    required={!editingCard}
                  />
                  <small id="admin-card-image-hint" className="admin-card-field-hint">
                    JPEG, PNG hoặc WebP · tối đa 5 MB
                  </small>
                </CardFormField>
              </div>

              {imagePreview && (
                <div className="admin-card-image-preview">
                  <img src={imagePreview} alt={`Xem trước ảnh ${draft.name || 'thẻ bài'}`} />
                  <span>XEM TRƯỚC ẢNH</span>
                </div>
              )}

              <footer className="admin-card-form-actions">
                <button
                  type="button"
                  className="admin-card-secondary-btn"
                  onClick={closeDialog}
                  disabled={saving}
                >
                  HỦY
                </button>
                <button type="submit" className="admin-card-primary-btn" disabled={saving}>
                  {saving ? 'ĐANG LƯU...' : editingCard ? 'LƯU THAY ĐỔI' : 'TẠO THẺ BÀI'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default AdminCardsPage;
