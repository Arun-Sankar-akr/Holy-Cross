import React, { useState, useEffect } from 'react';
import { Award, Medal, Trophy } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './ExamToppers.css';

export default function ExamToppers() {
    const [toppers, setToppers] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'exam_toppers'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setToppers(data);
        });
        return () => unsubscribe();
    }, []);

    const getRankIcon = (rank) => {
        if (Number(rank) === 1) return <Trophy size={28} className="rank-gold" />;
        if (Number(rank) === 2) return <Medal size={28} className="rank-silver" />;
        return <Medal size={28} className="rank-bronze" />;
    };

    return (
        <div className="toppers-container">
            <div className="page-header">
                <h2><Award size={28} /> Academic Toppers</h2>
                <p>Honoring our top academic achievers</p>
            </div>

            {toppers.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No toppers published yet.</p>
            ) : (
                <div className="toppers-cards-grid">
                    {toppers.map((topper) => (
                        <div key={topper.id} className={`topper-card rank-${topper.rank}`}>
                            <div className="rank-badge">{getRankIcon(topper.rank)}</div>
                            <h3 className="topper-name">{topper.name}</h3>
                            <p className="topper-class">{topper.class}</p>
                            <div className="topper-score">{topper.percentage}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}