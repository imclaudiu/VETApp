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
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                const vet = await getVeterinarianById(veterinarianId);

                setVeterinarian(vet);

                if (vet.clinicId) {
                    try {
                        const clinicData = await getClinicById(vet.clinicId);
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

    const clinicName =
        clinic?.name ||
        clinic?.denumire ||
        'Not assigned';

    const clinicCity =
        clinic?.city ||
        clinic?.oras ||
        '—';

    const clinicAddress =
        clinic?.address ||
        clinic?.adresa ||
        '—';

    const clinicPhone =
        clinic?.phone ||
        clinic?.telefon ||
        '—';

    const professionalRole = veterinarian?.surgeon
        ? 'Veterinary surgeon'
        : 'Veterinarian';

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="vet-profile-page">
                    <div className="vet-profile-loading">
                        <div className="vet-profile-spinner" />
                        <p>Loading veterinarian profile...</p>
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
                            <h2>Veterinarian unavailable</h2>

                            <p>
                                {error || 'The veterinarian could not be found.'}
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

                    <div className="vet-profile-layout">

                        <div className="vet-profile-main">

                            <section className="vet-profile-hero">
                                <div className="vet-profile-avatar">
                                    {veterinarian.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'V'}
                                </div>

                                <div className="vet-profile-heading">
                                    <span>VETERINARIAN PROFILE</span>

                                    <h1>
                                        Dr. {veterinarian.name || 'Veterinarian'}
                                    </h1>

                                    <div className="vet-profile-role-row">
                                        <span className="vet-profile-role">
                                            {professionalRole}
                                        </span>

                                        {veterinarian.surgeon && (
                                            <span className="vet-profile-surgeon-badge">
                                                Surgeon
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="vet-profile-section">
                                <div className="vet-profile-section-heading">
                                    <span>PROFESSIONAL INFORMATION</span>

                                    <h2>Veterinarian details</h2>

                                    <p>
                                        Professional information and current clinic assignment.
                                    </p>
                                </div>

                                <div className="vet-profile-info-grid">

                                    <Info
                                        label="Veterinarian"
                                        value={`Dr. ${veterinarian.name || 'Veterinarian'}`}
                                    />

                                    <Info
                                        label="Professional role"
                                        value={professionalRole}
                                    />

                                    <Info
                                        label="Surgical practice"
                                        value={
                                            veterinarian.surgeon
                                                ? 'Yes'
                                                : 'No'
                                        }
                                    />

                                    <Info
                                        label="Clinic"
                                        value={clinicName}
                                    />

                                </div>
                            </section>

                            <section className="vet-profile-section">
                                <div className="vet-profile-section-heading">
                                    <span>CLINIC</span>

                                    <h2>
                                        {clinicName}
                                    </h2>

                                    <p>
                                        Clinic where this veterinarian currently practices.
                                    </p>
                                </div>

                                <div className="vet-profile-clinic-details">

                                    <div>
                                        <span>City</span>
                                        <strong>{clinicCity}</strong>
                                    </div>

                                    <div>
                                        <span>Phone</span>
                                        <strong>{clinicPhone}</strong>
                                    </div>

                                    <div className="full">
                                        <span>Address</span>
                                        <strong>{clinicAddress}</strong>
                                    </div>

                                </div>

                                {clinic?.id && (
                                    <Link
                                        to={`/clinics/${clinic.id}`}
                                        className="vet-profile-clinic-link"
                                    >
                                        View clinic details →
                                    </Link>
                                )}
                            </section>

                        </div>

                        <aside className="vet-profile-sidebar">

                            <section className="vet-profile-summary-card">
                                <span className="vet-profile-sidebar-label">
                                    PROFESSIONAL PROFILE
                                </span>

                                <div className="vet-profile-summary-doctor">
                                    <div className="vet-profile-summary-avatar">
                                        {veterinarian.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'V'}
                                    </div>

                                    <div>
                                        <h2>
                                            Dr. {veterinarian.name || 'Veterinarian'}
                                        </h2>

                                        <p>
                                            {professionalRole}
                                        </p>
                                    </div>
                                </div>

                                <div className="vet-profile-summary-details">

                                    <div>
                                        <span>Clinic</span>

                                        <strong>
                                            {clinicName}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>City</span>

                                        <strong>
                                            {clinicCity}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Surgeon</span>

                                        <strong>
                                            {veterinarian.surgeon
                                                ? 'Yes'
                                                : 'No'}
                                        </strong>
                                    </div>

                                </div>

                                {user?.role === 'OWNER' && (
                                    <Link
                                        to={
                                            `/appointments/new?clinicId=${veterinarian.clinicId}` +
                                            `&veterinarianId=${veterinarian.id}`
                                        }
                                        className="primary-button vet-profile-book"
                                    >
                                        Book appointment
                                    </Link>
                                )}

                                {clinic?.id && (
                                    <Link
                                        to={`/clinics/${clinic.id}`}
                                        className="secondary-button vet-profile-view-clinic"
                                    >
                                        View clinic
                                    </Link>
                                )}
                            </section>

                            {veterinarian.surgeon && (
                                <section className="vet-profile-surgery-card">
                                    <div className="vet-profile-surgery-icon">
                                        +
                                    </div>

                                    <div>
                                        <strong>
                                            Veterinary surgeon
                                        </strong>

                                        <p>
                                            This veterinarian is registered in VETApp as performing veterinary surgery.
                                        </p>
                                    </div>
                                </section>
                            )}

                        </aside>

                    </div>

                </div>
            </main>
        </>
    );
}

function Info({ label, value }) {
    return (
        <div className="vet-profile-info">
            <span>{label}</span>
            <strong>{value || '—'}</strong>
        </div>
    );
}