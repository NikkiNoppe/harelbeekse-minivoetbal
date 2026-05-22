/** Shared helpers for application_settings reads/writes. */

export function applicationSettingInsert(row: {
  setting_category: string;
  setting_name: string;
  setting_value: unknown;
}) {
  return {
    setting_category: row.setting_category,
    setting_name: row.setting_name,
    setting_value: row.setting_value,
  };
}

export function applicationSettingUpdate(row: {
  setting_value?: unknown;
}) {
  const payload: { setting_value?: unknown } = {};
  if (row.setting_value !== undefined) payload.setting_value = row.setting_value;
  return payload;
}
