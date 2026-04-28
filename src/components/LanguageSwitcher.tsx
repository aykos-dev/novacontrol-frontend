import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const lng = i18n.language.startsWith('en') ? 'en' : 'ru';

  return (
    <Select
      value={lng}
      onValueChange={(v) => void i18n.changeLanguage(v as 'ru' | 'en')}
      items={[
        { value: 'ru', label: t('language.ru') },
        { value: 'en', label: t('language.en') },
      ]}
    >
      <SelectTrigger size="sm" className="h-9 w-[118px] gap-1.5 px-2" aria-label={t('app.language')}>
        <Languages className="size-3.5 shrink-0 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">{t('language.ru')}</SelectItem>
        <SelectItem value="en">{t('language.en')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
