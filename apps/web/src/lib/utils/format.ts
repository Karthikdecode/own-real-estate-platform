export function formatPrice(price: number, listingType?: string): string {
  let formatted = '';
  if (price >= 10000000) {
    const cr = (price / 10000000).toFixed(2).replace(/\.00$/, '');
    formatted = `₹${cr} Cr`;
  } else if (price >= 100000) {
    const l = (price / 100000).toFixed(2).replace(/\.00$/, '');
    formatted = `₹${l} L`;
  } else {
    formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }

  if (listingType === 'rent') {
    return `${formatted} / mo`;
  }
  return formatted;
}

export function formatPropertyType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

