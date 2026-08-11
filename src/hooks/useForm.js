import { useCallback, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { mapServerErrors, validate } from "../utils/validation";

/**
 * Minimal form state manager: values, touched, errors, submit handling,
 * and Laravel 422 error mapping.
 */
export function useForm({ initialValues = {}, schema = {}, onSubmit }) {
  const { t } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const setValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setValue(name, type === "checkbox" ? checked : value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (event) => {
      const { name } = event.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      if (schema[name]) {
        const fieldErrors = validate(values, { [name]: schema[name] });
        setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
      }
    },
    [schema, values]
  );

  /** Translates the `{ key, params }` / `{ raw }` error shape to a string. */
  const errorText = useCallback(
    (field) => {
      const err = errors[field];
      if (!err) return null;
      if (err.raw) return err.raw;
      return t(err.key, err.params);
    },
    [errors, t]
  );

  const reset = useCallback(
    (next = initialValues) => {
      setValues(next);
      setErrors({});
      setTouched({});
      setFormError(null);
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setFormError(null);

      const validationErrors = validate(values, schema);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setTouched(Object.fromEntries(Object.keys(schema).map((k) => [k, true])));
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(values, { reset, setFormError });
      } catch (err) {
        if (err?.errors) {
          setErrors(mapServerErrors(err.errors));
        } else {
          setFormError(err);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, reset, schema, values]
  );

  return {
    values,
    setValues,
    setValue,
    errors,
    setErrors,
    errorText,
    touched,
    submitting,
    formError,
    setFormError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}
