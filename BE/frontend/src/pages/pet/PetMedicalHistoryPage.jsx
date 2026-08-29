import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import {
    getPetById
} from '../../features/pet/services/petService';

import {
    getMedicalRecordsByPet
} from '../../features/medicalRecord/services/medicalRecordService';

import {
    getClinicById,
    getVeterinarianById,
    getServiceById
} from '../../features/clinic/services/clinicService';

import './PetMedicalHistoryPage.css';


export default function PetMedicalHistoryPage() {

    const { id } = useParams();

    const [pet, setPet] = useState(null);
    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {

        const loadHistory = async () => {

            try {

                setLoading(true);
                setError('');

                const [
                    petData,
                    medicalRecords
                ] = await Promise.all([
                    getPetById(id),
                    getMedicalRecordsByPet(id)
                ]);


                const detailedRecords = await Promise.all(

                    (Array.isArray(medicalRecords)
                        ? medicalRecords
                        : []
                    ).map(async record => {

                        const [
                            clinic,
                            veterinarian,
                            service
                        ] = await Promise.all([

                            record.clinicId
                                ? getClinicById(
                                    record.clinicId
                                ).catch(() => null)
                                : null,

                            record.veterinarianId
                                ? getVeterinarianById(
                                    record.veterinarianId
                                ).catch(() => null)
                                : null,

                            record.vetServiceId
                                ? getServiceById(
                                    record.vetServiceId
                                ).catch(() => null)
                                : null
                        ]);


                        return {
                            ...record,
                            clinic,
                            veterinarian,
                            service
                        };

                    })
                );


                setPet(petData);
                setRecords(detailedRecords);

            } catch (err) {

                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load medical history.'
                );

            } finally {

                setLoading(false);

            }
        };


        loadHistory();

    }, [id]);


    const sortedRecords = useMemo(() => {

        return [...records].sort(
            (a, b) =>
                new Date(b.consultationDate) -
                new Date(a.consultationDate)
        );

    }, [records]);


    const formatDate = value => {

        if (!value) {
            return '—';
        }

        return new Date(value)
            .toLocaleDateString(
                'en-GB',
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            );

    };


    const formatTime = value => {

        if (!value) {
            return '—';
        }

        return new Date(value)
            .toLocaleTimeString(
                'en-GB',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );

    };


    const formatSex = value => {

        if (!value) {
            return '—';
        }

        return value
            .charAt(0)
            .toUpperCase() +
            value.slice(1).toLowerCase();

    };


    const getPetInitial = () => {

        return pet?.name
            ?.charAt(0)
            ?.toUpperCase() || 'P';

    };


    if (loading) {

        return (
            <>
                <Navbar />

                <main className="pet-history-page">

                    <div className="pet-history-loading">

                        <div className="pet-history-spinner" />

                        <p>
                            Loading medical history...
                        </p>

                    </div>

                </main>
            </>
        );

    }


    return (
        <>
            <Navbar />

            <main className="pet-history-page">

                <div className="pet-history-container">

                    <Link
                        to="/pets"
                        className="pet-history-back"
                    >
                        ← Back to my pets
                    </Link>


                    {error && !pet ? (

                        <div className="pet-history-not-found">

                            <h2>
                                Medical history unavailable
                            </h2>

                            <p>
                                {error}
                            </p>

                            <Link
                                to="/pets"
                                className="primary-button"
                            >
                                Back to my pets
                            </Link>

                        </div>

                    ) : (

                        <>

                            {/* =========================
                                PATIENT HEADER
                            ========================= */}

                            <section className="pet-history-patient">

                                <div className="pet-history-patient-main">

                                    <div className="pet-history-avatar">
                                        {getPetInitial()}
                                    </div>

                                    <div>

                                        <span className="pet-history-eyebrow">
                                            MEDICAL HISTORY
                                        </span>

                                        <h1>
                                            {pet?.name}
                                        </h1>

                                        <p>
                                            Veterinary health record
                                        </p>

                                    </div>

                                </div>


                                <div className="pet-history-patient-stats">

                                    <div>
                                        <span>SPECIES</span>

                                        <strong>
                                            {pet?.species || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>BREED</span>

                                        <strong>
                                            {pet?.race || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>SEX</span>

                                        <strong>
                                            {formatSex(
                                                pet?.sex
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>DATE OF BIRTH</span>

                                        <strong>
                                            {formatDate(
                                                pet?.dob
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </section>


                            {error && (
                                <div className="pet-history-error">
                                    {error}
                                </div>
                            )}


                            {/* =========================
                                SUMMARY
                            ========================= */}

                            <section className="pet-history-summary">

                                <div className="pet-history-summary-card primary">

                                    <span>
                                        MEDICAL RECORDS
                                    </span>

                                    <strong>
                                        {records.length}
                                    </strong>

                                    <p>
                                        Total consultations
                                    </p>

                                </div>


                                <div className="pet-history-summary-card">

                                    <span>
                                        LAST VISIT
                                    </span>

                                    <strong>
                                        {sortedRecords.length
                                            ? formatDate(
                                                sortedRecords[0]
                                                    .consultationDate
                                            )
                                            : '—'}
                                    </strong>

                                    <p>
                                        Most recent consultation
                                    </p>

                                </div>


                                <div className="pet-history-summary-card">

                                    <span>
                                        LATEST WEIGHT
                                    </span>

                                    <strong>
                                        {sortedRecords.find(
                                            record =>
                                                record.weight != null
                                        )?.weight != null
                                            ? `${sortedRecords.find(
                                                record =>
                                                    record.weight != null
                                            ).weight} kg`
                                            : '—'}
                                    </strong>

                                    <p>
                                        Last recorded weight
                                    </p>

                                </div>

                            </section>


                            {/* =========================
                                HISTORY
                            ========================= */}

                            <section className="pet-history-section">

                                <div className="pet-history-section-heading">

                                    <div>

                                        <span>
                                            CONSULTATION HISTORY
                                        </span>

                                        <h2>
                                            Medical records
                                        </h2>

                                        <p>
                                            Consultations are displayed from newest to oldest.
                                        </p>

                                    </div>


                                    <strong>
                                        {records.length}{' '}
                                        {records.length === 1
                                            ? 'record'
                                            : 'records'}
                                    </strong>

                                </div>


                                {sortedRecords.length === 0 ? (

                                    <div className="pet-history-empty">

                                        <div className="pet-history-empty-icon">
                                            +
                                        </div>

                                        <h3>
                                            No medical records yet
                                        </h3>

                                        <p>
                                            Medical records created after veterinary consultations will appear here.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="pet-history-timeline">

                                        {sortedRecords.map(
                                            (record, index) => (

                                                <article
                                                    key={record.id}
                                                    className="pet-history-record"
                                                >

                                                    <div className="pet-history-timeline-column">

                                                        <div className="pet-history-timeline-dot" />

                                                        {index !==
                                                            sortedRecords.length - 1 && (
                                                                <div className="pet-history-timeline-line" />
                                                            )}

                                                    </div>


                                                    <div className="pet-history-record-card">

                                                        {/* TOP */}

                                                        <div className="pet-history-record-header">

                                                            <div>

                                                                <div className="pet-history-record-date">

                                                                    <span>
                                                                        {formatDate(
                                                                            record.consultationDate
                                                                        )}
                                                                    </span>

                                                                    <span className="pet-history-date-separator">
                                                                        ·
                                                                    </span>

                                                                    <span>
                                                                        {formatTime(
                                                                            record.consultationDate
                                                                        )}
                                                                    </span>

                                                                </div>


                                                                <h3>
                                                                    {record.diagnosis ||
                                                                        'Veterinary consultation'}
                                                                </h3>

                                                            </div>


                                                            <div className="pet-history-record-number">

                                                                <span>
                                                                    RECORD
                                                                </span>

                                                                <strong>
                                                                    #{String(
                                                                        sortedRecords.length -
                                                                        index
                                                                    ).padStart(
                                                                        2,
                                                                        '0'
                                                                    )}
                                                                </strong>

                                                            </div>

                                                        </div>


                                                        {/* META */}

                                                        <div className="pet-history-record-meta">

                                                            <Meta
                                                                label="Clinic"
                                                                value={
                                                                    record.clinic
                                                                        ?.name ||
                                                                    'Unknown clinic'
                                                                }
                                                            />

                                                            <Meta
                                                                label="Veterinarian"
                                                                value={
                                                                    record.veterinarian
                                                                        ?.name
                                                                        ? `Dr. ${record.veterinarian.name}`
                                                                        : 'Unknown veterinarian'
                                                                }
                                                            />

                                                            <Meta
                                                                label="Service"
                                                                value={
                                                                    record.service
                                                                        ?.serviceName ||
                                                                    '—'
                                                                }
                                                            />

                                                        </div>


                                                        {/* VITALS */}

                                                        {(record.weight != null ||
                                                            record.temperature != null) && (

                                                                <div className="pet-history-vitals">

                                                                    <div className="pet-history-vital">

                                                                        <span>
                                                                            WEIGHT
                                                                        </span>

                                                                        <strong>
                                                                            {record.weight != null
                                                                                ? `${record.weight} kg`
                                                                                : '—'}
                                                                        </strong>

                                                                    </div>


                                                                    <div className="pet-history-vital">

                                                                        <span>
                                                                            TEMPERATURE
                                                                        </span>

                                                                        <strong>
                                                                            {record.temperature != null
                                                                                ? `${record.temperature} °C`
                                                                                : '—'}
                                                                        </strong>

                                                                    </div>

                                                                </div>

                                                            )}


                                                        {/* DETAILS */}

                                                        <div className="pet-history-record-details">

                                                            <RecordSection
                                                                label="SYMPTOMS"
                                                                value={
                                                                    record.symptoms
                                                                }
                                                                empty="No symptoms recorded."
                                                            />


                                                            <RecordSection
                                                                label="DIAGNOSIS"
                                                                value={
                                                                    record.diagnosis
                                                                }
                                                                empty="No diagnosis recorded."
                                                            />


                                                            <RecordSection
                                                                label="OBSERVATIONS"
                                                                value={
                                                                    record.observations
                                                                }
                                                                empty="No additional observations."
                                                            />

                                                        </div>

                                                    </div>

                                                </article>

                                            )
                                        )}

                                    </div>

                                )}

                            </section>

                        </>

                    )}

                </div>

            </main>
        </>
    );
}


function Meta({ label, value }) {

    return (
        <div className="pet-history-meta-item">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>
    );

}


function RecordSection({
    label,
    value,
    empty
}) {

    return (
        <div className="pet-history-record-section">

            <span>
                {label}
            </span>

            <p className={!value ? 'empty' : ''}>
                {value || empty}
            </p>

        </div>
    );

}