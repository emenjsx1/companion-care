// Single source of truth for how much a student owes.
// Dívida total = (valor acordado, quando definido, senão preço do curso) - desconto
export const computeTotalDue = (
  agreedFee: number | string | null | undefined,
  coursePrice: number | string | null | undefined,
  discount: number | string | null | undefined,
): number => {
  const fee = agreedFee === null || agreedFee === undefined || agreedFee === '' ? null : Number(agreedFee);
  const price = Number(coursePrice) || 0;
  const disc = Number(discount) || 0;
  return Math.max(0, (fee ?? price) - disc);
};
