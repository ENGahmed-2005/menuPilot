import { useMemo, useState } from "react";
import { useI18n } from "../../../i18n/I18nContext";
import { useAsync } from "../../../hooks/useAsync";
import { useCart } from "../../../context/contexts";
import { publicApi } from "../../../api/services";
import { formatMoney, localized } from "../../../utils/format";
import { EmptyState, ErrorState, Loading } from "../../../components/ui/States";
import ItemSheet from "../ItemSheet";
import { IconMenuBook, IconPlus, IconSearch } from "../../../components/ui/Icons";

/**
 * FR-11 / FR-12 — the table-specific menu with search, categories,
 * and an item sheet for quantity + note before adding to the cart.
 */
export default function MenuTab({ session, disabled, onGoToCart }) {
  const { t, lang } = useI18n();
  const cart = useCart();

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sheetItem, setSheetItem] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => publicApi.menu(session.qrToken),
    [session.qrToken]
  );

  const categories = useMemo(() => data?.categories || [], [data]);
  const items = useMemo(() => data?.items || [], [data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      if (!term) return true;
      return (
        (item.name || "").toLowerCase().includes(term) ||
        (item.nameEn || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term)
      );
    });
  }, [items, category, search]);

  /** Groups the filtered items under their category headings. */
  const groups = useMemo(() => {
    if (category !== "all") {
      const cat = categories.find((c) => c.id === category);
      return [{ id: category, name: cat ? localized(cat, "name", lang) : "", items: filtered }];
    }
    const result = categories
      .map((cat) => ({
        id: cat.id,
        name: localized(cat, "name", lang),
        items: filtered.filter((i) => i.categoryId === cat.id),
      }))
      .filter((g) => g.items.length > 0);

    const orphans = filtered.filter((i) => !categories.some((c) => c.id === i.categoryId));
    if (orphans.length) result.push({ id: "none", name: t("menu.uncategorized"), items: orphans });
    return result;
  }, [categories, filtered, category, lang, t]);

  const inCartCount = (itemId) =>
    cart.lines.filter((l) => l.itemId === itemId).reduce((sum, l) => sum + l.quantity, 0);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div>
      <div className="input-group mb-4">
        <span className="input-icon">
          <IconSearch size={18} />
        </span>
        <input
          className="input"
          placeholder={t("customer.menu.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("common.search")}
        />
      </div>

      <div className="cat-scroller" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          className={`cat-chip ${category === "all" ? "active" : ""}`}
          onClick={() => setCategory("all")}
        >
          {t("customer.menu.allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={`cat-chip ${category === cat.id ? "active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {localized(cat, "name", lang)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={IconMenuBook}
          title={items.length === 0 ? t("customer.menu.emptyMenu") : t("customer.menu.noResults")}
          text={items.length === 0 ? "" : t("customer.menu.noResultsHint")}
        />
      ) : (
        groups.map((group) => (
          <section key={group.id}>
            {group.name && <h2 className="menu-section-title">{group.name}</h2>}
            <div className="dish-list">
              {group.items.map((item) => {
                const count = inCartCount(item.id);
                const off = !item.isAvailable || disabled;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`dish ${off ? "is-off" : ""}`}
                    onClick={() => !off && setSheetItem(item)}
                    disabled={off}
                  >
                    {item.imageUrl ? (
                      <img className="dish-thumb" src={item.imageUrl} alt="" loading="lazy" />
                    ) : (
                      <span className="dish-thumb">
                        <IconMenuBook size={26} />
                      </span>
                    )}

                    <span className="dish-body">
                      <span className="dish-name">{localized(item, "name", lang)}</span>
                      {localized(item, "description", lang) && (
                        <span className="dish-desc">{localized(item, "description", lang)}</span>
                      )}
                      <span className="dish-foot">
                        <span className="dish-price num">{formatMoney(item.price, lang)}</span>
                        {count > 0 && <span className="dish-cartcount num">{count}</span>}
                        {!item.isAvailable ? (
                          <span className="badge badge-gray">{t("customer.menu.unavailable")}</span>
                        ) : (
                          !disabled && (
                            <span className="dish-add">
                              <IconPlus size={17} />
                            </span>
                          )
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}

      <ItemSheet
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onConfirm={(quantity, note) => {
          cart.addItem(sheetItem, quantity, note);
          setSheetItem(null);
        }}
        onGoToCart={onGoToCart}
      />
    </div>
  );
}
