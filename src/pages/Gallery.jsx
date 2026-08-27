import React, { useState, useEffect } from 'react';
import { X, ZoomIn, Folder, Images, ChevronRight, ArrowLeft } from 'lucide-react';
import { db } from '../service/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './Gallery.css';

export default function Gallery() {
    const [galleryData, setGalleryData] = useState([]);
    const [galleryFolderRecords, setGalleryFolderRecords] = useState([]);
    const [currentPath, setCurrentPath] = useState(''); // '' = Albums home
    const [activeImage, setActiveImage] = useState(null);

    useEffect(() => {
        const unsubscribeGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGalleryData(data);
        });
        const unsubscribeFolders = onSnapshot(collection(db, 'galleryFolders'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGalleryFolderRecords(data);
        });
        return () => {
            unsubscribeGallery();
            unsubscribeFolders();
        };
    }, []);

    // Resolves the full folder path a photo lives in, e.g. "Campus/Day 1".
    // Falls back to the older folder/subfolder/category fields so existing photos keep working.
    const getItemPath = (item) => {
        if (item.folderPath) return item.folderPath;
        const legacyFolder = item.folder || item.category || '';
        const legacySubfolder = (item.subfolder || '').trim();
        if (legacyFolder && legacySubfolder) return `${legacyFolder}/${legacySubfolder}`;
        return legacyFolder || 'Uncategorized';
    };

    // If fullPath sits directly inside basePath, returns that immediate child folder name; otherwise null.
    const getChildFolderName = (fullPath, basePath) => {
        const prefix = basePath ? `${basePath}/` : '';
        if (basePath) {
            if (!fullPath.startsWith(prefix)) return null;
        } else if (!fullPath) {
            return null;
        }
        const remainder = basePath ? fullPath.slice(prefix.length) : fullPath;
        if (!remainder) return null;
        return remainder.split('/')[0];
    };

    const childFolderNames = Array.from(new Set([
        ...galleryData.map(item => getChildFolderName(getItemPath(item), currentPath)).filter(Boolean),
        ...galleryFolderRecords.map(rec => getChildFolderName(rec.path, currentPath)).filter(Boolean)
    ])).sort((a, b) => a.localeCompare(b));

    const itemsHere = galleryData.filter(item => getItemPath(item) === currentPath);

    const getFolderPreview = (fullPath) => {
        const itemsInside = galleryData.filter(item => {
            const p = getItemPath(item);
            return p === fullPath || p.startsWith(`${fullPath}/`);
        });
        return { count: itemsInside.length, cover: itemsInside[0] };
    };

    const pathSegments = currentPath ? currentPath.split('/') : [];
    const breadcrumbCrumbs = pathSegments.map((segment, idx) => ({
        label: segment,
        path: pathSegments.slice(0, idx + 1).join('/')
    }));

    const isEmptyOverall = galleryData.length === 0 && galleryFolderRecords.length === 0;

    return (
        <div className="gal-root">
            <header className="gal-header">
                <span className="gal-badge"><Images size={14} /> Campus Life in Pictures</span>
                <h2>Life at Holy Cross</h2>
                <p>Browse through our photo albums — academic excellence, athletic achievements, and vibrant campus events.</p>
            </header>

            {isEmptyOverall ? (
                <p className="gal-empty-msg">No images published yet.</p>
            ) : (
                <>
                    <nav className="gal-breadcrumbs">
                        <button
                            type="button"
                            className={`gal-crumb ${!currentPath ? 'active' : ''}`}
                            onClick={() => setCurrentPath('')}
                        >
                            <Images size={14} /> Albums
                        </button>
                        {breadcrumbCrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb.path}>
                                <ChevronRight size={13} className="gal-crumb-sep" />
                                <button
                                    type="button"
                                    className={`gal-crumb ${idx === breadcrumbCrumbs.length - 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPath(crumb.path)}
                                >
                                    {crumb.label}
                                </button>
                            </React.Fragment>
                        ))}
                    </nav>

                    {currentPath && (
                        <button
                            type="button"
                            className="gal-back-btn"
                            onClick={() => setCurrentPath(pathSegments.slice(0, -1).join('/'))}
                        >
                            <ArrowLeft size={15} /> Back
                        </button>
                    )}

                    {childFolderNames.length > 0 && (
                        <div className="gal-album-grid">
                            {childFolderNames.map(name => {
                                const fullPath = currentPath ? `${currentPath}/${name}` : name;
                                const { count, cover } = getFolderPreview(fullPath);
                                return (
                                    <div
                                        key={fullPath}
                                        className="gal-album-card"
                                        onClick={() => setCurrentPath(fullPath)}
                                    >
                                        <div className="gal-album-cover">
                                            {cover?.image ? (
                                                <img src={cover.image} alt={name} loading="lazy" />
                                            ) : (
                                                <div className="gal-album-cover-placeholder"><Folder size={34} /></div>
                                            )}
                                            <span className="gal-album-count">{count} photo{count === 1 ? '' : 's'}</span>
                                        </div>
                                        <div className="gal-album-label">
                                            <Folder size={15} />
                                            <span>{name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {itemsHere.length > 0 && (
                        <>
                            {childFolderNames.length > 0 && (
                                <h4 className="gal-subheading">Photos in this album</h4>
                            )}
                            <div className="gal-grid">
                                {itemsHere.map((item) => (
                                    <div key={item.id} className="gal-card" onClick={() => setActiveImage(item)}>
                                        <div className="gal-image-wrapper">
                                            <img src={item.image} alt={item.title} loading="lazy" />
                                            <div className="gal-overlay">
                                                <ZoomIn size={28} className="gal-zoom-icon" />
                                                <span className="gal-card-category">{currentPath || 'Gallery'}</span>
                                            </div>
                                        </div>
                                        <div className="gal-card-info">
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {childFolderNames.length === 0 && itemsHere.length === 0 && (
                        <p className="gal-empty-msg">No photos in this album yet.</p>
                    )}
                </>
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
                            <span className="gal-card-category">{currentPath || 'Gallery'}</span>
                            <h3>{activeImage.title}</h3>
                            <p>{activeImage.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}