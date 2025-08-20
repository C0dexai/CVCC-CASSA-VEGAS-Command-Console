import React, { useState } from 'react';
import { View } from '../types';
import OrbIcon from './icons/OrbIcon';
import CloseIcon from './icons/CloseIcon';

interface FloatingOrbMenuProps {
    tabs: { id: View, label: string }[];
    onSwitchView: (view: View) => void;
}

const FloatingOrbMenu: React.FC<FloatingOrbMenuProps> = ({ tabs, onSwitchView }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSelectView = (view: View) => {
        onSwitchView(view);
        setIsMenuOpen(false);
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3">
            {isMenuOpen && (
                 <div className="bg-black/70 backdrop-blur-md border border-neon-purple/50 rounded-lg shadow-lg shadow-neon-purple/30 p-2 flex flex-col gap-1 w-40">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleSelectView(tab.id)}
                            className="text-left w-full px-3 py-2 text-white font-semibold rounded-md hover:bg-neon-purple/30 transition-colors"
                        >
                            {tab.label}
                        </button>
                    ))}
                 </div>
            )}
            <button
                onClick={handleMenuToggle}
                className="w-16 h-16 rounded-full bg-neon-purple flex items-center justify-center shadow-neon-purple animate-pulse transition-transform hover:scale-110"
                aria-label="Toggle Quick Navigation Menu"
            >
                {isMenuOpen ? <CloseIcon /> : <OrbIcon />}
            </button>
        </div>
    );
};

export default FloatingOrbMenu;
