'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

type NavLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  /** Only the exact path counts as active, not its sub-pages. */
  exact?: boolean;
  activeClassName?: string;
};

/** Link that marks itself with aria-current="page" when it points at the current route. */
export function NavLink({
  href,
  exact = false,
  className,
  activeClassName,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(className, isActive && activeClassName)}
      {...props}
    />
  );
}
