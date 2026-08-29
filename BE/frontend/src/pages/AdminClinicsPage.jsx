import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../shared/components/Navbar';
import GoogleClinicPicker from '../shared/components/GoogleClinicPicker';

import {
    addClinic,
    deleteClinicSafely,
    getAllClinics
} from '../features/admin/services/adminClinicService';

import './AdminClinics.css';

const EMPTY_FORM = {
    name: '',
    address: '',
    city: '',
    phone: '',
    rating: 0,
    googlePlaceId: '',
    latitude: null,
    longitude: null
};

export default function AdminClinicsPage() {
    const [clinics, setClinics] = useState([]);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState(EMPTY_FORM);
    const [showAddForm, setShowAddForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [deleteClinicTarget, setDeleteClinicTarget] = useState(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadClinics = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getAllClinics();

            setClinics(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
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
        const value = search.trim().toLowerCase();

        const result = !value
            ? clinics
            : clinics.filter(clinic =>
                clinic.name?.toLowerCase().includes(value) ||
                clinic.city?.toLowerCase().includes(value) ||
                clinic.address?.toLowerCase().includes(value) ||
                clinic.phone?.toLowerCase().includes(value)
            );

        return [...result].sort((a, b) =>
            (Number(b.rating) || 0) -
            (Number(a.rating) || 0)
        );
    }, [clinics, search]);

    const citiesCount = useMemo(() => {
        return new Set(
            clinics
                .map(clinic => clinic.city)
                .filter(Boolean)
        ).size;
    }, [clinics]);

    const averageRating = useMemo(() => {
        const rated = clinics.filter(
            clinic => Number(clinic.rating) > 0
        );

        if (rated.length === 0) return '—';

        const total = rated.reduce(
            (sum, clinic) =>
                sum + Number(clinic.rating),
            0
        );

        return (total / rated.length).toFixed(1);
    }, [clinics]);

    const handleChange = event => {
        const { name, value } = event.target;

        setForm(current => ({
            ...current,
            [name]: value
        }));
    };

    const handlePlaceSelect = place => {
        setError('');

        setForm(current => ({
            ...current,
            ...place
        }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setShowAddForm(false);
    };

    const handleCreate = async event => {
        event.preventDefault();

        if (!form.googlePlaceId) {
            setError(
                'Select the clinic from Google Maps first.'
            );

            return;
        }

        if (!form.phone.trim()) {
            setError('Clinic phone is required.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await addClinic(form);

            resetForm();

            setSuccess(
                'Clinic added successfully.'
            );

            await loadClinics();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not create clinic.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteClinicTarget) return;

        try {
            setDeletingId(deleteClinicTarget.id);
            setError('');
            setSuccess('');

            await deleteClinicSafely(
                deleteClinicTarget.id
            );

            setClinics(current =>
                current.filter(
                    clinic =>
                        clinic.id !==
                        deleteClinicTarget.id
                )
            );

            setDeleteClinicTarget(null);

            setSuccess(
                'Clinic deleted successfully.'
            );
        } catch (err) {
            setDeleteClinicTarget(null);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not delete clinic.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    const formatRating = rating => {
        const value = Number(rating);

        if (!value) return 'No rating';

        return value.toFixed(1);
    };

    return (
        <>
            <Navbar />

            <main className="admin-clinics-v2-page">
                <div className="admin-clinics-v2-container">

                    <header className="admin-clinics-v2-header">

                        <div>
                            <span>ADMINISTRATION</span>

                            <h1>Manage clinics</h1>

                            <p>
                                Manage veterinary clinics and their associated resources.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                setError('');
                                setSuccess('');

                                if (showAddForm) {
                                    resetForm();
                                } else {
                                    setShowAddForm(true);
                                }
                            }}
                        >
                            {showAddForm
                                ? 'Close form'
                                : 'Add clinic'}
                        </button>

                    </header>

                    {error && (
                        <div className="admin-clinics-v2-message error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="admin-clinics-v2-message success">
                            {success}
                        </div>
                    )}

                    <section className="admin-clinics-v2-stats">

                        <div className="admin-clinics-v2-stat primary">
                            <span>CLINICS</span>

                            <strong>
                                {clinics.length}
                            </strong>

                            <p>
                                Registered clinics
                            </p>
                        </div>

                        <div className="admin-clinics-v2-stat">
                            <span>CITIES</span>

                            <strong>
                                {citiesCount}
                            </strong>

                            <p>
                                Cities covered
                            </p>
                        </div>

                        <div className="admin-clinics-v2-stat">
                            <span>AVERAGE RATING</span>

                            <strong>
                                {averageRating}
                            </strong>

                            <p>
                                Google rating
                            </p>
                        </div>

                    </section>

                    {showAddForm && (
                        <section className="admin-clinics-v2-create">

                            <div className="admin-clinics-v2-create-heading">
                                <div>
                                    <span>NEW CLINIC</span>

                                    <h2>Add veterinary clinic</h2>

                                    <p>
                                        Find the clinic through Google Maps and complete its VETApp information.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleCreate}>

                                <div className="admin-clinics-v2-picker">

                                    <label>
                                        Find clinic on Google Maps
                                    </label>

                                    <GoogleClinicPicker
                                        onSelect={
                                            handlePlaceSelect
                                        }
                                    />

                                    <p>
                                        Search and select the exact veterinary clinic.
                                    </p>

                                    {form.googlePlaceId && (
                                        <div className="admin-clinics-v2-google-selected">

                                            <span>✓</span>

                                            <div>
                                                <strong>
                                                    Linked to Google Maps
                                                </strong>

                                                <p>
                                                    {form.name}
                                                </p>
                                            </div>

                                        </div>
                                    )}

                                </div>

                                <div className="admin-clinics-v2-form-grid">

                                    <Field
                                        label="Clinic name"
                                        value={form.name}
                                        placeholder="Select from Google Maps"
                                        readOnly
                                    />

                                    <Field
                                        label="City"
                                        value={form.city}
                                        placeholder="Select from Google Maps"
                                        readOnly
                                    />

                                    <Field
                                        label="Address"
                                        value={form.address}
                                        placeholder="Select from Google Maps"
                                        readOnly
                                        full
                                    />

                                    <div className="admin-clinics-v2-field">
                                        <label>
                                            Phone
                                        </label>

                                        <input
                                            name="phone"
                                            type="text"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="+40..."
                                            required
                                        />
                                    </div>

                                    <Field
                                        label="Google rating"
                                        value={
                                            form.rating
                                                ? Number(form.rating).toFixed(1)
                                                : 'No rating'
                                        }
                                        readOnly
                                    />

                                </div>

                                {form.googlePlaceId && (
                                    <div className="admin-clinics-v2-place-data">

                                        <div>
                                            <span>GOOGLE PLACE ID</span>

                                            <strong>
                                                Connected
                                            </strong>
                                        </div>

                                        <div>
                                            <span>LATITUDE</span>

                                            <strong>
                                                {form.latitude ?? '—'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>LONGITUDE</span>

                                            <strong>
                                                {form.longitude ?? '—'}
                                            </strong>
                                        </div>

                                    </div>
                                )}

                                <div className="admin-clinics-v2-form-actions">

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={resetForm}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            saving ||
                                            !form.googlePlaceId
                                        }
                                    >
                                        {saving
                                            ? 'Creating...'
                                            : 'Create clinic'}
                                    </button>

                                </div>

                            </form>

                        </section>
                    )}

                    <section className="admin-clinics-v2-list-section">

                        <div className="admin-clinics-v2-list-heading">

                            <div>
                                <span>CLINIC DIRECTORY</span>

                                <h2>Registered clinics</h2>
                            </div>

                            <p>
                                {filteredClinics.length}
                                {' '}
                                {filteredClinics.length === 1
                                    ? 'clinic'
                                    : 'clinics'}
                            </p>

                        </div>

                        <div className="admin-clinics-v2-toolbar">

                            <div className="admin-clinics-v2-search">

                                <span>⌕</span>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={event =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search clinics by name, city or address..."
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSearch('')
                                        }
                                    >
                                        ×
                                    </button>
                                )}

                            </div>

                            <span>
                                Sorted by rating
                            </span>

                        </div>

                        {loading ? (
                            <div className="admin-clinics-v2-loading">

                                <div className="admin-clinics-v2-spinner" />

                                <p>
                                    Loading clinics...
                                </p>

                            </div>
                        ) : filteredClinics.length === 0 ? (
                            <div className="admin-clinics-v2-empty">

                                <div>+</div>

                                <h3>
                                    {search
                                        ? 'No clinics found'
                                        : 'No clinics registered'}
                                </h3>

                                <p>
                                    {search
                                        ? 'Try another clinic name, city or address.'
                                        : 'Add the first veterinary clinic to VETApp.'}
                                </p>

                                {!search && (
                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() =>
                                            setShowAddForm(true)
                                        }
                                    >
                                        Add clinic
                                    </button>
                                )}

                            </div>
                        ) : (
                            <div className="admin-clinics-v2-grid">

                                {filteredClinics.map(clinic => (
                                    <article
                                        className="admin-clinics-v2-card"
                                        key={clinic.id}
                                    >

                                        <Link
                                            to={`/admin/clinics/${clinic.id}`}
                                            className="admin-clinics-v2-card-main"
                                        >

                                            <div className="admin-clinics-v2-card-icon">
                                                {clinic.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    'C'}
                                            </div>

                                            <div className="admin-clinics-v2-card-content">

                                                <div className="admin-clinics-v2-card-top">

                                                    <div>
                                                        <span>
                                                            {clinic.city ||
                                                                'Veterinary clinic'}
                                                        </span>

                                                        <h3>
                                                            {clinic.name}
                                                        </h3>
                                                    </div>

                                                    <div className="admin-clinics-v2-rating">
                                                        <span>★</span>

                                                        <strong>
                                                            {formatRating(
                                                                clinic.rating
                                                            )}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="admin-clinics-v2-card-details">

                                                    <div>
                                                        <span>Address</span>

                                                        <strong>
                                                            {clinic.address ||
                                                                '—'}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>Phone</span>

                                                        <strong>
                                                            {clinic.phone ||
                                                                '—'}
                                                        </strong>
                                                    </div>

                                                </div>

                                            </div>

                                        </Link>

                                        <div className="admin-clinics-v2-card-footer">

                                            <Link
                                                to={`/admin/clinics/${clinic.id}`}
                                            >
                                                Manage clinic →
                                            </Link>

                                            <button
                                                type="button"
                                                disabled={
                                                    deletingId ===
                                                    clinic.id
                                                }
                                                onClick={() =>
                                                    setDeleteClinicTarget(
                                                        clinic
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </article>
                                ))}

                            </div>
                        )}

                    </section>

                </div>
            </main>

            {deleteClinicTarget && (
                <div
                    className="admin-clinics-v2-modal-backdrop"
                    onMouseDown={() => {
                        if (!deletingId) {
                            setDeleteClinicTarget(null);
                        }
                    }}
                >
                    <div
                        className="admin-clinics-v2-modal"
                        onMouseDown={event =>
                            event.stopPropagation()
                        }
                    >

                        <span>DELETE CLINIC</span>

                        <h2>
                            Delete {deleteClinicTarget.name}?
                        </h2>

                        <p>
                            The clinic can only be deleted if it no longer has veterinarians or services assigned to it.
                        </p>

                        <div className="admin-clinics-v2-modal-clinic">

                            <div>
                                {deleteClinicTarget.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    'C'}
                            </div>

                            <div>
                                <strong>
                                    {deleteClinicTarget.name}
                                </strong>

                                <span>
                                    {deleteClinicTarget.city}
                                </span>
                            </div>

                        </div>

                        <div className="admin-clinics-v2-modal-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                disabled={Boolean(deletingId)}
                                onClick={() =>
                                    setDeleteClinicTarget(null)
                                }
                            >
                                Keep clinic
                            </button>

                            <button
                                type="button"
                                className="admin-clinics-v2-delete-confirm"
                                disabled={Boolean(deletingId)}
                                onClick={handleDelete}
                            >
                                {deletingId
                                    ? 'Deleting...'
                                    : 'Delete clinic'}
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </>
    );
}

function Field({
    label,
    value,
    placeholder = '',
    readOnly = false,
    full = false
}) {
    return (
        <div
            className={
                `admin-clinics-v2-field${full ? ' full' : ''}`
            }
        >
            <label>{label}</label>

            <input
                type="text"
                value={value}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={readOnly}
            />
        </div>
    );
}