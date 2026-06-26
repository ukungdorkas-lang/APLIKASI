import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc, WriteBatch, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppTheme } from '../types';

interface ThemeContextType {
  activeTheme: AppTheme | null;
  themes: AppTheme[];
  applyTheme: (themeId: string) => Promise<void>;
  seedThemes: () => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<AppTheme | null>(null);
  const [themes, setThemes] = useState<AppTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'themes'));
    const unsub = onSnapshot(q, (snapshot) => {
      const themesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppTheme));
      setThemes(themesData);
      
      const active = themesData.find(t => t.isActive);
      if (active) {
        setActiveTheme(active);
        applyThemeStyles(active);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const applyThemeStyles = (theme: AppTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--app-primary', theme.primaryColor);
    root.style.setProperty('--app-dark', theme.secondaryColor || '#0f172a');
    root.style.setProperty('--app-accent', theme.accentColor || '#fbbf24');
    root.style.setProperty('--app-bg', theme.backgroundColor || '#f1f5f9');
    root.style.setProperty('--app-text', theme.textColor || '#0f172a');
    root.style.setProperty('--app-surface', theme.surfaceColor || '#ffffff');
    root.style.setProperty('--app-font-sans', theme.fontFamily || 'Inter');
    
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const seedThemes = async () => {
    try {
      const defaultThemes = [
        {
          name: 'Classic Damkar',
          primaryColor: '#e11d48',
          secondaryColor: '#0f172a',
          accentColor: '#fbbf24',
          backgroundColor: '#f1f5f9',
          surfaceColor: '#ffffff',
          textColor: '#0f172a',
          fontFamily: 'Inter',
          isDark: false,
          isActive: true
        },
        {
          name: 'Night Rescue',
          primaryColor: '#f43f5e',
          secondaryColor: '#020617',
          accentColor: '#38bdf8',
          backgroundColor: '#020617',
          surfaceColor: '#0f172a',
          textColor: '#f8fafc',
          fontFamily: 'Space Grotesk',
          isDark: true,
          isActive: false
        },
        {
          name: 'Golden Alert',
          primaryColor: '#d97706',
          secondaryColor: '#451a03',
          accentColor: '#10b981',
          backgroundColor: '#fffbeb',
          surfaceColor: '#ffffff',
          textColor: '#451a03',
          fontFamily: 'Outfit',
          isDark: false,
          isActive: false
        }
      ];

      for (const t of defaultThemes) {
        await addDoc(collection(db, 'themes'), t);
      }
    } catch (err) {
      console.error('Seed themes failed:', err);
    }
  };

  const applyTheme = async (themeId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Deactivate all
      themes.forEach(t => {
        if (t.isActive && t.id !== themeId) {
          batch.update(doc(db, 'themes', t.id), { isActive: false });
        }
      });

      // Activate selected
      batch.update(doc(db, 'themes', themeId), { isActive: true });
      
      await batch.commit();
    } catch (error) {
      console.error('Error applying theme:', error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, themes, applyTheme, seedThemes, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
