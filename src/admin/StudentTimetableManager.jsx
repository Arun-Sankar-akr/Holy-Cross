import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase'
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { BookOpen, Folder, ArrowLeft, PlusCircle } from 'lucide-react';

export default function StudentTimetableManager() {
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    // Dynamic data state from Firestore
    const [classList, setClassList] = useState([]);
    const [sectionsList, setSectionsList] = useState([]);
    const [studentTimetables, setStudentTimetables] = useState([]);

    // Form state for adding a slot
    const [studentTimetableForm, setStudentTimetableForm] = useState({
        day: 'Monday',
        timeSlot: '',
        subject: '',
        teacherName: '',
        roomNo: ''
    });

    // 1. Fetch Class Sections from Firestore ('class_sections')
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'class_sections'), (snapshot) => {
            const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Derive unique class names (e.g., Class 10, Class 11)
            const uniqueClasses = [...new Set(sectionsData.map(s => s.className).filter(Boolean))];

            setSectionsList(sectionsData);
            setClassList(uniqueClasses);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Timetable Entries from Firestore ('timetables')
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'timetables'), (snapshot) => {
            const timetableData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudentTimetables(timetableData);
        });
        return () => unsubscribe();
    }, []);

    // 3. Handle Form Submit — Save to Firestore 'timetables' collection
    const handleAddStudentTimetable = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'timetables'), {
                className: selectedClass,
                sectionName: selectedSection.name,
                day: studentTimetableForm.day,
                timeSlot: studentTimetableForm.timeSlot,
                subject: studentTimetableForm.subject,
                teacherName: studentTimetableForm.teacherName || '',
                roomNo: studentTimetableForm.roomNo || '',
                createdAt: new Date()
            });

            // Reset form fields
            setStudentTimetableForm({
                day: 'Monday',
                timeSlot: '',
                subject: '',
                teacherName: '',
                roomNo: ''
            });
            alert('Timetable slot added successfully!');
        } catch (error) {
            console.error('Error saving slot to Firestore:', error);
            alert('Failed to save slot. Check console for details.');
        }
    };

    return (
        <div className="applications-management-card">
            {/* STEP 1: SELECT CLASS */}
            {!selectedClass && (
                <>
                    <h3>Student Timetable — Select Class</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                        Select a class to view or manage its weekly timetable schedule.
                    </p>
                    <div className="class-cards-grid">
                        {classList.map((cls) => {
                            const countSlots = studentTimetables.filter(t => t.className === cls).length;
                            return (
                                <div
                                    key={cls}
                                    className="class-card"
                                    onClick={() => setSelectedClass(cls)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="class-card-icon">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="class-card-content">
                                        <h4>{cls}</h4>
                                        <span>{countSlots} Scheduled Slots</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* STEP 2: SELECT SECTION */}
            {selectedClass && !selectedSection && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <button className="back-btn" onClick={() => setSelectedClass(null)}>
                            <ArrowLeft size={16} /> Back to Classes
                        </button>
                        <h3 style={{ margin: 0 }}>{selectedClass} Timetable — Select Section</h3>
                    </div>

                    {sectionsList.filter(s => s.className === selectedClass).length === 0 ? (
                        <div className="empty-state">
                            No sections found for {selectedClass}. Please create documents in the <strong>class_sections</strong> collection in Firebase first.
                        </div>
                    ) : (
                        <div className="sections-grid">
                            {sectionsList.filter(s => s.className === selectedClass).map(sec => {
                                const sectionSlots = studentTimetables.filter(
                                    t => t.className === selectedClass && t.sectionName === sec.name
                                ).length;
                                return (
                                    <div
                                        key={sec.id}
                                        className="section-card"
                                        onClick={() => setSelectedSection(sec)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="section-card-body">
                                            <Folder size={22} className="section-folder-icon" />
                                            <div>
                                                <h5>{sec.name}</h5>
                                                <p>{sec.roomNo ? `Room: ${sec.roomNo} • ` : ''}{sectionSlots} Slots Added</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* STEP 3: ADD AND VIEW TIMETABLE */}
            {selectedClass && selectedSection && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <button className="back-btn" onClick={() => setSelectedSection(null)}>
                            <ArrowLeft size={16} /> Back to Sections
                        </button>
                        <h3 style={{ margin: 0 }}>
                            {selectedClass} — {selectedSection.name} Timetable Schedule
                        </h3>
                    </div>

                    {/* Form to save new slot to Firebase */}
                    <form onSubmit={handleAddStudentTimetable} className="student-admission-form" style={{ marginBottom: '24px' }}>
                        <div className="student-form-grid">
                            <div>
                                <label>Day of Week</label>
                                <select
                                    value={studentTimetableForm.day}
                                    onChange={e => setStudentTimetableForm({ ...studentTimetableForm, day: e.target.value })}
                                    required
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Time Slot</label>
                                <select
                                    value={studentTimetableForm.timeSlot}
                                    onChange={e => setStudentTimetableForm({ ...studentTimetableForm, timeSlot: e.target.value })}
                                    required
                                >
                                    <option value="">Select Time Slot</option>
                                    <option value="09.00-09.45">09.00 - 09.45</option>
                                    <option value="09.45-10.20">09.45 - 10.20</option>
                                    <option value="10.20-11.00">10.20 - 11.00</option>
                                    <option value="11.15-11.50">11.15 - 11.50</option>
                                    <option value="11.50-12.30">11.50 - 12.30</option>
                                    <option value="01.00-01.45">01.00 - 01.45</option>
                                    <option value="01.45-02.20">01.45 - 02.20</option>
                                    <option value="02.20-02.40">02.20 - 02.40</option>
                                    <option value="02.50-03.30">02.50 - 03.30</option>
                                    <option value="03.30-04.10">03.30 - 04.10</option>
                                </select>
                            </div>
                            <div>
                                <label>Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Mathematics"
                                    value={studentTimetableForm.subject}
                                    onChange={e => setStudentTimetableForm({ ...studentTimetableForm, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label>Teacher Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dr. Sharma"
                                    value={studentTimetableForm.teacherName}
                                    onChange={e => setStudentTimetableForm({ ...studentTimetableForm, teacherName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Room No</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Room 204"
                                    value={studentTimetableForm.roomNo}
                                    onChange={e => setStudentTimetableForm({ ...studentTimetableForm, roomNo: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="add-notice-btn" style={{ marginTop: '16px' }}>
                            <PlusCircle size={16} /> Save Slot to Firestore
                        </button>
                    </form>

                    {/* Schedule Grid */}
                    <div className="table-responsive">
                        <table className="timetable-grid">
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>09.00-09.45</th>
                                    <th>09.45-10.20</th>
                                    <th>10.20-11.00</th>
                                    <th>11.15-11.50</th>
                                    <th>11.50-12.30</th>
                                    <th>01.00-01.45</th>
                                    <th>01.45-02.20</th>
                                    <th>02.20-02.40</th>
                                    <th>02.50-03.30</th>
                                    <th>03.30-04.10</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                                    const daySlots = studentTimetables.filter(
                                        t => t.className === selectedClass &&
                                            t.sectionName === selectedSection.name &&
                                            t.day === day
                                    );

                                    const getSlot = (slotTime) => daySlots.find(s => s.timeSlot === slotTime);

                                    return (
                                        <tr key={day}>
                                            <td className="day-header"><strong>{day}</strong></td>
                                            <td>{getSlot('09.00-09.45')?.subject || '-'}</td>
                                            <td>{getSlot('09.45-10.20')?.subject || '-'}</td>
                                            <td>{getSlot('10.20-11.00')?.subject || '-'}</td>
                                            <td>{getSlot('11.15-11.50')?.subject || '-'}</td>
                                            <td>{getSlot('11.50-12.30')?.subject || '-'}</td>
                                            <td>{getSlot('01.00-01.45')?.subject || '-'}</td>
                                            <td>{getSlot('01.45-02.20')?.subject || '-'}</td>
                                            <td>{getSlot('02.20-02.40')?.subject || '-'}</td>
                                            <td>{getSlot('02.50-03.30')?.subject || '-'}</td>
                                            <td>{getSlot('03.30-04.10')?.subject || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}