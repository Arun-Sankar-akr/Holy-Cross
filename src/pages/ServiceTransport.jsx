// ServiceTransport.jsx
import React from 'react';
import { Bus, MapPin, ShieldCheck, Phone } from 'lucide-react';
import './ServiceTransport.css';

export default function ServiceTransport() {
    const routes = [
        { routeNo: 'Route 1', destination: 'Chatram Bus Stand – Somarasampettai', driver: 'M. Ramesh', phone: '+91 98765 43210' },
        { routeNo: 'Route 2', destination: 'Thillai Nagar – Campus Gate', driver: 'K. Sundaram', phone: '+91 98765 43211' },
        { routeNo: 'Route 3', destination: 'KK Nagar – Cantonment – Campus', driver: 'S. Anthony', phone: '+91 98765 43212' },
        { routeNo: 'Route 4', destination: 'Srirangam – Campus', driver: 'P. Murugan', phone: '+91 98765 43213' },
    ];

    return (
        <div className="amenity-container">
            <div className="page-header">
                <h2><Bus size={28} /> Transport Services</h2>
                <p>Safe, reliable, and fleet-tracked commuting solutions for students and staff</p>
            </div>

            <div className="transport-highlights">
                <div className="highlight-box">
                    <ShieldCheck size={24} />
                    <h4>GPS & Speed Governors</h4>
                    <p>All buses are equipped with live GPS tracking and mandatory speed governors.</p>
                </div>
                <div className="highlight-box">
                    <ShieldCheck size={24} />
                    <h4>Trained Attendants</h4>
                    <p>Female bus attendants present on every route for enhanced student safety.</p>
                </div>
            </div>

            <div className="amenity-card">
                <h3>Bus Routes & In-Charge Contact</h3>
                <div className="table-responsive">
                    <table className="routes-table">
                        <thead>
                            <tr>
                                <th>Route No</th>
                                <th>Coverage / Destination</th>
                                <th>Driver Name</th>
                                <th>Contact Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.map((r, i) => (
                                <tr key={i}>
                                    <td className="route-badge">{r.routeNo}</td>
                                    <td><MapPin size={14} className="icon-purple" /> {r.destination}</td>
                                    <td>{r.driver}</td>
                                    <td><Phone size={14} className="icon-purple" /> {r.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}