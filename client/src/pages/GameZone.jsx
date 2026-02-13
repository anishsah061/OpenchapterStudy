import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBrain, FaBook, FaPencilAlt, FaAtom, FaCalculator, FaGlobeAmericas, FaLaptopCode, FaMusic } from 'react-icons/fa';
import { useUI } from '../context/UIContext';

const CARD_ICONS = [
    FaBrain, FaBook, FaPencilAlt, FaAtom,
    FaCalculator, FaGlobeAmericas, FaLaptopCode, FaMusic
];

const GameZone = () => {
    const navigate = useNavigate();
    const { addToast } = useUI();
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [moves, setMoves] = useState(0);
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        // Duplicate icons to create pairs
        const pairIcons = [...CARD_ICONS, ...CARD_ICONS];
        // Shuffle
        const shuffled = pairIcons.sort(() => Math.random() - 0.5);

        const deck = shuffled.map((Icon, index) => ({
            id: index,
            icon: Icon,
            isFlipped: false,
            isSolved: false
        }));

        setCards(deck);
        setFlipped([]);
        setSolved([]);
        setMoves(0);
        setDisabled(false);
    };

    const handleClick = (id) => {
        if (disabled) return;

        const currentCard = cards.find(c => c.id === id);
        if (solved.includes(id) || flipped.includes(id)) return;

        // Flip logic
        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setDisabled(true);
            setMoves(prev => prev + 1);
            checkForMatch(newFlipped);
        }
    };

    const checkForMatch = ([firstId, secondId]) => {
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard.icon === secondCard.icon) {
            setSolved(prev => [...prev, firstId, secondId]);
            setFlipped([]);
            setDisabled(false);

            if (solved.length + 2 === cards.length) {
                addToast("Congratulations! Brain recharged!", "success");
            }
        } else {
            setTimeout(() => {
                setFlipped([]);
                setDisabled(false);
            }, 1000);
        }
    };

    const isFlipped = (id) => flipped.includes(id) || solved.includes(id);

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '800px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('/')}
                    className="glass-button"
                    style={{ background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FaArrowLeft /> Back
                </button>
                <h1 style={{ margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Mind Refresh</h1>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                    Moves: {moves}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                width: '100%',
                maxWidth: '600px',
                aspectRatio: '1',
            }}>
                {cards.map(card => {
                    const flippedState = isFlipped(card.id);
                    return (
                        <div
                            key={card.id}
                            onClick={() => handleClick(card.id)}
                            style={{
                                Perspective: '1000px',
                                cursor: 'pointer',
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s',
                                transform: flippedState ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                width: '100%',
                                height: '100%'
                            }}
                        >
                            {/* Front (Hidden) */}
                            <div className="glass-panel" style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                borderRadius: '12px'
                            }}>
                                <FaBrain size={30} color="rgba(255,255,255,0.3)" />
                            </div>

                            {/* Back (Revealed Icon) */}
                            <div className="glass-panel" style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.9)',
                                borderRadius: '12px'
                            }}>
                                <card.icon size={40} color="#4f46e5" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={initializeGame}
                className="glass-button"
                style={{ marginTop: '2rem', padding: '12px 32px', fontSize: '1.1rem' }}
            >
                Reset Game
            </button>
        </div>
    );
};

export default GameZone;
