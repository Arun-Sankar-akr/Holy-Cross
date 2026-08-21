import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

// Auth Protection Wrapper
import ProtectedRoute from './Erp/StaffErp/ProtectedRoute';
import StdProtectedRoute from './Erp/StudentErp/StdProtectedRoute'

import Preloader from './components/Preloader';

// Header & Footer
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';

import OfficeLogin from './admin/OfficeErp/OfficeLogin';
import OfficeDashboard from './admin/OfficeErp/OfficeDashboard';
import OfficeProtectedRoute from './admin/OfficeErp/OfficeProtectedRoute';

// Pages & Sections
import Calendar from './pages/AcademicCalendar';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Holiday from './pages/HolidayList';
import SchoolSections from './pages/SchoolSections';
import ExamToppers from './pages/ExamToppers';

// Services
import ServiceLibrary from './pages/ServiceLibrary';
import ServiceTransport from './pages/ServiceTransport';
import ServiceHostel from './pages/ServiceHostel';

// About & Governance
import Administrators from './pages/Administrators';
import RulesRegulations from './pages/RulesRegulations';
import PupilStrength from './pages/PupilStrength';

// Alumni Pages
import AlumniRegistration from './pages/Alumni/AlumniRegistration';
import NotableAlumni from './pages/Alumni/NotableAlumni';
import AlumniMeets from './pages/Alumni/AlumniMeets';

// Staff Public Pages
import TeachingStaff from './pages/Staff/TeachingStaff';
import NonTeachingStaff from './pages/Staff/NonTeachingStaff';
import StaffCommittees from './pages/Staff/StaffCommittees';

// Admission Pages
import AdmissionDashboard from './pages/Admission/AdmissionDashboard';

// ERP & Dashboards
import StaffErp from './Erp/StaffErp/StaffErp';
import StudentErp from './Erp/StudentErp/StudentErp';

import StaffDashboard from './Erp/StaffErp/StaffDashboard';
import StudentDashboard from './Erp/StudentErp/StudentDashboard';
import ProgressReport from "./Erp/ProgressReport";

import './App.css';

function AppContent({ loading, fadeOut }) {
  const location = useLocation();
  const lenisRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/erp/staff/dashboard');
  const isOfficeRoute = location.pathname.startsWith('/erp/office/dashboard');

  // Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Scroll to top smoothly via Lenis on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: false });
    }
  }, [location.pathname]);

  return (
    <>
      {loading && <Preloader fadeOut={fadeOut} />}

      <div className="app-container">
        {/* Navbar stays across all routes */}
        <Navbar />

        <main className="main-content">
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/school/:pageId" element={<SchoolSections />} />
            <Route path="/school/progress-report" element={<ProgressReport />} />
            <Route path="/school/calendar" element={<Calendar />} />
            <Route path="/school/holiday" element={<Holiday />} />
            <Route path="/school/toppers" element={<ExamToppers />} />

            {/* School Services */}
            <Route path="/school/service-library" element={<ServiceLibrary />} />
            <Route path="/school/service-transport" element={<ServiceTransport />} />
            <Route path="/school/service-hostel" element={<ServiceHostel />} />

            {/* Governance & Rules */}
            <Route path="/school/administrators" element={<Administrators />} />
            <Route path="/school/rules" element={<RulesRegulations />} />
            <Route path="/school/pupil-strength" element={<PupilStrength />} />

            {/* Alumni Network */}
            <Route path="/alumni/registration" element={<AlumniRegistration />} />
            <Route path="/alumni/notable" element={<NotableAlumni />} />
            <Route path="/alumni/meets" element={<AlumniMeets />} />

            {/* Staff Information */}
            <Route path="/staffs/teaching" element={<TeachingStaff />} />
            <Route path="/staffs/non-teaching" element={<NonTeachingStaff />} />
            <Route path="/staffs/committees" element={<StaffCommittees />} />

            {/* Admissions */}
            <Route path="/admissions" element={<AdmissionDashboard />} />

            {/* ERP Login Routes - Correctly mapped */}
            <Route path="/erp/staff" element={<StaffErp />} />
            <Route path="/erp/student" element={<StudentErp />} />

            {/* Protected Staff Dashboard Route */}
            <Route
              path="/erp/staff/dashboard"
              element={
                <ProtectedRoute storageKey="staffUser" redirectPath="/erp/staff">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Student Dashboard Route */}
            <Route
              path="/erp/student/dashboard"
              element={
                <StdProtectedRoute storageKey="studentUser" redirectPath="/erp/student">
                  <StudentDashboard />
                </StdProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Office ERP Routes */}
            <Route path="/erp/office/login" element={<OfficeLogin />} />
            <Route
              path="/erp/office/dashboard"
              element={
                <OfficeProtectedRoute>
                  <OfficeDashboard />
                </OfficeProtectedRoute>
              }
            />

            {/* Fallback Catch-All Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Render Footer only on non-admin routes */}
        {!isAdminRoute && !isStaffRoute && !isOfficeRoute && <Footer />}
      </div>
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <BrowserRouter>
      <AppContent loading={loading} fadeOut={fadeOut} />
    </BrowserRouter>
  );
}