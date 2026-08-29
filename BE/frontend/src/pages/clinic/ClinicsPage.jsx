import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { getAllClinics } from '../../features/clinic/services/clinicService';

import './ClinicsPage.css';

export default function ClinicsPage() {
    const [clinics, setClinics] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadClinics = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getAllClinics();
            setClinics(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading clinics:', err);
            setError(err.response?.data?.message || err.message || 'Could not load clinics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClinics();
    }, []);

    const filteredClinics = useMemo(() => {
        const term = search.trim().toLowerCase();

        return clinics
            .filter(clinic => {
                if (!term) return true;

                return (
                    clinic.name?.toLowerCase().includes(term) ||
                    clinic.city?.toLowerCase().includes(term) ||
                    clinic.address?.toLowerCase().includes(term)
                );
            })
            .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }, [clinics, search]);


    const displayRating = rating => {
        if (!rating || Number(rating) === 0) return 'No rating';
        return Number(rating).toFixed(1);
    };

    return (
        <>
            <Navbar />

            <main className="clinics-page">
                <div className="clinics-page-container">

                    <header className="clinics-page-header">
                        <span>VETERINARY CARE</span>
                        <h1>Find a clinic</h1>
                        <p>Browse veterinary clinics and find the right care for your pet.</p>
                    </header>

                    <div className="clinics-toolbar">
                        <div className="clinics-search-box">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by clinic, city or address"
                            />

                            {search && (
                                <button type="button" onClick={() => setSearch('')}>
                                    Clear
                                </button>
                            )}
                        </div>

                        {!loading && !error && (
                            <span className="clinics-result-count">
                                {filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'}
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="clinics-error-box">
                            <div>
                                <strong>Could not load clinics</strong>
                                <p>{error}</p>
                            </div>

                            <button type="button" onClick={loadClinics}>Try again</button>
                        </div>
                    )}

                    {loading && (
                        <div className="clinics-loading">
                            <div className="clinics-spinner" />
                            <p>Loading clinics...</p>
                        </div>
                    )}

                    {!loading && !error && filteredClinics.length === 0 && (
                        <div className="clinics-empty">
                            <h2>No clinics found</h2>
                            <p>Try another clinic name, city or address.</p>

                            {search && (
                                <button type="button" className="secondary-button" onClick={() => setSearch('')}>
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && filteredClinics.length > 0 && (
                        <div className="clinics-list">
                            {filteredClinics.map(clinic => (
                                <article className="clinic-list-card" key={clinic.id}>
                                    <div className="clinic-list-card-header">
                                        <div>
                                            <h2>{clinic.name}</h2>
                                            <p>{clinic.city || 'Location unavailable'}</p>
                                        </div>

                                        <div className="clinic-rating">
                                            <span>★</span>
                                            {displayRating(clinic.rating)}
                                        </div>
                                    </div>

                                    <div className="clinic-list-details">
                                        <div>
                                            <span>Address</span>
                                            <p>{clinic.address || 'Address unavailable'}</p>
                                        </div>

                                        {clinic.phone && (
                                            <div>
                                                <span>Phone</span>
                                                <p>{clinic.phone}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="clinic-list-footer">
                                        <span>Veterinary clinic</span>

                                        <Link to={`/clinics/${clinic.id}`}>
                                            View clinic
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                </div>
            </main>
        </>
    );
}