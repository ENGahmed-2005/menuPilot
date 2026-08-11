/**
 * Small declarative validation helper.
 * Rules are plain functions returning an i18n key + params, or null when valid.
 */

export const rules = {
  required: () => (value) =>
    value === undefined || value === null || String(value).trim() === ""
      ? { key: "validation.required" }
      : null,

  email: () => (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())
      ? { key: "validation.email" }
      : null,

  minLength: (count) => (value) =>
    value && String(value).length < count ? { key: "validation.minLength", params: { count } } : null,

  maxLength: (count) => (value) =>
    value && String(value).length > count ? { key: "validation.maxLength", params: { count } } : null,

  phone: () => (value) =>
    value && !/^[0-9+\-\s()]{9,15}$/.test(String(value).trim())
      ? { key: "validation.phone" }
      : null,

  positiveNumber: () => (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isNaN(n) || n <= 0 ? { key: "validation.positiveNumber" } : null;
  },

  number: () => (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number.isNaN(Number(value)) ? { key: "validation.number" } : null;
  },

  min: (min) => (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value) < min ? { key: "validation.minValue", params: { min } } : null;
  },

  max: (max) => (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value) > max ? { key: "validation.maxValue", params: { max } } : null;
  },

  matches: (otherField) => (value, values) =>
    value !== values[otherField] ? { key: "validation.passwordMatch" } : null,
};

/**
 * Runs a schema (`{ field: [rule, rule] }`) against a values object.
 * Returns `{ field: { key, params } }` for failing fields only.
 */
export function validate(values, schema) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const result = rule(values[field], values);
      if (result) {
        errors[field] = result;
        break;
      }
    }
  }
  return errors;
}

/** Maps a Laravel 422 `errors` payload onto the local error shape. */
export function mapServerErrors(serverErrors) {
  if (!serverErrors) return {};
  const mapped = {};
  for (const [field, messages] of Object.entries(serverErrors)) {
    mapped[field] = { raw: Array.isArray(messages) ? messages[0] : String(messages) };
  }
  return mapped;
}
