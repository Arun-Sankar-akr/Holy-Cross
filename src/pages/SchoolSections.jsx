import React from 'react';
import {
    Calendar as CalendarIcon,
    Bell,
    Award,
    Users,
    FileText,
    Briefcase,
    BookOpen,
    Vote,
    Clock,
    CheckCircle2
} from 'lucide-react';
import './SchoolSections.css';

export default function SchoolSections({ pageId }) {
    // Content dictionary for all navigation destinations under 'School'
    const sectionData = {
        calendar: {
            title: "Academic Calendar 2026–2027",
            subtitle: "Schedule of academic terms, examination dates, and key events.",
            icon: CalendarIcon,
            type: "timeline",
            items: [
                { date: "15-JUN-2026", title: "Reopening for Academic Year 2026-27", category: "Academic" },
                { date: "10-AUG-2026", title: "First Unit Test Commences", category: "Exam" },
                { date: "24-OCT-2026", title: "Quarterly Examinations Begin", category: "Exam" },
                { date: "23-DEC-2026", title: "Christmas & Winter Holidays Start", category: "Holiday" }
            ]
        },
        notices: {
            title: "Notice Board",
            subtitle: "Official circulars and announcements from the school administration.",
            icon: Bell,
            type: "notices",
            items: [
                { date: "12-AUG-2026", title: "Independence Day Parade Practice", description: "All House Captains and sports council members are requested to report by 8:00 AM." },
                { date: "05-AUG-2026", title: "Parent-Teacher Meeting for Class X & XII", description: "PTM is scheduled for Saturday between 9:00 AM and 1:00 PM." },
                { date: "28-JUL-2026", title: "Uniform & Discipline Inspection", description: "Strict adherence to the formal school uniform guidelines is mandatory." }
            ]
        },
        'news-awards': {
            title: "News & Awards",
            subtitle: "Celebrating academic achievements, sports victories, and institutional honors.",
            icon: Award,
            type: "cards",
            items: [
                { title: "State Rank in Science Olympiad", detail: "Master R. Kavin secured State 1st Rank in the National Science Talent Contest." },
                { title: "District Level Basketball Champions", detail: "Under-17 Boys squad won the Zonal Championship trophy for 2026." },
                { title: "Best Eco-Friendly Campus Award", detail: "Recognized by Tamil Nadu Green Movement for campus sustainability." }
            ]
        },
        'pupil-strength': {
            title: "School Pupil Strength",
            subtitle: "Current enrollment demographic breakdown across grade sections.",
            icon: Users,
            type: "table",
            headers: ["Grade / Section", "Boys", "Girls", "Total Students"],
            rows: [
                ["Kindergarten (LKG & UKG)", "142", "138", "280"],
                ["Primary (Std I - V)", "310", "295", "605"],
                ["Middle School (Std VI - VIII)", "260", "248", "508"],
                ["High School (Std IX & X)", "185", "172", "357"],
                ["Higher Secondary (Std XI & XII)", "160", "154", "314"]
            ]
        },
        rules: {
            title: "Rules and Regulations",
            subtitle: "Guidelines to maintain discipline, safety, and decorum on campus.",
            icon: FileText,
            type: "list",
            items: [
                "Punctuality: Students must arrive on campus before 8:40 AM.",
                "Attendance: Minimum 85% attendance is required for term exam eligibility.",
                "Electronic Devices: Smart phones, smartwatches, and gadgets are strictly prohibited.",
                "Dress Code: Standard school uniform with polished black shoes is mandatory daily."
            ]
        },
        administrators: {
            title: "School Administrators",
            subtitle: "Leadership team and administrative office contacts.",
            icon: Briefcase,
            type: "cards",
            items: [
                { title: "Rev. Fr. Principal", detail: "Overseeing academic administration, student discipline, and campus development." },
                { title: "Vice Principal", detail: "In charge of curriculum coordination, faculty management, and examinations." },
                { title: "Academic Coordinator", detail: "Supervising syllabus completion and parent-teacher communication." }
            ]
        },
        toppers: {
            title: "Public Exam Toppers",
            subtitle: "Honoring top scorers of Class X and XII Board Examinations.",
            icon: Award,
            type: "toppers",
            items: [
                { name: "S. Ananya", score: "492 / 500", standard: "Std XII Board Exam", year: "2025-26" },
                { name: "M. Vignesh", score: "489 / 500", standard: "Std XII Board Exam", year: "2025-26" },
                { name: "K. Deepa", score: "495 / 500", standard: "Std X Board Exam", year: "2025-26" }
            ]
        },
        'school-activities': {
            title: "School Activities",
            subtitle: "Co-curricular clubs, sports leagues, and cultural forums.",
            icon: BookOpen,
            type: "cards",
            items: [
                { title: "Robotics & STEM Club", detail: "Weekly hands-on coding and hardware workshops for classes VI-IX." },
                { title: "National Cadet Corps (NCC)", detail: "Regular parade drills, outdoor camps, and social service drives." },
                { title: "Eco & Green Movement Club", detail: "Organic gardening, tree plantation, and plastic-free awareness drives." }
            ]
        },
        'election-result': {
            title: "Student Election Results",
            subtitle: "Elected SPL, ASPL, and House Captains for Academic Year 2026–27.",
            icon: Vote,
            type: "table",
            headers: ["Designation", "Elected Candidate", "Grade", "House"],
            rows: [
                ["School People Leader (SPL)", "R. Karthik", "Std XII-A", "Blue House"],
                ["Assistant SPL (ASPL)", "P. Shreya", "Std XI-B", "Red House"],
                ["Sports Captain", "J. David", "Std XII-C", "Green House"],
                ["Cultural Secretary", "M. Harini", "Std XII-A", "Yellow House"]
            ]
        }
    };

    const current = sectionData[pageId] || {
        title: "Information Section",
        subtitle: "Official details and notices published by school administration.",
        icon: FileText,
        type: "list",
        items: ["Information for this section will be published shortly."]
    };

    const IconComponent = current.icon;

    return (
        <div className="section-page-container">
            {/* Top Banner Header */}
            <div className="section-header-banner">
                <div className="section-title-wrapper">
                    <div className="section-icon-badge">
                        <IconComponent size={26} />
                    </div>
                    <div>
                        <h2>{current.title}</h2>
                        <p>{current.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Content Rendering based on Section Type */}
            <div className="section-body">
                {/* 1. Timeline Layout */}
                {current.type === "timeline" && (
                    <div className="timeline-grid">
                        {current.items.map((item, idx) => (
                            <div key={idx} className="timeline-card">
                                <span className="timeline-tag">{item.category}</span>
                                <h4>{item.title}</h4>
                                <p className="timeline-date"><Clock size={14} /> {item.date}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Notice Board Layout */}
                {current.type === "notices" && (
                    <div className="notices-list">
                        {current.items.map((item, idx) => (
                            <div key={idx} className="notice-item-card">
                                <div className="notice-meta">
                                    <Bell size={16} />
                                    <span>{item.date}</span>
                                </div>
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. Cards Grid Layout */}
                {current.type === "cards" && (
                    <div className="cards-display-grid">
                        {current.items.map((item, idx) => (
                            <div key={idx} className="info-display-card">
                                <h4>{item.title}</h4>
                                <p>{item.detail}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Table Layout */}
                {current.type === "table" && (
                    <div className="table-responsive-wrapper">
                        <table className="modern-data-table">
                            <thead>
                                <tr>
                                    {current.headers.map((h, idx) => (
                                        <th key={idx}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {current.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 5. Toppers Cards */}
                {current.type === "toppers" && (
                    <div className="toppers-grid">
                        {current.items.map((item, idx) => (
                            <div key={idx} className="topper-card">
                                <Award className="topper-award-icon" size={32} />
                                <h3>{item.name}</h3>
                                <div className="score-badge">{item.score}</div>
                                <p className="topper-meta">{item.standard} ({item.year})</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* 6. Standard List */}
                {current.type === "list" && (
                    <ul className="rules-check-list">
                        {current.items.map((rule, idx) => (
                            <li key={idx}>
                                <CheckCircle2 className="check-icon" size={18} />
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}