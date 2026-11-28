const cardAssetUrls = import.meta.glob('../assets/cards/*', {
  eager: true,
  import: 'default',
  query: '?url',
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getCardImageUrl = (imageUrl) => {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('/uploads/cards/')) {
    const apiOrigin = new URL(API_BASE_URL, window.location.href).origin;
    return new URL(imageUrl, apiOrigin).toString();
  }

  const fileName = imageUrl.split('/').pop();
  const assetPath = `../assets/cards/${fileName}`;
  return cardAssetUrls[assetPath] || imageUrl;
};
