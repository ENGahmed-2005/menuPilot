import { useMemo, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { useToast } from "../../context/contexts";
import { useAsync } from "../../hooks/useAsync";
import { useForm } from "../../hooks/useForm";
import { menuApi } from "../../api/services";
import { rules } from "../../utils/validation";
import { formatMoney, localized } from "../../utils/format";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { EmptyState, ErrorState, Loading } from "../../components/ui/States";
import {
  IconEdit,
  IconMenuBook,
  IconPlus,
  IconSearch,
  IconTrash,
} from "../../components/ui/Icons";
import "./Admin.css";

const emptyItem = {
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  price: "",
  categoryId: "",
  imageUrl: "",
  prepTime: 10,
  isAvailable: true,
};

/** FR-08, FR-09, FR-10 — menu category and item management. */
export default function MenuPage() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const categoriesReq = useAsync(() => menuApi.categories(), []);
  const itemsReq = useAsync(() => menuApi.items(), []);

  const categories = useMemo(() => categoriesReq.data || [], [categoriesReq.data]);
  const items = useMemo(() => itemsReq.data || [], [itemsReq.data]);

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const itemForm = useForm({
    initialValues: emptyItem,
    schema: {
      name: [rules.required(), rules.maxLength(80)],
      price: [rules.required(), rules.positiveNumber()],
      prepTime: [rules.number(), rules.min(1), rules.max(240)],
    },
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        nameEn: values.nameEn?.trim() || "",
        description: values.description?.trim() || "",
        descriptionEn: values.descriptionEn?.trim() || "",
        price: Number(values.price),
        categoryId: values.categoryId || null,
        imageUrl: values.imageUrl?.trim() || "",
        prepTime: Number(values.prepTime) || 10,
        isAvailable: Boolean(values.isAvailable),
      };
      if (editingItem) {
        await menuApi.updateItem(editingItem.id, payload);
        toast.success(t("menu.itemUpdated"));
      } else {
        await menuApi.createItem(payload);
        toast.success(t("menu.itemCreated"));
      }
      setItemModal(false);
      setEditingItem(null);
      itemsReq.reload({ silent: true });
    },
  });

  const categoryForm = useForm({
    initialValues: { name: "", nameEn: "" },
    schema: { name: [rules.required(), rules.maxLength(50)] },
    onSubmit: async (values) => {
      const payload = { name: values.name.trim(), nameEn: values.nameEn?.trim() || "" };
      if (editingCategory) {
        await menuApi.updateCategory(editingCategory.id, payload);
        toast.success(t("menu.categoryUpdated"));
      } else {
        await menuApi.createCategory(payload);
        toast.success(t("menu.categoryCreated"));
      }
      setCategoryModal(false);
      setEditingCategory(null);
      categoriesReq.reload({ silent: true });
    },
  });

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory === "all") {
        /* keep */
      } else if (activeCategory === "none") {
        if (item.categoryId) return false;
      } else if (item.categoryId !== Number(activeCategory)) {
        return false;
      }
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        (item.nameEn || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term)
      );
    });
  }, [items, activeCategory, search]);

  const countFor = (categoryId) =>
    categoryId === "all"
      ? items.length
      : categoryId === "none"
        ? items.filter((i) => !i.categoryId).length
        : items.filter((i) => i.categoryId === categoryId).length;

  const openCreateItem = () => {
    setEditingItem(null);
    itemForm.reset({
      ...emptyItem,
      categoryId: activeCategory !== "all" && activeCategory !== "none" ? activeCategory : "",
    });
    setItemModal(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    itemForm.reset({
      name: item.name,
      nameEn: item.nameEn || "",
      description: item.description || "",
      descriptionEn: item.descriptionEn || "",
      price: item.price,
      categoryId: item.categoryId ?? "",
      imageUrl: item.imageUrl || "",
      prepTime: item.prepTime ?? 10,
      isAvailable: item.isAvailable,
    });
    setItemModal(true);
  };

  const toggleAvailability = async (item) => {
    try {
      await menuApi.updateItem(item.id, { isAvailable: !item.isAvailable });
      itemsReq.reload({ silent: true });
    } catch (err) {
      toast.error(err?.message || t("common.unknownError"));
    }
  };

  const loading = (categoriesReq.loading && !categoriesReq.data) || (itemsReq.loading && !itemsReq.data);
  const error = categoriesReq.error || itemsReq.error;

  if (loading) return <Loading />;
  if (error && !items.length)
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          categoriesReq.reload();
          itemsReq.reload();
        }}
      />
    );

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("menu.title")}</h1>
          <p className="page-subtitle">{t("menu.subtitle")}</p>
        </div>
        <div className="row gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setEditingCategory(null);
              categoryForm.reset({ name: "", nameEn: "" });
              setCategoryModal(true);
            }}
          >
            <IconPlus size={17} />
            {t("menu.addCategory")}
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateItem}>
            <IconPlus size={17} />
            {t("menu.addItem")}
          </button>
        </div>
      </div>

      <div className="menu-layout">
        <aside className="card">
          <div className="card-header">
            <h2 className="card-title">{t("menu.categories")}</h2>
          </div>
          <div className="category-list">
            <button
              type="button"
              className={`category-item ${activeCategory === "all" ? "active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              <span>{t("common.all")}</span>
              <span className="c-count num">{countFor("all")}</span>
            </button>

            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-item ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveCategory(cat.id);
                  }
                }}
              >
                <span className="truncate">{localized(cat, "name", lang)}</span>
                <span className="c-tools">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                      categoryForm.reset({ name: cat.name, nameEn: cat.nameEn || "" });
                      setCategoryModal(true);
                    }}
                    aria-label={t("common.edit")}
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCategory(cat);
                    }}
                    aria-label={t("common.delete")}
                  >
                    <IconTrash size={14} />
                  </button>
                </span>
              </div>
            ))}

            {countFor("none") > 0 && (
              <button
                type="button"
                className={`category-item ${activeCategory === "none" ? "active" : ""}`}
                onClick={() => setActiveCategory("none")}
              >
                <span>{t("menu.uncategorized")}</span>
                <span className="c-count num">{countFor("none")}</span>
              </button>
            )}

            {categories.length === 0 && (
              <p className="text-sm text-muted" style={{ padding: "14px 12px" }}>
                {t("menu.noCategories")}
              </p>
            )}
          </div>
        </aside>

        <section>
          <div className="toolbar">
            <div className="search-box">
              <span className="s-icon">
                <IconSearch size={17} />
              </span>
              <input
                className="input"
                placeholder={t("common.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("common.search")}
              />
            </div>
            <span className="text-sm text-muted">
              {t("menu.itemsCount", { count: visibleItems.length })}
            </span>
          </div>

          {visibleItems.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={IconMenuBook}
                title={t("menu.noItems")}
                text={t("menu.noItemsHint")}
                action={
                  <button type="button" className="btn btn-primary" onClick={openCreateItem}>
                    <IconPlus size={17} />
                    {t("menu.addItem")}
                  </button>
                }
              />
            </div>
          ) : (
            <div className="menu-items-grid">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className={`menu-item-card ${item.isAvailable ? "" : "is-unavailable"}`}
                >
                  {item.imageUrl ? (
                    <img className="item-thumb" src={item.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="item-thumb">
                      <IconMenuBook size={22} />
                    </div>
                  )}

                  <div className="i-body">
                    <span className="i-name truncate">{localized(item, "name", lang)}</span>
                    {localized(item, "description", lang) && (
                      <span className="i-desc">{localized(item, "description", lang)}</span>
                    )}

                    <div className="i-foot">
                      <span className="i-price num">{formatMoney(item.price, lang)}</span>
                      {!item.isAvailable && (
                        <span className="badge badge-gray">{t("menu.unavailable")}</span>
                      )}
                      <span className="i-tools">
                        <label className="switch" title={t("menu.available")}>
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={() => toggleAvailability(item)}
                            aria-label={t("menu.available")}
                          />
                          <span className="track" />
                        </label>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => openEditItem(item)}
                          aria-label={t("common.edit")}
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon text-danger"
                          onClick={() => setDeletingItem(item)}
                          aria-label={t("common.delete")}
                        >
                          <IconTrash size={15} />
                        </button>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------ Item form ------------------------------ */}
      <Modal
        open={itemModal}
        onClose={() => setItemModal(false)}
        title={editingItem ? t("menu.editItem") : t("menu.addItem")}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setItemModal(false)}>
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              form="item-form"
              className="btn btn-primary"
              disabled={itemForm.submitting}
            >
              {itemForm.submitting && <span className="spinner" />}
              {editingItem ? t("common.save") : t("common.add")}
            </button>
          </>
        }
      >
        <form id="item-form" className="stack gap-4" onSubmit={itemForm.handleSubmit} noValidate>
          {itemForm.formError && (
            <div className="alert alert-error">
              {itemForm.formError.message || t("common.unknownError")}
            </div>
          )}

          <div className="form-row">
            <div className={`field ${itemForm.errorText("name") ? "has-error" : ""}`}>
              <label className="label" htmlFor="iname">
                {t("menu.itemName")}
                <span className="req">*</span>
              </label>
              <input
                id="iname"
                name="name"
                className="input"
                value={itemForm.values.name}
                onChange={itemForm.handleChange}
                onBlur={itemForm.handleBlur}
              />
              {itemForm.errorText("name") && (
                <span className="field-error">{itemForm.errorText("name")}</span>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="inameEn">
                {t("menu.itemNameEn")}
              </label>
              <input
                id="inameEn"
                name="nameEn"
                className="input"
                dir="ltr"
                value={itemForm.values.nameEn}
                onChange={itemForm.handleChange}
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="idesc">
              {t("menu.description")}
            </label>
            <textarea
              id="idesc"
              name="description"
              className="textarea"
              rows={2}
              value={itemForm.values.description}
              onChange={itemForm.handleChange}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="idescEn">
              {t("menu.descriptionEn")}
            </label>
            <textarea
              id="idescEn"
              name="descriptionEn"
              className="textarea"
              rows={2}
              dir="ltr"
              value={itemForm.values.descriptionEn}
              onChange={itemForm.handleChange}
            />
          </div>

          <div className="form-row">
            <div className={`field ${itemForm.errorText("price") ? "has-error" : ""}`}>
              <label className="label" htmlFor="iprice">
                {t("menu.price")}
                <span className="req">*</span>
              </label>
              <input
                id="iprice"
                name="price"
                type="number"
                step="0.5"
                min="0"
                className="input"
                value={itemForm.values.price}
                onChange={itemForm.handleChange}
                onBlur={itemForm.handleBlur}
              />
              {itemForm.errorText("price") && (
                <span className="field-error">{itemForm.errorText("price")}</span>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="icategory">
                {t("menu.category")}
              </label>
              <select
                id="icategory"
                name="categoryId"
                className="select"
                value={itemForm.values.categoryId}
                onChange={itemForm.handleChange}
              >
                <option value="">{t("menu.uncategorized")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {localized(cat, "name", lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className={`field ${itemForm.errorText("prepTime") ? "has-error" : ""}`}>
              <label className="label" htmlFor="iprep">
                {t("menu.prepTime")}
              </label>
              <input
                id="iprep"
                name="prepTime"
                type="number"
                min="1"
                max="240"
                className="input"
                value={itemForm.values.prepTime}
                onChange={itemForm.handleChange}
                onBlur={itemForm.handleBlur}
              />
              {itemForm.errorText("prepTime") && (
                <span className="field-error">{itemForm.errorText("prepTime")}</span>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="iimage">
                {t("menu.imageUrl")}
              </label>
              <input
                id="iimage"
                name="imageUrl"
                className="input"
                dir="ltr"
                placeholder="https://..."
                value={itemForm.values.imageUrl}
                onChange={itemForm.handleChange}
              />
              <span className="field-hint">{t("menu.imageUrlHint")}</span>
            </div>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              name="isAvailable"
              checked={itemForm.values.isAvailable}
              onChange={itemForm.handleChange}
            />
            <span className="track" />
            <span className="fw-600 text-sm">{t("menu.available")}</span>
          </label>
        </form>
      </Modal>

      {/* ---------------------------- Category form ---------------------------- */}
      <Modal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        title={editingCategory ? t("menu.editCategory") : t("menu.addCategory")}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCategoryModal(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              form="category-form"
              className="btn btn-primary"
              disabled={categoryForm.submitting}
            >
              {categoryForm.submitting && <span className="spinner" />}
              {editingCategory ? t("common.save") : t("common.add")}
            </button>
          </>
        }
      >
        <form
          id="category-form"
          className="stack gap-4"
          onSubmit={categoryForm.handleSubmit}
          noValidate
        >
          <div className={`field ${categoryForm.errorText("name") ? "has-error" : ""}`}>
            <label className="label" htmlFor="cname">
              {t("menu.categoryName")}
              <span className="req">*</span>
            </label>
            <input
              id="cname"
              name="name"
              className="input"
              value={categoryForm.values.name}
              onChange={categoryForm.handleChange}
              onBlur={categoryForm.handleBlur}
            />
            {categoryForm.errorText("name") && (
              <span className="field-error">{categoryForm.errorText("name")}</span>
            )}
          </div>

          <div className="field">
            <label className="label" htmlFor="cnameEn">
              {t("menu.categoryNameEn")}
            </label>
            <input
              id="cnameEn"
              name="nameEn"
              className="input"
              dir="ltr"
              value={categoryForm.values.nameEn}
              onChange={categoryForm.handleChange}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={async () => {
          await menuApi.removeItem(deletingItem.id);
          toast.success(t("menu.itemDeleted"));
          itemsReq.reload({ silent: true });
        }}
        title={t("common.delete")}
        message={t("menu.deleteItemConfirm", {
          name: localized(deletingItem, "name", lang),
        })}
        confirmLabel={t("common.delete")}
        danger
      />

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={async () => {
          await menuApi.removeCategory(deletingCategory.id);
          toast.success(t("menu.categoryDeleted"));
          if (activeCategory === deletingCategory.id) setActiveCategory("all");
          categoriesReq.reload({ silent: true });
          itemsReq.reload({ silent: true });
        }}
        title={t("common.delete")}
        message={t("menu.deleteCategoryConfirm", {
          name: localized(deletingCategory, "name", lang),
        })}
        confirmLabel={t("common.delete")}
        danger
      />
    </div>
  );
}
