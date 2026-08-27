import React from 'react';
import { Bus, MapPin, ShieldCheck, Phone, Route } from 'lucide-react';
import './ServiceTransport.css';

import transportHero from '../assets/bg1.jpg';
import transportFleet from '../assets/bg1.jpg';

export default function ServiceTransport() {
    const routes = [
        { routeNo: 'Route 1', destination: 'Chatram Bus Stand – Somarasampettai', driver: 'M. Ramesh', phone: '+91 98765 43210' },
        { routeNo: 'Route 2', destination: 'Thillai Nagar – Campus Gate', driver: 'K. Sundaram', phone: '+91 98765 43211' },
        { routeNo: 'Route 3', destination: 'KK Nagar – Cantonment – Campus', driver: 'S. Anthony', phone: '+91 98765 43212' },
        { routeNo: 'Route 4', destination: 'Srirangam – Campus', driver: 'P. Murugan', phone: '+91 98765 43213' },
    ];

    return (
        <div className="transport-page">
            <section className="transport-hero" style={{ backgroundImage: `url(${transportHero})` }}>
                <div className="transport-hero-content">
                    <div className="transport-eyebrow"><Route size={14} /> Campus Mobility</div>
                    <h2><Bus size={34} /> Transport Services</h2>
                    <p>Safe, reliable, and fleet-tracked commuting solutions for students and staff.</p>
                </div>
            </section>

            <section className="transport-highlights">
                <article className="transport-highlight">
                    <div className="transport-icon"><ShieldCheck size={21} /></div>
                    <h4>GPS & Speed Governors</h4>
                    <p>All buses are equipped with live GPS tracking and mandatory speed governors.</p>
                </article>

                <article className="transport-highlight">
                    <div className="transport-icon"><ShieldCheck size={21} /></div>
                    <h4>Trained Attendants</h4>
                    <p>Female bus attendants present on every route for enhanced student safety.</p>
                </article>

                <div className="transport-fleet">
                    <img src={transportFleet} alt="School bus fleet" />
                </div>
            </section>

            <section className="transport-route-card">
                <div className="transport-route-header">
                    <h3>Bus Routes & In-Charge Contact</h3>
                    <span className="transport-route-label">{routes.length} Active Routes</span>
                </div>

                <div className="transport-table-wrap">
                    <table className="transport-table">
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Coverage / Destination</th>
                                <th>Driver Name</th>
                                <th>Contact Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.map((r, i) => (
                                <tr key={i}>
                                    <td><span className="route-badge">{r.routeNo}</span></td>
                                    <td><span className="transport-location"><MapPin size={15} />{r.destination}</span></td>
                                    <td>{r.driver}</td>
                                    <td><span className="transport-phone"><Phone size={15} />{r.phone}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
