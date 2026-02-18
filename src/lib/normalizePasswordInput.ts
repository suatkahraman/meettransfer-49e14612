/**
 * iOS ve diğer platformlarda şifre girişini normalize eder.
 * iOS klavyesi bazı locale'lerde Arap-Indik rakamlar (٠١٢٣) veya full-width rakamlar (０１２３)
 * girebilir - bu durumda Supabase "Invalid credentials" döner çünkü kayıtlı şifre ASCII ile oluşturulmuştur.
 * Android'de giriş yapılan hesaba iOS'tan giriş yapılamama sorununu çözer.
 */
export function normalizePasswordInput(input: string): string {
  if (!input || typeof input !== 'string') return input;

  const trimmed = input.trim();

  // Arap-Indik (٠-٩), Doğu Arap (۰-۹), Full-width (０-９) → ASCII (0-9)
  const mapped = trimmed
    .replace(/[\s\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[０-９]/g, (d) => String('０１２３４５６７８９'.indexOf(d)));

  return mapped;
}
