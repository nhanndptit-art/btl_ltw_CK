import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Dữ liệu tĩnh ít thay đổi: Thông tin Banner & Bảng tỷ lệ rớt thẻ
const STATIC_BANNER_CONFIG = {
  bannerCode: 'BANNER // 09-OVERDRIVE',
  bannerTitle: 'PHANTOM OF SECTOR 9',
  featuredUnit: 'AKIRA // ZERO',
  costPerPull: 160,
  hardPity: 90,
  rates: [
    { rarity: 'Legendary', rate: '1.5%', color: '#FFB800' },
    { rarity: 'Epic', rate: '8.5%', color: '#D900FF' },
    { rarity: 'Rare', rate: '30.0%', color: '#00F0FF' },
    { rarity: 'Common', rate: '60.0%', color: '#7F8C9A' },
  ],
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('cyber_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cyber_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, bannerConfig: STATIC_BANNER_CONFIG }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
