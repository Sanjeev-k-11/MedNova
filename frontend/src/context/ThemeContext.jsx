// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { assets } from '../assets/assets'; // Adjust path if necessary

// --- Font Definitions ---
const fontOptionsList = [
    "'Inter', sans-serif", "'Roboto', sans-serif", "'Poppins', sans-serif",
    "'Lato', sans-serif", "'Georgia', serif", "'Times New Roman', serif",
    "'Arial', sans-serif", "'Verdana', sans-serif", "'Courier New', monospace"
];

// --- Expanded Theme Configuration ---
const themeOptions = {
    textColors: [
        '#FFFFFF', '#F3F4F6', '#D1D5DB', '#4B5563', '#1F2937', '#111827', '#000000',
        '#3B82F6', '#2563EB', '#DC2626', '#B91C1C', '#16A34A', '#0F766E', '#D97706', '#EA580C',
        '#9333EA', '#EC4899', '#9C27B0', '#4CAF50', '#FFC107', '#FF5722', '#3E2723',
        '#673AB7', '#00BCD4', '#607D8B', '#795548', '#FF9800', '#009688'
    ],
    bgColors: [
        '#FFFFFF', '#F8FAFC', '#E5E7EB', '#EFF6FF', '#E0F2FE', '#F0FDF4',
        '#FEF3C7', '#FFF7ED', '#FCE7F3', '#EDE9FE', '#F1F5F9', '#FDE68A', '#FCA5A5',
        '#86EFAC', '#A78BFA', '#7DD3FC', '#FDBA74', '#111827', '#1E293B', '#0F172A',
        '#042F2E', '#4A044E', '#312E81', '#78350F', '#000000', '#FFEB3B', '#607D8B',
        '#B3E5FC', '#D1C4E9', '#F8BBD0', '#DCEDC8', '#CFD8DC'
    ],
    fonts: fontOptionsList,
    defaultTheme: {
        textColor: '#1F2937',
        bgColor: '#EFF6FF',
        navbarBgColor: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
    },
    themeIcon: assets.palette_icon || 'path/to/default/palette_icon.png'
};
// --- ---

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme) {
            try {
                const parsed = JSON.parse(savedTheme);
                if (parsed.textColor && parsed.bgColor && parsed.navbarBgColor && parsed.fontFamily) {
                    if (
                        themeOptions.textColors.includes(parsed.textColor) &&
                        themeOptions.bgColors.includes(parsed.bgColor) &&
                        themeOptions.bgColors.includes(parsed.navbarBgColor) &&
                        themeOptions.fonts.includes(parsed.fontFamily)
                    ) return parsed;
                }
            } catch (e) { console.error("Failed to parse theme", e); }
        }
        return themeOptions.defaultTheme;
    });

    const [showThemeOptions, setShowThemeOptions] = useState(false);
    const [showMoreColors, setShowMoreColors] = useState(false);

    useEffect(() => {
        localStorage.setItem('appTheme', JSON.stringify(currentTheme));
    }, [currentTheme]);

    // --- Handlers ---
    const handleTextColorChange = (color) => {
        if (themeOptions.textColors.includes(color)) {
            setCurrentTheme((prev) => ({ ...prev, textColor: color }));
        }
    };

    const handleBgColorChange = (color, target = 'main') => {
        if (!themeOptions.bgColors.includes(color)) return;
        setCurrentTheme((prev) => ({
            ...prev,
            [target === 'navbar' ? 'navbarBgColor' : 'bgColor']: color
        }));
    };

    const handleFontChange = (font) => {
        if (themeOptions.fonts.includes(font)) {
            setCurrentTheme((prev) => ({ ...prev, fontFamily: font }));
        }
    };

    const resetTheme = () => {
        setCurrentTheme(themeOptions.defaultTheme);
        setShowThemeOptions(false);
    };

    return (
        <ThemeContext.Provider value={{
            currentTheme, themeOptions, showThemeOptions, setShowThemeOptions,
            handleTextColorChange, handleBgColorChange, handleFontChange, resetTheme,
            defaultTheme: themeOptions.defaultTheme, showMoreColors, setShowMoreColors
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
