import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  language?: 'TR' | 'EN';
}

interface StrengthCriteria {
  label: string;
  labelTR: string;
  met: boolean;
}

const PasswordStrengthIndicator = ({ password, language = 'EN' }: PasswordStrengthIndicatorProps) => {
  const criteria: StrengthCriteria[] = useMemo(() => [
    {
      label: 'At least 6 characters',
      labelTR: 'En az 6 karakter',
      met: password.length >= 6,
    },
    {
      label: '1 uppercase letter',
      labelTR: '1 büyük harf',
      met: /[A-Z]/.test(password),
    },
    {
      label: '1 lowercase letter',
      labelTR: '1 küçük harf',
      met: /[a-z]/.test(password),
    },
    {
      label: 'At least 4 digits',
      labelTR: 'En az 4 rakam',
      met: /\d.*\d.*\d.*\d/.test(password),
    },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = criteria.filter(c => c.met).length;
    if (metCount === 0) return { level: 0, label: 'Too weak', labelTR: 'Çok zayıf', color: 'bg-muted' };
    if (metCount === 1) return { level: 1, label: 'Weak', labelTR: 'Zayıf', color: 'bg-red-500' };
    if (metCount === 2) return { level: 2, label: 'Fair', labelTR: 'Orta', color: 'bg-orange-500' };
    if (metCount === 3) return { level: 3, label: 'Good', labelTR: 'İyi', color: 'bg-yellow-500' };
    return { level: 4, label: 'Strong', labelTR: 'Güçlü', color: 'bg-green-500' };
  }, [criteria]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {language === 'TR' ? 'Şifre gücü' : 'Password strength'}
          </span>
          <span className={cn(
            "text-xs font-medium",
            strength.level <= 1 && "text-red-500",
            strength.level === 2 && "text-orange-500",
            strength.level === 3 && "text-yellow-600",
            strength.level === 4 && "text-green-500"
          )}>
            {language === 'TR' ? strength.labelTR : strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                level <= strength.level ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {criteria.map((criterion, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              criterion.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {criterion.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{language === 'TR' ? criterion.labelTR : criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
