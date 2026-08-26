import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import {
    getAllClinics
} from '../../features/clinic/services/clinicService';

import './ClinicsPage.css';


export default function ClinicsPage() {

    const [clinics, setClinics] =
        useState([]);

    const [search, setSearch] =
        useState('');

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);


    const loadClinics = async () => {

        setLoading(true);
        setError(null);

        try {

            const data =
                await getAllClinics();

            setClinics(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                'Error loading clinics:',
                err
            );

            setError(
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


    /*
     * Căutarea se face local momentan.
     *
     * Userul poate căuta după:
     * - nume
     * - oraș
     * - adresă
     */
    const filteredClinics =
        useMemo(() => {

            const term =
                search
                    .trim()
                    .toLowerCase();

            if (!term) {
                return clinics;
            }

            return clinics
                .filter((clinic) => {

                    const name =
                        clinic.name
                            ?.toLowerCase()
                        || '';

                    const city =
                        clinic.city
                            ?.toLowerCase()
                        || '';

                    const address =
                        clinic.address
                            ?.toLowerCase()
                        || '';

                    return (
                        name.includes(term)
                        ||
                        city.includes(term)
                        ||
                        address.includes(term)
                    );
                })
                .sort((a, b) => (b.ratingMediu || 0) - (a.ratingMediu || 0));

        }, [clinics, search]);


    const displayRating = (rating) => {

        if (
            rating === null
            ||
            rating === undefined
            ||
            Number(rating) === 0
        ) {
            return 'No reviews yet';
        }

        return Number(rating).toFixed(1);
    };


    return (
        <>
            <Navbar />

            <main className="clinics-page">

                <div className="clinics-page-container">


                    {/* HEADER */}

                    <section className="clinics-page-header">

                        <div>

                            <p className="clinics-eyebrow">
                                VETERINARY CARE
                            </p>

                            <h1>
                                Find a clinic
                            </h1>

                            <p>
                                Find veterinary clinics
                                and choose the right care
                                for your pet.
                            </p>

                        </div>

                    </section>


                    {/* SEARCH */}

                    <section className="clinics-search-wrapper">

                        <div className="clinics-search-box">

                            <div className="clinics-search-symbol">
                                ⌕
                            </div>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search by clinic name, city or address..."
                            />


                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch('')
                                    }
                                >
                                    Clear
                                </button>

                            )}

                        </div>

                    </section>


                    {/* ERROR */}

                    {error && (

                        <div className="clinics-error-box">

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


                    {/* RESULT */}

                    {!loading && !error && (

                        <section>

                            <div className="clinics-results-header">

                                <div>

                                    <p>
                                        AVAILABLE CLINICS
                                    </p>

                                    <h2>
                                        {filteredClinics.length}
                                        {' '}
                                        {filteredClinics.length === 1
                                            ? 'clinic found'
                                            : 'clinics found'}
                                    </h2>

                                </div>

                            </div>


                            {filteredClinics.length === 0 ? (

                                <div className="clinics-empty">

                                    <div className="clinics-empty-icon">
                                        +
                                    </div>

                                    <h2>
                                        No clinics found
                                    </h2>

                                    <p>
                                        Try searching for
                                        another clinic or city.
                                    </p>


                                    {search && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSearch('')
                                            }
                                        >
                                            Clear search
                                        </button>

                                    )}

                                </div>

                            ) : (

                                <div className="clinics-grid">

                                    {filteredClinics.map(
                                        (clinic) => (

                                            <article
                                                key={clinic.id}
                                                className="clinic-user-card"
                                            >


                                                <div className="clinic-user-card-top">

                                                    <div className="clinic-user-icon">
                                                        +
                                                    </div>


                                                    <div className="clinic-user-rating">

                                                        <span>
                                                            ★
                                                        </span>

                                                        {displayRating(
                                                            clinic.rating
                                                        )}

                                                    </div>

                                                </div>


                                                <div className="clinic-user-card-content">

                                                    <h2>
                                                        {clinic.name}
                                                    </h2>


                                                    <p className="clinic-user-city">
                                                        {clinic.city}
                                                    </p>


                                                    <div className="clinic-user-info">

                                                        <div>

                                                            <span>
                                                                ADDRESS
                                                            </span>

                                                            <strong>
                                                                {clinic.address}
                                                            </strong>

                                                        </div>


                                                        <div>

                                                            <span>
                                                                PHONE
                                                            </span>

                                                            <strong>
                                                                {clinic.phone}
                                                            </strong>

                                                        </div>

                                                    </div>

                                                </div>


                                                <Link
                                                    to={`/clinics/${clinic.id}`}
                                                    className="clinic-user-button"
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