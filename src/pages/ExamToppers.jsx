import React, { useState, useEffect } from 'react';
import { Award, Medal, Trophy } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './ExamToppers.css';

export default function ExamToppers() {
    const [toppers, setToppers] = useState([]);

    const getClassOrder = (v = '') => {
        const value = String(v).toUpperCase();
        if (value.includes('XII')) return 2;
        if (value.includes('X')) return 1;
        return 99;
    };

    const getRankNum = (r) => {
        const n = parseInt(r, 10);
        return Number.isFinite(n) ? n : 99;
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'exam_toppers'), (snapshot) => {
            setToppers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const getRankIcon = (rank, size = 28) => {
        if (Number(rank) === 1) return <Trophy size={size} className="rank-gold" />;
        if (Number(rank) === 2) return <Medal size={size} className="rank-silver" />;
        return <Medal size={size} className="rank-bronze" />;
    };

    // Group toppers by class (streamOrGrade), then sort each group by rank
    // so #1 always appears before #2, #2 before #3, etc.
    const groupedByClass = toppers.reduce((groups, topper) => {
        const key = topper.streamOrGrade || 'Other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(topper);
        return groups;
    }, {});
    Object.values(groupedByClass).forEach((group) => {
        group.sort((a, b) => getRankNum(a.rank) - getRankNum(b.rank));
    });
    const classGroups = Object.keys(groupedByClass).sort(
        (a, b) => getClassOrder(a) - getClassOrder(b)
    );

    return (
        <div className="toppers-container">
            <div className="page-header">
                <h2><Award size={28} /> Academic Toppers</h2>
                <p>Honoring our top academic achievers</p>
            </div>

            {toppers.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No toppers published yet.</p>
            ) : (
                classGroups.map((classLabel) => (
                    <section className="toppers-class-group" key={classLabel}>
                        <h3 className="toppers-class-heading">{classLabel}</h3>
                        <div className="toppers-cards-grid">
                            {groupedByClass[classLabel].map((topper) => (
                                <div key={topper.id} className={`topper-card rank-${topper.rank}`}>
                                    {topper.photo ? (
                                        <div className="topper-photo-wrap">
                                            <img src={topper.photo} alt={topper.name} className="topper-photo" />
                                            <span className="topper-rank-overlay">{getRankIcon(topper.rank, 22)}</span>
                                        </div>
                                    ) : (
                                        <div className="rank-badge">{getRankIcon(topper.rank)}</div>
                                    )}
                                    <h3 className="topper-name">{topper.name}</h3>
                                    <p className="topper-class">{topper.streamOrGrade}</p>
                                    <div className="topper-score">{topper.scoreOrPercentage}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}