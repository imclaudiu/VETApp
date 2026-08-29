import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { useAuth } from '../../features/auth/contexts/AuthContext';

import {
    getClinicById,
    getVeterinarianById
} from '../../features/clinic/services/clinicService';

import './VeterinarianProfilePage.css';


export default function VeterinarianProfilePage() {

    const { veterinarianId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [veterinarian, setVeterinarian] = useState(null);
    const [clinic, setClinic] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {

        const loadProfile = async () => {

            try {

                setLoading(true);
                setError('');

                const vet =
                    await getVeterinarianById(
                        veterinarianId
                    );

                setVeterinarian(vet);


                if (vet.clinicId) {

                    try {

                        const clinicData =
                            await getClinicById(
                                vet.clinicId
                            );

                        setClinic(clinicData);

                    } catch {

                        setClinic(null);

                    }

                }

            } catch (err) {

                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load veterinarian.'
                );

            } finally {

                setLoading(false);

            }

        };


        loadProfile();

    }, [veterinarianId]);


    const name =
        veterinarian?.name ||
        'Veterinarian';


    const initial =
        name
            .charAt(0)
            .toUpperCase();


    const specialization =
        veterinarian?.surgeon
            ? 'Veterinary surgery'
            : 'General veterinary medicine';


    const clinicName =
        clinic?.name ||
        clinic?.denumire ||
        '—';


    const clinicCity =
        clinic?.city ||
        clinic?.oras ||
        '—';


    const clinicPhone =
        clinic?.phone ||
        clinic?.telefon ||
        '—';


    const clinicAddress =
        clinic?.address ||
        clinic?.adresa ||
        '—';


    if (loading) {

        return (
            <>
                <Navbar />

                <main className="vet-profile-page">

                    <div className="vet-profile-loading">

                        <div className="vet-profile-spinner" />

                        <p>
                            Loading veterinarian...
                        </p>

                    </div>

                </main>
            </>
        );

    }


    if (error || !veterinarian) {

        return (
            <>
                <Navbar />

                <main className="vet-profile-page">

                    <div className="vet-profile-container">

                        <div className="vet-profile-error-state">

                            <div className="vet-profile-error-icon">
                                !
                            </div>

                            <h2>
                                Veterinarian unavailable
                            </h2>

                            <p>
                                {error ||
                                    'The veterinarian could not be found.'}
                            </p>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => navigate(-1)}
                            >
                                Go back
                            </button>

                        </div>

                    </div>

                </main>
            </>
        );

    }


    return (
        <>
            <Navbar />

            <main className="vet-profile-page">

                <div className="vet-profile-container">

                    <button
                        type="button"
                        className="vet-profile-back"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>


                    {/* =========================
                        PROFILE HEADER
                    ========================= */}

                    <section className="vet-profile-header">

                        <div className="vet-profile-header-main">

                            <div className="vet-profile-avatar">
                                {initial}
                            </div>


                            <div className="vet-profile-identity">

                                <span className="vet-profile-eyebrow">
                                    VETERINARIAN PROFILE
                                </span>

                                <h1>
                                    Dr. {name}
                                </h1>

                                <p>
                                    {specialization}
                                </p>

                            </div>

                        </div>


                        <div className="vet-profile-header-badges">

                            <span className="vet-profile-role">
                                Veterinarian
                            </span>

                            {veterinarian.surgeon && (
                                <span className="vet-profile-surgeon">
                                    Surgeon
                                </span>
                            )}

                        </div>

                    </section>


                    {/* =========================
                        SUMMARY
                    ========================= */}

                    <section className="vet-profile-summary">

                        <div className="vet-profile-summary-card primary">

                            <span>
                                SPECIALIZATION
                            </span>

                            <strong>
                                {veterinarian.surgeon
                                    ? 'Surgery'
                                    : 'General medicine'}
                            </strong>

                            <p>
                                Veterinary professional
                            </p>

                        </div>


                        <div className="vet-profile-summary-card">

                            <span>
                                CLINIC
                            </span>

                            <strong>
                                {clinicName}
                            </strong>

                            <p>
                                Current workplace
                            </p>

                        </div>


                        <div className="vet-profile-summary-card">

                            <span>
                                LOCATION
                            </span>

                            <strong>
                                {clinicCity}
                            </strong>

                            <p>
                                Clinic city
                            </p>

                        </div>

                    </section>


                    <div className="vet-profile-layout">


                        {/* =========================
                            PROFESSIONAL INFO
                        ========================= */}

                        <section className="vet-profile-card">

                            <div className="vet-profile-card-heading">

                                <span>
                                    PROFESSIONAL INFORMATION
                                </span>

                                <h2>
                                    Veterinarian details
                                </h2>

                                <p>
                                    Professional and clinic information.
                                </p>

                            </div>


                            <div className="vet-profile-info-grid">

                                <Info
                                    label="Veterinarian"
                                    value={`Dr. ${name}`}
                                />

                                <Info
                                    label="Specialization"
                                    value={specialization}
                                />

                                <Info
                                    label="Professional role"
                                    value={
                                        veterinarian.surgeon
                                            ? 'Veterinarian · Surgeon'
                                            : 'Veterinarian'
                                    }
                                />

                                <Info
                                    label="Clinic"
                                    value={clinicName}
                                />

                            </div>

                        </section>


                        {/* =========================
                            CLINIC
                        ========================= */}

                        <aside className="vet-profile-clinic-card">

                            <div className="vet-profile-clinic-heading">

                                <span>
                                    CURRENT CLINIC
                                </span>

                                <div className="vet-profile-clinic-avatar">
                                    {clinicName !== '—'
                                        ? clinicName
                                            .charAt(0)
                                            .toUpperCase()
                                        : 'C'}
                                </div>

                                <h2>
                                    {clinicName}
                                </h2>

                                <p>
                                    {clinicCity}
                                </p>

                            </div>


                            <div className="vet-profile-clinic-divider" />


                            <ClinicInfo
                                label="Address"
                                value={clinicAddress}
                            />

                            <ClinicInfo
                                label="Phone"
                                value={clinicPhone}
                            />

                            {Number(clinic?.rating) > 0 && (
                                <ClinicInfo
                                    label="Google rating"
                                    value={`${Number(
                                        clinic.rating
                                    ).toFixed(1)} / 5`}
                                />
                            )}


                            {clinic && (
                                <Link
                                    to={`/clinics/${clinic.id}`}
                                    className="vet-profile-clinic-link"
                                >
                                    View clinic →
                                </Link>
                            )}

                        </aside>

                    </div>


                    {/* =========================
                        ACTIONS
                    ========================= */}

                    {user?.role === 'OWNER' && (
                        <section className="vet-profile-booking">

                            <div>

                                <span>
                                    APPOINTMENT
                                </span>

                                <h2>
                                    Book with Dr. {name}
                                </h2>

                                <p>
                                    Select a service, date and available appointment time.
                                </p>

                            </div>


                            <Link
                                to={
                                    `/appointments/new?clinicId=${veterinarian.clinicId}` +
                                    `&veterinarianId=${veterinarian.id}`
                                }
                                className="primary-button"
                            >
                                Book appointment
                            </Link>

                        </section>
                    )}


                    {user?.role === 'ADMIN' && clinic && (
                        <section className="vet-profile-admin">

                            <div>

                                <span>
                                    ADMINISTRATION
                                </span>

                                <h2>
                                    Manage clinic
                                </h2>

                                <p>
                                    Edit this veterinarian through the clinic administration page.
                                </p>

                            </div>


                            <Link
                                to={`/admin/clinics/${clinic.id}`}
                                className="secondary-button"
                            >
                                Manage clinic
                            </Link>

                        </section>
                    )}

                </div>

            </main>
        </>
    );

}


function Info({ label, value }) {

    return (
        <div className="vet-profile-info">

            <span>
                {label}
            </span>

            <strong>
                {value || '—'}
            </strong>

        </div>
    );

}


function ClinicInfo({ label, value }) {

    return (
        <div className="vet-profile-clinic-info">

            <span>
                {label}
            </span>

            <strong>
                {value || '—'}
            </strong>

        </div>
    );

}