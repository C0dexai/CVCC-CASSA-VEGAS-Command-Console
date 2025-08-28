
import React, { useState, useLayoutEffect } from 'react';

type Collaborator = {
  id: string;
  name: string;
  color: string;
  cursorPos: number;
};

interface CollaboratorCursorsProps {
  collaborators: Collaborator[];
  text: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

interface CursorPosition {
  top: number;
  left: number;
  height: number;
}

const calculateCursorPosition = (textarea: HTMLTextAreaElement, text: string, position: number): CursorPosition => {
    if (!textarea) return { top: 0, left: 0, height: 0 };
    
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    [
        'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
        'lineHeight', 'textTransform', 'wordSpacing', 'textIndent',
        'whiteSpace', 'wordWrap', 'wordBreak', 'boxSizing',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'
    ].forEach(prop => {
        mirror.style[prop as any] = style[prop as any];
    });

    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '-9999px';
    mirror.style.width = style.width;
    mirror.style.height = 'auto';
    mirror.textContent = text.substring(0, position);
    
    const cursorMarker = document.createElement('span');
    cursorMarker.innerHTML = '&#8203;';
    mirror.appendChild(cursorMarker);
    
    document.body.appendChild(mirror);
    
    const top = cursorMarker.offsetTop;
    const left = cursorMarker.offsetLeft;
    const height = cursorMarker.offsetHeight;

    document.body.removeChild(mirror);

    return {
        top: top - textarea.scrollTop,
        left: left - textarea.scrollLeft,
        height: height > 0 ? height : parseFloat(style.lineHeight),
    };
};


const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({ collaborators, text, textareaRef }) => {
    const [positions, setPositions] = useState<Record<string, CursorPosition>>({});

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const newPositions: Record<string, CursorPosition> = {};
        collaborators.forEach(c => {
            newPositions[c.id] = calculateCursorPosition(textarea, text, c.cursorPos);
        });
        setPositions(newPositions);
    }, [collaborators, text, textareaRef]);

    if (!textareaRef.current) return null;

    const editorHeight = textareaRef.current.clientHeight;

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden p-4 font-mono text-sm">
            {collaborators.map(c => {
                const pos = positions[c.id];
                if (!pos || pos.top < 0 || pos.top > editorHeight) return null;

                return (
                    <div
                        key={c.id}
                        className="absolute transition-all duration-200 ease-linear"
                        style={{
                            transform: `translate(${pos.left}px, ${pos.top}px)`,
                            height: `${pos.height}px`
                        }}
                    >
                        <div className="w-0.5 h-full" style={{ backgroundColor: c.color }} />
                        <div
                            className="absolute top-[-22px] left-[-2px] text-xs text-black font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                            style={{ backgroundColor: c.color }}
                        >
                            {c.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CollaboratorCursors;
