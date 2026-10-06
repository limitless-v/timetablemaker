export function isNonEmptyString(value, fieldName) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

export function normalizeRecordId(record, fallback) {
  if (record && record.id !== undefined && record.id !== null && record.id !== '') {
    return record.id;
  }
  return fallback;
}
