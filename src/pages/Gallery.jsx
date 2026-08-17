import React, { useState, useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './Gallery.css';

export default function Gallery() {
    const [galleryData, setGalleryData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeImage, setActiveImage] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGalleryData(data);
        });
        return () => unsubscribe();
    }, []);

    const categories = ['All', 'Campus', 'Events', 'Sports', 'Academics'];
    const filteredItems = selectedCategory === 'All'
        ? galleryData
        : galleryData.filter(item => item.category === selectedCategory);

    return (
        <div className="gal-root">
            <header className="gal-header">
                <span className="gal-badge">Campus Life in Pictures</span>
                <h2>Life at Holy Cross</h2>
                <p>Explore moments of academic excellence, athletic achievements, and vibrant cultural events.</p>

                <div className="gal-filter-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`gal-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {filteredItems.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>No images published in this category yet.</p>
            ) : (
                <div className="gal-grid">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="gal-card" onClick={() => setActiveImage(item)}>
                            <div className="gal-image-wrapper">
                                <img src={item.image} alt={item.title} loading="lazy" />
                                <div className="gal-overlay">
                                    <ZoomIn size={28} className="gal-zoom-icon" />
                                    <span className="gal-card-category">{item.category}</span>
                                </div>
                            </div>
                            <div className="gal-card-info">
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeImage && (
                <div className="gal-lightbox-overlay" onClick={() => setActiveImage(null)}>
                    <div className="gal-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="gal-lightbox-close" onClick={() => setActiveImage(null)}>
                            <X size={24} />
                        </button>
                        <div className="gal-lightbox-image-container">
                            <img src={activeImage.image} alt={activeImage.title} />
                        </div>
                        <div className="gal-lightbox-details">
                            <span className="gal-card-category">{activeImage.category}</span>
                            <h3>{activeImage.title}</h3>
                            <p>{activeImage.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}