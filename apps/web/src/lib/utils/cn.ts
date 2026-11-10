/** Joins the truthy class names: cn('base', isActive && 'active'). */
export function cn(...classNames: readonly (string | false | null | undefined)[]): string {
  return classNames.filter(Boolean).join(' ');
}
