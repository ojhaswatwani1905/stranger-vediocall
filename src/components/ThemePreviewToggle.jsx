import React, { useState, useEffect } from 'react';

export const ThemePreviewToggle = () => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('theme_preview_mode') || 'off';
  });

  const isOn = themeMode === 'pink';

  useEffect(() => {
    if (themeMode === 'pink') {
      document.documentElement.setAttribute('data-theme', 'pink');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme_preview_mode', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'pink' ? 'off' : 'pink'));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] transition-all font-sans select-none">
      {/* Sleek Standalone iOS Style Sliding Pill Toggle Switch */}
      <button
        onClick={toggleTheme}
        type="button"
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-lg ${
          isOn ? 'bg-[#FF0F6D] shadow-rose-600/50' : 'bg-slate-700/90 shadow-slate-950/60'
        }`}
        role="switch"
        aria-checked={isOn}
        title={isOn ? 'Switch Theme OFF' : 'Switch Theme ON'}
      >
        <span className="sr-only">Toggle Theme</span>
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
            isOn ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
