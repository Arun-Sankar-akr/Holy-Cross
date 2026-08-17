import React, { useState } from 'react';
import { Download, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import './ProgressReport.css';

export default function ProgressReport() {
    const [rollNo, setRollNo] = useState('');
    const [dob, setDob] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [error, setError] = useState('');

    // Sample data for demonstration
    const mockDatabase = {
        "202601": {
            name: "Ananya Sharma",
            rollNo: "202601",
            class: "X - A",
            academicYear: "2025-2026",
            term: "Term II / Annual Exam",
            attendance: "96%",
            overallGrade: "A1",
            status: "Passed",
            subjects: [
                { name: "English", maxMarks: 100, marksObtained: 92, grade: "A1" },
                { name: "Mathematics", maxMarks: 100, marksObtained: 88, grade: "A2" },
                { name: "Science", maxMarks: 100, marksObtained: 95, grade: "A1" },
                { name: "Social Science", maxMarks: 100, marksObtained: 90, grade: "A1" },
                { name: "Language (Tamil)", maxMarks: 100, marksObtained: 85, grade: "A2" },
            ]
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setError('');

        if (!rollNo.trim()) {
            setError('Please enter a valid Roll Number or Admission Number.');
            return;
        }

        const foundStudent = mockDatabase[rollNo.trim()];
        if (foundStudent) {
            setStudentData(foundStudent);
        } else {
            setStudentData(null);
            setError('No progress report found for the entered credentials. Try Roll No: 202601');
        }
    };

    return (
        <div className="progress-report-container">
            {/* Header Banner */}
            <div className="report-header">
                <h2>Student Progress Report</h2>
                <p>View and download academic performance records</p>
            </div>

            {/* Portal Form */}
            <div className="search-card">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="input-group">
                        <label htmlFor="rollNo">Roll No / Admission No</label>
                        <input
                            type="text"
                            id="rollNo"
                            placeholder="e.g. 202601"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="dob">Date of Birth</label>
                        <input
                            type="date"
                            id="dob"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="search-btn">
                        <Search size={18} />
                        Fetch Report
                    </button>
                </form>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Student Result Details */}
            {studentData && (
                <div className="report-card">
                    <div className="report-card-header">
                        <div className="student-info">
                            <h3>{studentData.name}</h3>
                            <p><strong>Roll No:</strong> {studentData.rollNo} | <strong>Class:</strong> {studentData.class}</p>
                            <p><strong>Academic Year:</strong> {studentData.academicYear} | <strong>Term:</strong> {studentData.term}</p>
                        </div>
                        <div className="status-badge">
                            <CheckCircle2 size={18} />
                            <span>{studentData.status}</span>
                        </div>
                    </div>

                    {/* Marks Table */}
                    <div className="table-responsive">
                        <table className="marks-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Max Marks</th>
                                    <th>Marks Obtained</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentData.subjects.map((sub, index) => (
                                    <tr key={index}>
                                        <td>{sub.name}</td>
                                        <td>{sub.maxMarks}</td>
                                        <td>{sub.marksObtained}</td>
                                        <td><span className="grade-pill">{sub.grade}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary & Download Section */}
                    <div className="report-footer">
                        <div className="summary-stats">
                            <span><strong>Attendance:</strong> {studentData.attendance}</span>
                            <span><strong>Overall Grade:</strong> {studentData.overallGrade}</span>
                        </div>
                        <button className="download-btn" onClick={() => window.print()}>
                            <Download size={18} />
                            Download / Print PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}