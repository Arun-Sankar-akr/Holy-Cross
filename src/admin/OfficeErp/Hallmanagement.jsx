import React, { useState } from 'react';
import { db } from '../../service/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
    Building2, Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, MapPin
} from 'lucide-react';

const norm = (v) => String(v || '').trim().toLowerCase();
const EMPTY_FORM = { hallNo: '', blockName: '', location: '', capacity: '', status: 'Available' };
// "Block A, 2nd floor" style text built from the hall's block name and location
const placeOf = (h) => [h?.blockName, h?.location].map(v => String(v || '').trim()).filter(Boolean).join(', ');

/**
 * Hall Management
 * Master list of exam halls (name, block, location, number of seats, status).
 * The Allocate section reads this list, so seat capacity and free seats stay in sync.
 *
 * Props (all data comes from OfficeDashboard's live Firestore listeners):
 *  - halls        exam_hall_master docs
 *  - allocations  exam_hall_allocations docs
 *  - duties       staff_exam_halls docs
 *  - examTypes    list of exam names
 *  - getSeatList  (allocation) => [{ id, name, admissionNo, seatNo }]
 *  - allocInHall  (allocation, hall) => boolean
 *  - onOpenAllocate () => void   jump to the Allocate section
 */
export default function HallManagement({ halls, allocations, duties, examTypes, getSeatList, allocInHall, onOpenAllocate }) {
    const [search, setSearch] = useState('');
    const [exam, setExam] = useState(examTypes[0] || '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [openMaps, setOpenMaps] = useState({});
    const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit', hall? }
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const examOf = (a) => a.examName || 'Examination';

    // ---------- derived data ----------
    const usageFor = (hall) => {
        const allocs = allocations.filter(a => allocInHall(a, hall));
        const forExam = allocs.filter(a => examOf(a) === exam);
        const seats = forExam.flatMap(a => getSeatList(a));
        const used = seats.length;
        const cap = Number(hall.capacity || 0);
        const maxSeatEver = Math.max(0, ...allocs.flatMap(a => getSeatList(a).map(s => Number(s.seatNo || 0))));
        return { allocs, forExam, seats, used, cap, free: Math.max(cap - used, 0), maxSeatEver };
    };

    const q = search.trim().toLowerCase();
    const visible = halls
        .filter(h => !q || [h.hallNo, h.blockName, h.location, h.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
        .slice()
        .sort((a, b) => String(a.hallNo).localeCompare(String(b.hallNo), undefined, { numeric: true }));

    const sel = selectedIds.filter(id => halls.some(h => h.id === id));

    const activeHalls = halls.filter(h => h.status !== 'Maintenance');
    const totalSeats = activeHalls.reduce((n, h) => n + Number(h.capacity || 0), 0);
    const seatedNow = halls.reduce((n, h) => n + usageFor(h).used, 0);

    // allocations that point at a hall name which is not in the master list yet
    const legacyGroups = (() => {
        const groups = {};
        allocations.forEach(a => {
            if (!norm(a.hallNo) && !a.hallId) return;
            if (halls.some(h => allocInHall(a, h))) return;
            const key = norm(a.hallNo);
            if (!key) return;
            if (!groups[key]) groups[key] = { hallNo: String(a.hallNo).trim(), allocs: [] };
            groups[key].allocs.push(a);
        });
        return Object.values(groups);
    })();

    // ---------- create / update ----------
    const openAdd = () => { setForm(EMPTY_FORM); setError(''); setModal({ mode: 'add' }); };
    const openEdit = (hall) => {
        setForm({ hallNo: hall.hallNo || '', blockName: hall.blockName || '', location: hall.location || '', capacity: String(hall.capacity || ''), status: hall.status || 'Available' });
        setError('');
        setModal({ mode: 'edit', hall });
    };

    const saveHall = async (e) => {
        e.preventDefault();
        const hallNo = form.hallNo.trim();
        const capacity = Math.floor(Number(form.capacity));
        if (!hallNo) return setError('Enter a hall name or number.');
        if (!capacity || capacity < 1) return setError('Number of seats must be at least 1.');
        if (halls.some(h => norm(h.hallNo) === norm(hallNo) && h.id !== modal.hall?.id)) {
            return setError(`A hall named "${hallNo}" already exists.`);
        }

        setBusy(true);
        try {
            const data = { hallNo, blockName: form.blockName.trim(), location: form.location.trim(), capacity, status: form.status };
            if (modal.mode === 'add') {
                await addDoc(collection(db, 'exam_hall_master'), { ...data, createdAt: serverTimestamp() });
            } else {
                const hall = modal.hall;
                const { allocs, maxSeatEver } = usageFor(hall);
                if (capacity < maxSeatEver) {
                    setBusy(false);
                    return setError(`Students are already seated up to seat ${maxSeatEver}. Remove or move them before reducing seats below that.`);
                }
                await updateDoc(doc(db, 'exam_hall_master', hall.id), { ...data, updatedAt: serverTimestamp() });
                // keep allocations + staff duties for this hall in sync
                const allocIds = allocs.map(a => a.id);
                await Promise.all([
                    ...allocs.map(a => updateDoc(doc(db, 'exam_hall_allocations', a.id), { hallId: hall.id, hallNo, capacity, blockName: data.blockName, location: data.location })),
                    ...duties.filter(d => allocIds.includes(d.hallAllocationId))
                        .map(d => updateDoc(doc(db, 'staff_exam_halls', d.id), { hallNo }))
                ]);
            }
            setModal(null);
        } catch (err) {
            console.error('Error saving hall:', err);
            setError('Could not save the hall. Please try again.');
        }
        setBusy(false);
    };

    // ---------- delete (single + bulk) ----------
    const deleteHalls = async (ids) => {
        const targets = halls.filter(h => ids.includes(h.id));
        const inUse = targets.filter(h => usageFor(h).allocs.length > 0);
        const free = targets.filter(h => usageFor(h).allocs.length === 0);
        if (free.length === 0) {
            alert(inUse.length === 1
                ? `${inUse[0].hallNo} has students allocated to it. Remove those allocations first.`
                : 'These halls all have students allocated to them. Remove those allocations first.');
            return;
        }
        const msg = `Delete ${free.length} hall${free.length > 1 ? 's' : ''}?` +
            (inUse.length ? `\n${inUse.length} hall${inUse.length > 1 ? 's' : ''} with allocations will be skipped.` : '');
        if (!window.confirm(msg)) return;
        try {
            await Promise.all(free.map(h => deleteDoc(doc(db, 'exam_hall_master', h.id))));
            setSelectedIds(prev => prev.filter(id => !free.some(h => h.id === id)));
        } catch (err) {
            console.error('Error deleting halls:', err);
            alert('Failed to delete the selected halls.');
        }
    };

    // ---------- import halls already used in allocations ----------
    const importLegacy = async () => {
        setBusy(true);
        try {
            for (const g of legacyGroups) {
                const perExam = {};
                g.allocs.forEach(a => { perExam[examOf(a)] = (perExam[examOf(a)] || 0) + getSeatList(a).length; });
                const maxSeat = Math.max(0, ...g.allocs.flatMap(a => getSeatList(a).map(s => Number(s.seatNo || 0))));
                const capacity = Math.max(1, maxSeat, ...Object.values(perExam), ...g.allocs.map(a => Number(a.capacity || 0)));
                const ref = await addDoc(collection(db, 'exam_hall_master'), {
                    hallNo: g.hallNo, blockName: '', location: '', capacity, status: 'Available', createdAt: serverTimestamp()
                });
                await Promise.all(g.allocs.map(a => updateDoc(doc(db, 'exam_hall_allocations', a.id), { hallId: ref.id, capacity })));
            }
        } catch (err) {
            console.error('Error importing halls:', err);
            alert('Could not import the halls.');
        }
        setBusy(false);
    };

    return (
        <div className="alloc-page hm-page">
            {/* Header */}
            <div className="dash-card full-width alloc-hero">
                <div>
                    <span className="alloc-kicker">EXAMINATION MANAGEMENT</span>
                    <h3>Hall Management</h3>
                    <p className="subtitle">Add exam halls and set their seating. Allocate uses this list, so seats never overflow.</p>
                </div>
                <div className="alloc-hero-stats">
                    <div><strong>{halls.length}</strong><span>Halls</span></div>
                    <div><strong>{totalSeats}</strong><span>Seats</span></div>
                    <div><strong>{seatedNow}</strong><span>Seated</span></div>
                    <div><strong>{Math.max(totalSeats - seatedNow, 0)}</strong><span>Free</span></div>
                </div>
            </div>

            {legacyGroups.length > 0 && (
                <div className="hm-banner">
                    <AlertTriangle size={18} />
                    <div>
                        <strong>{legacyGroups.length} hall{legacyGroups.length > 1 ? 's are' : ' is'} used in allocations but not listed here</strong>
                        <small>{legacyGroups.map(g => g.hallNo).join(', ')}</small>
                    </div>
                    <button type="button" className="alloc-btn hm-banner-btn" disabled={busy} onClick={importLegacy}>Add to Hall Management</button>
                </div>
            )}

            <style>{`.hm-place{display:inline-flex;align-items:center;gap:4px}.hm-place svg{flex:0 0 auto}`}</style>
            <div className="dash-card">
                {/* Toolbar */}
                <div className="alloc-records-bar hm-toolbar">
                    <div className="alloc-search">
                        <Search size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hall, block, location or status" />
                    </div>
                    <select className="hm-exam-select" value={exam} onChange={e => setExam(e.target.value)} title="Seat usage is shown for this exam">
                        {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <label className="alloc-check-all">
                        <input type="checkbox" checked={visible.length > 0 && visible.every(h => sel.includes(h.id))} onChange={() => {
                            const ids = visible.map(h => h.id);
                            const all = ids.length > 0 && ids.every(id => sel.includes(id));
                            setSelectedIds(prev => all ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
                        }} />
                        Select all
                    </label>
                    {sel.length > 0 && (
                        <>
                            <span className="alloc-count-pill">{sel.length} selected</span>
                            <button type="button" className="alloc-danger-btn" onClick={() => deleteHalls(sel)}><Trash2 size={15} /> Delete selected</button>
                        </>
                    )}
                    <button type="button" className="alloc-btn hm-add-btn" onClick={openAdd}><Plus size={16} /> Add hall</button>
                </div>

                {/* Hall cards */}
                {halls.length === 0 ? (
                    <div className="exam-empty-state"><Building2 size={22} /><span>No halls yet. Click “Add hall” to create your first exam hall.</span></div>
                ) : visible.length === 0 ? (
                    <div className="exam-empty-state"><Search size={22} /><span>No halls match your search.</span></div>
                ) : (
                    <div className="hm-grid">
                        {visible.map(hall => {
                            const u = usageFor(hall);
                            const pct = u.cap ? Math.min(100, Math.round((u.used / u.cap) * 100)) : 0;
                            const level = pct >= 100 ? 'full' : pct >= 75 ? 'high' : 'ok';
                            const open = !!openMaps[hall.id];
                            const seatMap = new Map(u.seats.map(s => [Number(s.seatNo), s]));
                            const maintenance = hall.status === 'Maintenance';
                            return (
                                <div key={hall.id} className={`hm-card ${sel.includes(hall.id) ? 'selected' : ''} ${maintenance ? 'off' : ''}`}>
                                    <div className="hm-card-top">
                                        <input type="checkbox" className="alloc-cb" checked={sel.includes(hall.id)} onChange={() => setSelectedIds(prev => prev.includes(hall.id) ? prev.filter(id => id !== hall.id) : [...prev, hall.id])} />
                                        <span className="hm-card-icon"><Building2 size={18} /></span>
                                        <div className="hm-card-title">
                                            <strong>{hall.hallNo}</strong>
                                            <small className="hm-place">
                                                <MapPin size={12} />
                                                {placeOf(hall) || 'No block / location set'}
                                            </small>
                                        </div>
                                        <span className={`alloc-tag ${maintenance ? 'warn' : 'ok'}`}>{maintenance ? 'Maintenance' : 'Available'}</span>
                                    </div>

                                    <div className="hm-seats">
                                        <strong>{u.cap}</strong><span>seats</span>
                                        <em className={level}>{u.free} free · {u.used} used</em>
                                    </div>
                                    <div className="hm-bar"><i className={level} style={{ width: `${pct}%` }} /></div>
                                    <div className="hm-meta">
                                        {u.forExam.length} allocation{u.forExam.length === 1 ? '' : 's'} for this exam
                                        {u.forExam.length > 0 && <> · {[...new Set(u.forExam.map(a => `${a.targetClass || ''}${a.targetSection ? '/' + a.targetSection : ''}`))].join(', ')}</>}
                                    </div>

                                    <div className="hm-card-foot">
                                        <button type="button" className="hm-link" onClick={() => setOpenMaps(prev => ({ ...prev, [hall.id]: !prev[hall.id] }))}>
                                            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Seat map
                                        </button>
                                        <div className="alloc-actions">
                                            <button type="button" className="alloc-icon-btn" title="Edit" onClick={() => openEdit(hall)}><Pencil size={14} /></button>
                                            <button type="button" className="alloc-icon-btn danger" title="Delete" onClick={() => deleteHalls([hall.id])}><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    {open && (
                                        <div className="hm-seatmap">
                                            {Array.from({ length: Math.min(u.cap, 300) }, (_, i) => {
                                                const n = i + 1;
                                                const st = seatMap.get(n);
                                                return <span key={n} className={`hm-seat ${st ? 'taken' : ''}`} title={st ? `Seat ${n} · ${st.name}` : `Seat ${n} · free`}>{n}</span>;
                                            })}
                                            {u.cap > 300 && <small className="alloc-hint">Showing the first 300 seats.</small>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {halls.length > 0 && (
                    <div className="hm-foot-note">
                        <CheckCircle size={14} /> Seat usage is for <b>{exam}</b>. <button type="button" className="hm-link" onClick={onOpenAllocate}>Go to Allocate →</button>
                    </div>
                )}
            </div>

            {/* Add / Edit modal */}
            {modal && (
                <div className="alloc-modal-backdrop" onClick={() => setModal(null)}>
                    <form className="alloc-modal small" onClick={e => e.stopPropagation()} onSubmit={saveHall}>
                        <div className="alloc-modal-head">
                            <div><h4>{modal.mode === 'add' ? 'Add hall' : 'Edit hall'}</h4><small>{modal.mode === 'add' ? 'Create a new exam hall' : modal.hall.hallNo}</small></div>
                            <button type="button" className="alloc-icon-btn" onClick={() => setModal(null)}><X size={16} /></button>
                        </div>
                        <div className="alloc-modal-body">
                            <div className="alloc-field">
                                <label>Hall name / number</label>
                                <input value={form.hallNo} onChange={e => setForm(f => ({ ...f, hallNo: e.target.value }))} placeholder="e.g. Hall 101" autoFocus required />
                            </div>
                            <div className="hm-form-row">
                                <div className="alloc-field">
                                    <label>Block name <em>(optional)</em></label>
                                    <input value={form.blockName} onChange={e => setForm(f => ({ ...f, blockName: e.target.value }))} placeholder="e.g. Block A" />
                                </div>
                                <div className="alloc-field">
                                    <label>Location <em>(optional)</em></label>
                                    <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. 2nd floor, east wing" />
                                </div>
                            </div>
                            <div className="hm-form-row">
                                <div className="alloc-field">
                                    <label>Number of seats</label>
                                    <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 40" required />
                                </div>
                                <div className="alloc-field">
                                    <label>Status</label>
                                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="Available">Available</option>
                                        <option value="Maintenance">Under maintenance</option>
                                    </select>
                                </div>
                            </div>
                            {form.status === 'Maintenance' && <p className="alloc-hint">Halls under maintenance can’t be picked in Allocate. Existing allocations stay as they are.</p>}
                            {error && <div className="alloc-warning">{error}</div>}
                        </div>
                        <div className="alloc-modal-foot">
                            <button type="button" className="alloc-ghost-btn" onClick={() => setModal(null)}>Cancel</button>
                            <button type="submit" className="alloc-btn" style={{ width: 'auto', padding: '0 22px' }} disabled={busy}>{modal.mode === 'add' ? 'Add hall' : 'Save changes'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}