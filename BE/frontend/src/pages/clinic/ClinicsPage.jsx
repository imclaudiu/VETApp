import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import {
    getAllClinics
} from '../../features/clinic/services/clinicService';

import './ClinicsPage.css';


export default function ClinicsPage() {

    const [clinics, setClinics] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');


    const loadClinics = async () => {

        setLoading(true);
        setError(null);

        try {

            const data = await getAllClinics();

            setClinics(data);

        } catch (err) {

            setError(
                err.response?.data?.message ||
                err.message ||
                'Could not load clinics.'
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadClinics();
    }, []);


    const filteredClinics = useMemo(() => {

        const term = search
            .trim()
            .toLowerCase();

        if (!term) {
            return clinics;
        }

        return clinics.filter((clinic) => {

            return (
                clinic.name
                    ?.toLowerCase()
                    .includes(term) ||

                clinic.city
                    ?.toLowerCase()
                    .includes(term) ||

                clinic.address
                    ?.toLowerCase()
                    .includes(term)
            );

        });

    }, [clinics, search]);


    const formatRating = (rating) => {

        if (
            rating === null ||
            rating === undefined
        ) {
            return 'No rating';
        }

        return Number(rating).toFixed(1);
    };


    return (
        <>
            <Navbar />

            <main className="clinics-page">

                <div className="clinics-container">


                    {/* HEADER */}

                    <section className="clinics-header">

                        <div>

                            <p className="clinics-eyebrow">
                                VETERINARY CARE
                            </p>

                            <h1>
                                Find a clinic
                            </h1>

                            <p>
                                Browse veterinary clinics and find
                                the right care for your pet.
                            </p>

                        </div>

                    </section>


                    {/* SEARCH */}

                    <section className="clinics-search-section">

                        <div className="clinics-search">

                            <span className="clinics-search-icon">
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search by clinic, city or address..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                >
                                    Clear
                                </button>
                            )}

                        </div>

                    </section>


                    {/* ERROR */}

                    {error && (
                        <div className="clinics-error">

                            <div>
                                <strong>
                                    Could not load clinics
                                </strong>

                                <p>
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadClinics}
                            >
                                Try again
                            </button>

                        </div>
                    )}


                    {/* LOADING */}

                    {loading && (
                        <div className="clinics-loading">

                            <div className="clinics-spinner" />

                            <p>
                                Loading clinics...
                            </p>

                        </div>
                    )}


                    {/* CONTENT */}

                    {!loading && !error && (

                        <section className="clinics-content">

                            <div className="clinics-results-header">

                                <div>

                                    <p className="clinics-results-label">
                                        AVAILABLE CLINICS
                                    </p>

                                    <h2>
                                        {filteredClinics.length}
                                        {' '}
                                        {filteredClinics.length === 1
                                            ? 'clinic'
                                            : 'clinics'}
                                    </h2>

                                </div>

                            </div>


                            {filteredClinics.length === 0 ? (

                                <div className="clinics-empty">

                                    <div className="clinics-empty-icon">
                                        +
                                    </div>

                                    <h3>
                                        No clinics found
                                    </h3>

                                    <p>
                                        Try searching for another
                                        clinic name or city.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                    >
                                        Clear search
                                    </button>

                                </div>

                            ) : (

                                <div className="clinics-grid">

                                    {filteredClinics.map(
                                        (clinic) => (

                                            <article
                                                className="clinic-card"
                                                key={clinic.id}
                                            >

                                                <div className="clinic-card-top">

                                                    <div className="clinic-icon">
                                                        +
                                                    </div>

                                                    <div className="clinic-rating">

                                                        <span>
                                                            ★
                                                        </span>

                                                        {formatRating(
                                                            clinic.rating
                                                        )}

                                                    </div>

                                                </div>


                                                <div className="clinic-card-content">

                                                    <h2>
                                                        {clinic.name}
                                                    </h2>

                                                    <p className="clinic-city">
                                                        {clinic.city}
                                                    </p>


                                                    <div className="clinic-information">

                                                        <div>
                                                            <span>
                                                                Address
                                                            </span>

                                                            <strong>
                                                                {clinic.address}
                                                            </strong>
                                                        </div>


                                                        <div>
                                                            <span>
                                                                Phone
                                                            </span>

                                                            <strong>
                                                                {clinic.phone}
                                                            </strong>
                                                        </div>

                                                    </div>

                                                </div>


                                                <Link
                                                    to={`/clinics/${clinic.id}`}
                                                    className="clinic-view-button"
                                                >
                                                    View clinic

                                                    <span>
                                                        →
                                                    </span>
                                                </Link>

                                            </article>

                                        )
                                    )}

                                </div>
                            )}

                        </section>
                    )}

                </div>

            </main>
        </>
    );
}