import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  updateSettings,
  SiteSettings,
  getSettings,
  DEFAULT_SETTINGS,
} from "../services/settingsService";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

const numberFields = new Set([
  "deliveryFee",
  "weekdayBuffetPrice",
  "saturdayBuffetPrice",
  "sundayBuffetPrice",
]);

export function AdminSettings() {
  const { t } = useTranslation();
  const { refreshSettings } = useSettings();
  const [formData, setFormData] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getSettings();
      setFormData(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.has(name) ? Number.parseFloat(value) || 0 : value,
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      await updateSettings(formData);
      await refreshSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[var(--color-shu)]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <h2 className="text-2xl font-serif font-bold text-[var(--color-washi)] mb-6">
        {t("admin.generalSettings")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
              {t("admin.restaurantName")}
            </label>
            <input
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
              {t("admin.kanjiText")}
            </label>
            <input
              type="text"
              name="restaurantKanji"
              value={formData.restaurantKanji}
              onChange={handleChange}
              className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              maxLength={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
            {t("admin.subtitleText")}
          </label>
          <textarea
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)] resize-none h-24"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--color-washi)]/10">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
              {t("admin.contactEmail")}
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
              {t("admin.contactPhone")}
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
            />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-[var(--color-washi)]/10">
          <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
            {t("admin.physicalAddress")}
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Kuskinkatu 3&#10;20780 Kaarina, Finland"
            className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)] resize-none h-24"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--color-washi)]/10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-washi)]/80">
              Online Ordering
            </h3>
            <p className="text-xs text-[var(--color-washi)]/40 mt-1">
              These values affect checkout and public links.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
              Delivery Fee For Orders Over EUR 20
            </label>
            <input
              type="number"
              step="0.10"
              min="0"
              name="deliveryFee"
              value={formData.deliveryFee}
              onChange={handleChange}
              className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
            />
            <p className="text-xs text-[var(--color-washi)]/40">
              Pickup stays free. Delivery only adds this fee when the order
              subtotal is above EUR 20.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Instagram URL
              </label>
              <input
                type="url"
                name="instagramUrl"
                value={formData.instagramUrl}
                onChange={handleChange}
                placeholder="https://instagram.com/your-page"
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Facebook URL
              </label>
              <input
                type="url"
                name="facebookUrl"
                value={formData.facebookUrl}
                onChange={handleChange}
                placeholder="https://facebook.com/your-page"
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Twitter / X URL
              </label>
              <input
                type="url"
                name="twitterUrl"
                value={formData.twitterUrl}
                onChange={handleChange}
                placeholder="https://x.com/your-page"
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Privacy Policy URL
              </label>
              <input
                type="url"
                name="privacyPolicyUrl"
                value={formData.privacyPolicyUrl}
                onChange={handleChange}
                placeholder="https://yourdomain.com/privacy"
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
              Terms of Service URL
            </label>
            <input
              type="url"
              name="termsUrl"
              value={formData.termsUrl}
              onChange={handleChange}
              placeholder="https://yourdomain.com/terms"
              className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--color-washi)]/10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-washi)]/80">
              Opening Hours
            </h3>
            <p className="text-xs text-[var(--color-washi)]/40 mt-1">
              These values drive the public footer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Mon - Fri Hours
              </label>
              <input
                type="text"
                name="weekdayHours"
                value={formData.weekdayHours}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Mon - Fri Buffet Hours
              </label>
              <input
                type="text"
                name="weekdayBuffetHours"
                value={formData.weekdayBuffetHours}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Mon - Fri Buffet Price
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                name="weekdayBuffetPrice"
                value={formData.weekdayBuffetPrice}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Saturday Hours
              </label>
              <input
                type="text"
                name="saturdayHours"
                value={formData.saturdayHours}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Saturday Buffet Hours
              </label>
              <input
                type="text"
                name="saturdayBuffetHours"
                value={formData.saturdayBuffetHours}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Saturday Buffet Price
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                name="saturdayBuffetPrice"
                value={formData.saturdayBuffetPrice}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Sunday Hours
              </label>
              <input
                type="text"
                name="sundayHours"
                value={formData.sundayHours}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Sunday Buffet Hours
              </label>
              <input
                type="text"
                name="sundayBuffetHours"
                value={formData.sundayBuffetHours}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-washi)]/60">
                Sunday Buffet Price
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                name="sundayBuffetPrice"
                value={formData.sundayBuffetPrice}
                onChange={handleChange}
                className="w-full bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 focus:ring-0 focus:border-[var(--color-shu)] rounded-sm p-3 text-sm text-[var(--color-washi)]"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 flex items-center justify-end gap-4">
          {success && (
            <span className="text-green-400 flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 size={16} /> {t("admin.saved")}
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[var(--color-washi)] hover:bg-[var(--color-shu)] text-[var(--color-sumi)] hover:text-[var(--color-washi)] px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? t("admin.saving") : t("admin.saveSettings")}
          </button>
        </div>
      </form>
    </div>
  );
}
