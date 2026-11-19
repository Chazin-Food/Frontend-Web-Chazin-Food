const BROKEN_IMAGE_REPLACEMENTS = {
  'photo-1619740455993-9e612b1af08a': 'https://res.cloudinary.com/dckwtknmq/image/upload/v1788993441/c9pne5jrmjv5po93xhhl.jpg'
};

/**
 * Utilidades de optimización de imágenes para máximo rendimiento (Lighthouse 100/100)
 * Transforma URLs de Cloudinary y Unsplash en formatos modernos (WebP/AVIF),
 * con compresión inteligente al vuelo y resolución adaptada al contenedor.
 */
export const getOptimizedImageUrl = (url, width = 600, quality = 'auto') => {
  if (!url || typeof url !== 'string') return url;

  let resolvedUrl = url;
  for (const [brokenFragment, safeUrl] of Object.entries(BROKEN_IMAGE_REPLACEMENTS)) {
    if (resolvedUrl.includes(brokenFragment)) {
      resolvedUrl = safeUrl;
      break;
    }
  }

  // Optimización de imágenes en Cloudinary
  if (resolvedUrl.includes('res.cloudinary.com') && resolvedUrl.includes('/image/upload/')) {
    // Si ya contiene parámetros de transformación, devolver tal cual
    if (resolvedUrl.includes('/image/upload/f_auto') || resolvedUrl.includes('/image/upload/w_') || resolvedUrl.includes('/image/upload/c_')) {
      return resolvedUrl;
    }
    const transform = `f_auto,q_${quality},w_${width},c_limit/`;
    return resolvedUrl.replace('/image/upload/', `/image/upload/${transform}`);
  }

  // Optimización de imágenes en Unsplash
  if (resolvedUrl.includes('images.unsplash.com')) {
    let cleanUrl = resolvedUrl;
    if (cleanUrl.includes('w=')) {
      cleanUrl = cleanUrl.replace(/w=\d+/, `w=${width}`);
    } else {
      cleanUrl += `${cleanUrl.includes('?') ? '&' : '?'}w=${width}`;
    }
    if (!cleanUrl.includes('auto=format')) {
      cleanUrl += '&auto=format';
    }
    if (cleanUrl.includes('q=')) {
      cleanUrl = cleanUrl.replace(/q=\d+/, 'q=75');
    } else {
      cleanUrl += '&q=75';
    }
    return cleanUrl;
  }

  return resolvedUrl;
};
