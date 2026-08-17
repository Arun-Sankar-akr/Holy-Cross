import React, { useState, useEffect } from 'react';
import { Sun, Gift } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './HolidayList.css';

export default function HolidaysList() {
    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'holidays'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHolidays(data);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="holidays-container">
            <div className="page-header">
                <h2><Sun size={28} /> List of Holidays</h2>
                <p>Official list of public and festive holidays</p>
            </div>

            {holidays.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No holidays published yet.</p>
            ) : (
                <div className="holidays-card">
                    <table className="holidays-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Occasion</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holidays.map((item) => (
                                <tr key={item.id}>
                                    <td className="holiday-date">{item.date}</td>
                                    <td>{item.day}</td>
                                    <td className="holiday-occasion">
                                        <Gift size={15} className="holiday-icon" />
                                        {item.occasion}
                                    </td>
                                    <td><span className="holiday-type">{item.type}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}