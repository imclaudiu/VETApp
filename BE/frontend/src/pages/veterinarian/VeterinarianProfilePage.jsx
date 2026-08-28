import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import {
    getClinicById,
    getVeterinarianById
} from '../../features/clinic/services/clinicService';

import '../account/AccountProfilePage.css';

export default function VeterinarianProfilePage() {
    const { veterinarianId } = useParams();
    const navigate = useNavigate();

    const [veterinarian, setVeterinarian] = useState(null);
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const vet = await getVeterinarianById(veterinarianId);
                setVeterinarian(vet);

                if (vet.clinicId) {
                    setClinic(await getClinicById(vet.clinicId));
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

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="account-profile-state">
                    Loading veterinarian...
                </div>
            </>
        );
    }

    if (error || !veterinarian) {
        return (
            <>
                <Navbar />
                <div className="account-profile-state account-profile-error">
                    {error || 'Veterinarian not found.'}
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="account-profile-page">
                <div className="account-profile-container">

                    <button
                        type="button"
                        className="account-profile-back"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>

                    <section className="account-profile-card">

                        <div className="account-profile-header">
                            <div className="account-profile-avatar">
                                {veterinarian.name?.charAt(0)?.toUpperCase() || 'V'}
                            </div>

                            <div>
                                <p>VETERINARIAN</p>
                                <h1>Dr. {veterinarian.name}</h1>

                                <span>
                                    {veterinarian.surgeon
                                        ? 'Veterinarian · Surgeon'
                                        : 'Veterinarian'}
                                </span>
                            </div>

                            {veterinarian.surgeon && (
                                <span className="account-surgeon-badge">
                                    Surgeon
                                </span>
                            )}
                        </div>

                        <div className="account-profile-section">
                            <p className="account-profile-label">
                                PROFESSIONAL INFORMATION
                            </p>

                            <div className="account-profile-grid">
                                <Info
                                    label="Veterinarian"
                                    value={`Dr. ${veterinarian.name}`}
                                />

                                <Info
                                    label="Specialization"
                                    value={veterinarian.surgeon
                                        ? 'Veterinary surgery'
                                        : 'General veterinary medicine'}
                                />

                                <Info
                                    label="Clinic"
                                    value={clinic?.name || clinic?.denumire}
                                />

                                <Info
                                    label="City"
                                    value={clinic?.city || clinic?.oras}
                                />

                                <Info
                                    label="Clinic phone"
                                    value={clinic?.phone || clinic?.telefon}
                                />

                                <Info
                                    label="Clinic address"
                                    value={clinic?.address || clinic?.adresa}
                                />
                            </div>
                        </div>

                        <div className="veterinarian-profile-actions">
                            {clinic && (
                                <Link
                                    to={`/clinics/${clinic.id}`}
                                    className="profile-secondary-button"
                                >
                                    View clinic
                                </Link>
                            )}

                            <Link
                                to={
                                    `/appointments/new?clinicId=${veterinarian.clinicId}` +
                                    `&veterinarianId=${veterinarian.id}`
                                }
                                className="profile-primary-button"
                            >
                                Book appointment
                            </Link>
                        </div>

                    </section>
                </div>
            </main>
        </>
    );
}

function Info({ label, value }) {
    return (
        <div className="account-profile-info">
            <span>{label}</span>
            <strong>{value || '—'}</strong>
        </div>
    );
}