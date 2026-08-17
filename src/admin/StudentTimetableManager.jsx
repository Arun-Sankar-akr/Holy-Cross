import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { BookOpen, Folder, ArrowLeft, PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import './Timetable.css';

const TIME_SLOTS = [
    { value: '09.00-09.45', label: '09.00 - 09.45' },
    { value: '09.45-10.20', label: '09.45 - 10.20' },
    { value: '10.20-11.00', label: '10.20 - 11.00' },
    { value: '11.15-11.50', label: '11.15 - 11.50' },
    { value: '11.50-12.30', label: '11.50 - 12.30' },
    { value: '01.00-01.45', label: '01.00 - 01.45' },
    { value: '01.45-02.20', label: '01.45 - 02.20' },
    { value: '02.20-02.40', label: '02.20 - 02.40' },
    { value: '02.50-03.30', label: '02.50 - 03.30' },
    { value: '03.30-04.10', label: '03.30 - 04.10' }
];

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

    // State for editing an existing slot
    const [editingSlot, setEditingSlot] = useState(null);

    const normalize = (str) => (str ? str.replace(/\s+/g, '').trim() : '');

    // 1. Fetch Class Sections
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'class_sections'), (snapshot) => {
            const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const uniqueClasses = [...new Set(sectionsData.map(s => s.className).filter(Boolean))];
            setSectionsList(sectionsData);
            setClassList(uniqueClasses);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Timetable Entries
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'timetables'), (snapshot) => {
            const timetableData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudentTimetables(timetableData);
        });
        return () => unsubscribe();
    }, []);

    // 3. Add Slot
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

            setStudentTimetableForm({
                day: 'Monday',
                timeSlot: '',
                subject: '',
                teacherName: '',
                roomNo: ''
            });
            alert('Timetable slot added successfully!');
        } catch (error) {
            console.error('Error saving slot:', error);
            alert('Failed to save slot.');
        }
    };

    // 4. Update Slot
    const handleUpdateSlot = async (e) => {
        e.preventDefault();
        if (!editingSlot) return;

        try {
            const slotRef = doc(db, 'timetables', editingSlot.id);
            await updateDoc(slotRef, {
                day: editingSlot.day,
                timeSlot: editingSlot.timeSlot,
                subject: editingSlot.subject,
                teacherName: editingSlot.teacherName || '',
                roomNo: editingSlot.roomNo || ''
            });
            setEditingSlot(null);
            alert('Slot updated successfully!');
        } catch (error) {
            console.error('Error updating slot:', error);
            alert('Failed to update slot.');
        }
    };

    // 5. Delete Slot
    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to delete this slot?')) return;

        try {
            await deleteDoc(doc(db, 'timetables', slotId));
            alert('Slot deleted successfully!');
        } catch (error) {
            console.error('Error deleting slot:', error);
            alert('Failed to delete slot.');
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
                            No sections found for {selectedClass}. Please create documents in <strong>class_sections</strong> first.
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

            {/* STEP 3: ADD, EDIT AND VIEW TIMETABLE */}
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

                    {/* Add Slot Form */}
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
                                    {TIME_SLOTS.map((slot) => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}
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
                    <div className="timetable-wrapper">
                        <div className="timetable-grid-layout">
                            <div className="grid-header day-corner">DAY</div>

                            {TIME_SLOTS.map((slot) => (
                                <div key={slot.value} className="grid-header time-slot">
                                    {slot.label}
                                </div>
                            ))}

                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                                const daySlots = studentTimetables.filter(
                                    t => t.className === selectedClass &&
                                        t.sectionName === selectedSection.name &&
                                        t.day === day
                                );

                                const getSlot = (slotTime) =>
                                    daySlots.find(s => normalize(s.timeSlot) === normalize(slotTime));

                                return (
                                    <React.Fragment key={day}>
                                        <div className="grid-day-label">{day}</div>

                                        {TIME_SLOTS.map((slot) => {
                                            const matchedSlot = getSlot(slot.value);
                                            return (
                                                <div key={slot.value} className="grid-cell">
                                                    {matchedSlot ? (
                                                        <div className="slot-info">
                                                            {/* Action buttons on hover */}
                                                            <div className="slot-actions">
                                                                <button
                                                                    className="slot-action-btn edit"
                                                                    onClick={() => setEditingSlot(matchedSlot)}
                                                                    title="Edit Slot"
                                                                >
                                                                    <Pencil size={11} />
                                                                </button>
                                                                <button
                                                                    className="slot-action-btn delete"
                                                                    onClick={() => handleDeleteSlot(matchedSlot.id)}
                                                                    title="Delete Slot"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                            <span className="subject-name">{matchedSlot.subject}</span>
                                                            {matchedSlot.teacherName && (
                                                                <span className="teacher-name">{matchedSlot.teacherName}</span>
                                                            )}
                                                            {matchedSlot.roomNo && (
                                                                <span className="room-no">Rm: {matchedSlot.roomNo}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="empty-dash">—</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Edit Modal */}
                    {editingSlot && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h4>Edit Timetable Slot</h4>
                                    <button className="close-btn" onClick={() => setEditingSlot(null)}>
                                        <X size={18} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateSlot} className="student-admission-form">
                                    <div className="student-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div>
                                            <label>Day</label>
                                            <select
                                                value={editingSlot.day}
                                                onChange={e => setEditingSlot({ ...editingSlot, day: e.target.value })}
                                                required
                                            >
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Time Slot</label>
                                            <select
                                                value={editingSlot.timeSlot}
                                                onChange={e => setEditingSlot({ ...editingSlot, timeSlot: e.target.value })}
                                                required
                                            >
                                                {TIME_SLOTS.map((slot) => (
                                                    <option key={slot.value} value={slot.value}>
                                                        {slot.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Subject</label>
                                            <input
                                                type="text"
                                                value={editingSlot.subject}
                                                onChange={e => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label>Teacher Name</label>
                                            <input
                                                type="text"
                                                value={editingSlot.teacherName}
                                                onChange={e => setEditingSlot({ ...editingSlot, teacherName: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label>Room No</label>
                                            <input
                                                type="text"
                                                value={editingSlot.roomNo}
                                                onChange={e => setEditingSlot({ ...editingSlot, roomNo: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="back-btn" onClick={() => setEditingSlot(null)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="add-notice-btn">
                                            Update Slot
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}