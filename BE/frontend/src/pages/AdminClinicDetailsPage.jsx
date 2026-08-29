import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../shared/components/Navbar';

import {
    addAvailability,
    addVetService,
    addVeterinarian,
    deleteAvailability,
    deleteClinicSafely,
    deleteVeterinarian,
    deleteVetService,
    getAllAvailability,
    getAllUsers,
    getAllVeterinarians,
    getClinicById,
    getServicesByClinic,
    getVeterinariansByClinic,
    updateAvailability,
    updateClinic,
    updateVeterinarian,
    updateVetService,
    searchUsersByUsername,
} from '../features/admin/services/adminClinicService';

import './AdminClinicDetails.css';

const EMPTY_SERVICE = {
    serviceName: '',
    duration: '',
    price: '',
    description: ''
};

const EMPTY_AVAILABILITY = {
    veterinarianId: '',
    day: '',
    startHour: '',
    endHour: ''
};

export default function AdminClinicDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [clinic, setClinic] = useState(null);
    const [veterinarians, setVeterinarians] = useState([]);
    const [services, setServices] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [users, setUsers] = useState([]);
    const [allVeterinarians, setAllVeterinarians] = useState([]);

    const [tab, setTab] = useState('clinic');

    const [clinicForm, setClinicForm] = useState({
        name: '',
        address: '',
        city: '',
        phone: ''
    });

    const [vetForm, setVetForm] = useState({
        userId: '',
        surgeon: false
    });

    const [vetSearch, setVetSearch] = useState('');
    const [vetSearchResults, setVetSearchResults] = useState([]);
    const [selectedVetUser, setSelectedVetUser] = useState(null);
    const [vetSearching, setVetSearching] = useState(false);

    const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
    const [editingServiceId, setEditingServiceId] = useState(null);

    const [availabilityForm, setAvailabilityForm] =
        useState(EMPTY_AVAILABILITY);

    const [editingAvailability, setEditingAvailability] =
        useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const [
                clinicData,
                clinicVets,
                clinicServices,
                availabilityData,
                usersData,
                allVets
            ] = await Promise.all([
                getClinicById(id),
                getVeterinariansByClinic(id),
                getServicesByClinic(id),
                getAllAvailability(),
                getAllUsers(),
                getAllVeterinarians()
            ]);

            setClinic(clinicData);

            setClinicForm({
                name: clinicData.name || '',
                address: clinicData.address || '',
                city: clinicData.city || '',
                phone: clinicData.phone || ''
            });

            setVeterinarians(
                Array.isArray(clinicVets) ? clinicVets : []
            );

            setServices(
                Array.isArray(clinicServices) ? clinicServices : []
            );

            setUsers(
                Array.isArray(usersData) ? usersData : []
            );

            setAllVeterinarians(
                Array.isArray(allVets) ? allVets : []
            );

            const vetIds = new Set(
                (clinicVets || []).map(vet => vet.id)
            );

            setAvailability(
                (availabilityData || []).filter(item =>
                    vetIds.has(item.id?.veterinarianId)
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not load clinic.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        const query = vetSearch.trim();

        if (tab !== 'vets' || query.length < 2) {
            setVetSearchResults([]);
            setVetSearching(false);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                setVetSearching(true);

                console.log(
                    'Searching username:',
                    query
                );

                const results =
                    await searchUsersByUsername(query);

                console.log(
                    'Search response:',
                    results
                );

                /*
                 * Userii care au deja un Veterinarian entity
                 * nu mai pot fi asignați încă o dată.
                 */
                const existingVetUserIds = new Set(
                    allVeterinarians.map(
                        vet => String(vet.userId)
                    )
                );

                const availableResults =
                    (Array.isArray(results)
                        ? results
                        : []
                    ).filter(account => {

                        /*
                         * Nu permitem transformarea
                         * unui ADMIN în veterinarian.
                         */
                        if (account.role === 'ADMIN') {
                            return false;
                        }

                        return !existingVetUserIds.has(
                            String(account.id)
                        );
                    });

                console.log(
                    'Available users:',
                    availableResults
                );

                setVetSearchResults(
                    availableResults
                );

            } catch (err) {
                console.error(
                    'USER SEARCH ERROR:',
                    err.response?.status,
                    err.response?.data,
                    err
                );

                setVetSearchResults([]);

                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not search users.'
                );
            } finally {
                setVetSearching(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeout);
        };

    }, [
        vetSearch,
        tab,
        allVeterinarians
    ]);

    const usersById = useMemo(() => {
        return users.reduce((result, user) => {
            result[user.id] = user;
            return result;
        }, {});
    }, [users]);


    const getVetName = vet => {
        if (!vet) {
            return 'Veterinarian';
        }

        return (
            vet.name ||
            usersById[vet.userId]?.name ||
            usersById[vet.userId]?.username ||
            'Veterinarian'
        );
    };


    const getVetNameById = veterinarianId => {
        const vet = veterinarians.find(
            item =>
                String(item.id) ===
                String(veterinarianId)
        );

        return getVetName(vet);
    };


    const sortedVeterinarians = useMemo(() => {
        return [...veterinarians].sort(
            (a, b) =>
                getVetName(a).localeCompare(
                    getVetName(b)
                )
        );
    }, [
        veterinarians,
        usersById
    ]);


    const sortedServices = useMemo(() => {
        return [...services].sort(
            (a, b) =>
                (a.serviceName || '').localeCompare(
                    b.serviceName || ''
                )
        );
    }, [services]);


    const sortedAvailability = useMemo(() => {
        return [...availability].sort((a, b) => {
            const dateCompare =
                (a.id?.day || '').localeCompare(
                    b.id?.day || ''
                );

            if (dateCompare !== 0) {
                return dateCompare;
            }

            return (a.startHour || '').localeCompare(
                b.startHour || ''
            );
        });
    }, [availability]);


    const formatDate = value => {
        if (!value) {
            return '—';
        }

        const [year, month, day] =
            value.split('-');

        if (!year || !month || !day) {
            return value;
        }

        return `${day}/${month}/${year}`;
    };


    const formatPrice = value => {
        const number = Number(value);

        if (Number.isNaN(number)) {
            return '—';
        }

        return `${number.toFixed(2)} RON`;
    };



    const showSuccess = message => {
        setSuccess(message);

        window.setTimeout(() => {
            setSuccess('');
        }, 3500);
    };

    /* =====================================================
       CLINIC
    ===================================================== */

    const saveClinic = async event => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');

            const updated = await updateClinic(
                id,
                clinicForm
            );

            setClinic(updated);

            showSuccess(
                'Clinic information updated successfully.'
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not update clinic.'
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       VETERINARIANS
    ===================================================== */

    const createVeterinarian = async event => {
        event.preventDefault();

        if (!selectedVetUser) {
            setError(
                'Search and select a user first.'
            );

            return;
        }

        try {
            setSaving(true);
            setError('');

            await addVeterinarian({
                userId: selectedVetUser.id,
                clinicId: id,
                surgeon: vetForm.surgeon
            });

            setVetForm({
                userId: '',
                surgeon: false
            });

            setVetSearch('');
            setVetSearchResults([]);
            setSelectedVetUser(null);

            await loadData();

            showSuccess(
                `@${selectedVetUser.username} is now a veterinarian at ${clinic.name}.`
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not assign veterinarian.'
            );
        } finally {
            setSaving(false);
        }
    };

    const toggleSurgeon = async vet => {
        try {
            setError('');

            await updateVeterinarian(
                vet.id,
                {
                    surgeon: !vet.surgeon
                }
            );

            await loadData();

            showSuccess(
                vet.surgeon
                    ? 'Surgeon status removed.'
                    : 'Veterinarian marked as surgeon.'
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not update veterinarian.'
            );
        }
    };

    /* =====================================================
       SERVICES
    ===================================================== */

    const submitService = async event => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');

            const payload = {
                serviceName: serviceForm.serviceName.trim(),
                duration: Number(serviceForm.duration),
                price: Number(serviceForm.price),
                description:
                    serviceForm.description.trim()
            };

            if (editingServiceId) {
                await updateVetService(
                    editingServiceId,
                    payload
                );
            } else {
                await addVetService({
                    ...payload,
                    clinicId: id
                });
            }

            const wasEditing =
                Boolean(editingServiceId);

            setEditingServiceId(null);
            setServiceForm(EMPTY_SERVICE);

            await loadData();

            showSuccess(
                wasEditing
                    ? 'Service updated successfully.'
                    : 'Service added successfully.'
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not save service.'
            );
        } finally {
            setSaving(false);
        }
    };

    const editService = service => {
        setEditingServiceId(service.id);

        setServiceForm({
            serviceName:
                service.serviceName || '',
            duration:
                service.duration ?? '',
            price:
                service.price ?? '',
            description:
                service.description || ''
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const cancelServiceEdit = () => {
        setEditingServiceId(null);
        setServiceForm(EMPTY_SERVICE);
    };

    /* =====================================================
       AVAILABILITY
    ===================================================== */

    const submitAvailability = async event => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');

            if (
                availabilityForm.startHour >=
                availabilityForm.endHour
            ) {
                setError(
                    'End time must be after start time.'
                );

                return;
            }

            if (editingAvailability) {
                await updateAvailability(
                    editingAvailability.veterinarianId,
                    editingAvailability.day,
                    {
                        startHour:
                            availabilityForm.startHour,

                        endHour:
                            availabilityForm.endHour
                    }
                );
            } else {
                await addAvailability(
                    availabilityForm
                );
            }

            const wasEditing =
                Boolean(editingAvailability);

            setEditingAvailability(null);
            setAvailabilityForm(
                EMPTY_AVAILABILITY
            );

            await loadData();

            showSuccess(
                wasEditing
                    ? 'Schedule updated successfully.'
                    : 'Schedule added successfully.'
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not save work schedule.'
            );
        } finally {
            setSaving(false);
        }
    };

    const editAvailability = item => {
        setEditingAvailability({
            veterinarianId:
                item.id.veterinarianId,

            day:
                item.id.day
        });

        setAvailabilityForm({
            veterinarianId:
                item.id.veterinarianId,

            day:
                item.id.day,

            startHour:
                item.startHour?.slice(0, 5) || '',

            endHour:
                item.endHour?.slice(0, 5) || ''
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const cancelAvailabilityEdit = () => {
        setEditingAvailability(null);
        setAvailabilityForm(
            EMPTY_AVAILABILITY
        );
    };

    /* =====================================================
       DELETE MODAL
    ===================================================== */

    const openDeleteClinic = () => {
        setDeleteTarget({
            type: 'clinic',
            item: clinic,
            title: `Delete ${clinic.name}?`,
            description:
                'The clinic can only be removed after its veterinarians and services have been deleted.'
        });
    };

    const openDeleteVeterinarian = vet => {
        setDeleteTarget({
            type: 'veterinarian',
            item: vet,
            title: `Remove ${getVetName(vet)}?`,
            description:
                'The veterinarian will be removed from this clinic and their work schedule will also be deleted.'
        });
    };

    const openDeleteService = service => {
        setDeleteTarget({
            type: 'service',
            item: service,
            title: `Delete ${service.serviceName}?`,
            description:
                'This veterinary service will be permanently removed from the clinic.'
        });
    };

    const openDeleteAvailability = item => {
        setDeleteTarget({
            type: 'availability',
            item,
            title: 'Delete work schedule?',
            description:
                `${getVetNameById(item.id.veterinarianId)} · ${formatDate(item.id.day)} · ${item.startHour?.slice(0, 5)}–${item.endHour?.slice(0, 5)}`
        });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleting(true);
            setError('');

            if (deleteTarget.type === 'clinic') {
                await deleteClinicSafely(id);

                navigate(
                    '/admin/clinics',
                    { replace: true }
                );

                return;
            }

            if (
                deleteTarget.type ===
                'veterinarian'
            ) {
                await deleteVeterinarian(
                    deleteTarget.item.id
                );
            }

            if (
                deleteTarget.type ===
                'service'
            ) {
                await deleteVetService(
                    deleteTarget.item.id
                );
            }

            if (
                deleteTarget.type ===
                'availability'
            ) {
                await deleteAvailability(
                    deleteTarget.item.id
                        .veterinarianId,

                    deleteTarget.item.id.day
                );
            }

            const deletedType =
                deleteTarget.type;

            setDeleteTarget(null);

            await loadData();

            showSuccess(
                deletedType === 'veterinarian'
                    ? 'Veterinarian removed successfully.'
                    : deletedType === 'service'
                        ? 'Service deleted successfully.'
                        : 'Schedule deleted successfully.'
            );
        } catch (err) {
            setDeleteTarget(null);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not delete resource.'
            );
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="admin-clinic-detail-page">
                    <div className="admin-clinic-detail-loading">
                        <div className="admin-clinic-detail-spinner" />

                        <p>
                            Loading clinic...
                        </p>
                    </div>
                </main>
            </>
        );
    }

    if (!clinic) {
        return (
            <>
                <Navbar />

                <main className="admin-clinic-detail-page">
                    <div className="admin-clinic-detail-container">

                        <div className="admin-clinic-detail-not-found">
                            <h2>
                                Clinic unavailable
                            </h2>

                            <p>
                                {error ||
                                    'The clinic could not be found.'}
                            </p>

                            <Link
                                to="/admin/clinics"
                                className="primary-button"
                            >
                                Back to clinics
                            </Link>
                        </div>

                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="admin-clinic-detail-page">
                <div className="admin-clinic-detail-container">

                    <Link
                        to="/admin/clinics"
                        className="admin-clinic-detail-back"
                    >
                        ← Back to clinics
                    </Link>

                    <header className="admin-clinic-detail-header">

                        <div className="admin-clinic-detail-heading">

                            <span>
                                CLINIC MANAGEMENT
                            </span>

                            <h1>
                                {clinic.name}
                            </h1>

                            <p>
                                {clinic.address}
                                {clinic.city
                                    ? `, ${clinic.city}`
                                    : ''}
                            </p>

                        </div>

                        <button
                            type="button"
                            className="danger-button"
                            onClick={openDeleteClinic}
                        >
                            Delete clinic
                        </button>

                    </header>

                    {error && (
                        <div className="admin-clinic-detail-message error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="admin-clinic-detail-message success">
                            {success}
                        </div>
                    )}

                    <section className="admin-clinic-detail-summary">

                        <Summary
                            label="VETERINARIANS"
                            value={veterinarians.length}
                            text="Assigned doctors"
                        />

                        <Summary
                            label="SERVICES"
                            value={services.length}
                            text="Available services"
                        />

                        <Summary
                            label="SCHEDULE ENTRIES"
                            value={availability.length}
                            text="Availability records"
                        />

                        <Summary
                            label="GOOGLE RATING"
                            value={
                                Number(clinic.rating) > 0
                                    ? Number(clinic.rating).toFixed(1)
                                    : '—'
                            }
                            text={
                                clinic.googlePlaceId
                                    ? 'Google Maps linked'
                                    : 'Not linked'
                            }
                        />

                    </section>

                    <nav className="admin-clinic-detail-tabs">

                        <Tab
                            active={tab === 'clinic'}
                            onClick={() => setTab('clinic')}
                            title="Clinic"
                        />

                        <Tab
                            active={tab === 'vets'}
                            onClick={() => setTab('vets')}
                            title="Veterinarians"
                            count={veterinarians.length}
                        />

                        <Tab
                            active={tab === 'services'}
                            onClick={() => setTab('services')}
                            title="Services"
                            count={services.length}
                        />

                        <Tab
                            active={tab === 'schedule'}
                            onClick={() => setTab('schedule')}
                            title="Work schedule"
                            count={availability.length}
                        />

                    </nav>

                    {/* ================= CLINIC ================= */}

                    {tab === 'clinic' && (
                        <div className="admin-clinic-detail-single-layout">

                            <form
                                className="admin-clinic-detail-panel"
                                onSubmit={saveClinic}
                            >

                                <SectionHeading
                                    label="CLINIC INFORMATION"
                                    title="General details"
                                    text="Update the clinic information displayed throughout VETApp."
                                />

                                <div className="admin-clinic-detail-form-grid">

                                    <FormField
                                        label="Clinic name"
                                        value={clinicForm.name}
                                        onChange={value =>
                                            setClinicForm(current => ({
                                                ...current,
                                                name: value
                                            }))
                                        }
                                    />

                                    <FormField
                                        label="City"
                                        value={clinicForm.city}
                                        onChange={value =>
                                            setClinicForm(current => ({
                                                ...current,
                                                city: value
                                            }))
                                        }
                                    />

                                    <FormField
                                        label="Address"
                                        value={clinicForm.address}
                                        full
                                        onChange={value =>
                                            setClinicForm(current => ({
                                                ...current,
                                                address: value
                                            }))
                                        }
                                    />

                                    <FormField
                                        label="Phone"
                                        value={clinicForm.phone}
                                        onChange={value =>
                                            setClinicForm(current => ({
                                                ...current,
                                                phone: value
                                            }))
                                        }
                                    />

                                    <FormField
                                        label="Google rating"
                                        value={
                                            Number(clinic.rating) > 0
                                                ? Number(clinic.rating).toFixed(1)
                                                : 'No rating'
                                        }
                                        disabled
                                    />

                                </div>

                                <div className="admin-clinic-detail-google">

                                    <div>
                                        <span>
                                            GOOGLE MAPS
                                        </span>

                                        <strong>
                                            {clinic.googlePlaceId
                                                ? 'Connected'
                                                : 'Not connected'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            LATITUDE
                                        </span>

                                        <strong>
                                            {clinic.latitude ?? '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            LONGITUDE
                                        </span>

                                        <strong>
                                            {clinic.longitude ?? '—'}
                                        </strong>
                                    </div>

                                </div>

                                <div className="admin-clinic-detail-form-actions">

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : 'Save clinic changes'}
                                    </button>

                                </div>

                            </form>

                        </div>
                    )}

                    {/* ================= VETS ================= */}

                    {tab === 'vets' && (
                        <div className="admin-clinic-detail-management">

                            <form
                                className="admin-clinic-detail-panel admin-clinic-detail-form-panel"
                                onSubmit={createVeterinarian}
                            >

                                <SectionHeading
                                    label="NEW VETERINARIAN"
                                    title="Assign veterinarian"
                                    text="Select an existing VETApp user and assign them to this clinic."
                                />

                                <div className="admin-clinic-vet-search">

                                    <label>
                                        Search user by username
                                    </label>

                                    <div className="admin-clinic-vet-search-input">

                                        <span>⌕</span>

                                        <input
                                            type="text"
                                            value={vetSearch}
                                            placeholder="Start typing username..."
                                            autoComplete="off"
                                            onChange={event => {
                                                setVetSearch(
                                                    event.target.value
                                                );

                                                setSelectedVetUser(null);
                                            }}
                                        />

                                        {vetSearch && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVetSearch('');
                                                    setVetSearchResults([]);
                                                    setSelectedVetUser(null);
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}

                                    </div>

                                    <p className="admin-clinic-vet-search-hint">
                                        Enter at least 2 characters of the username.
                                    </p>

                                    {vetSearching && (
                                        <div className="admin-clinic-vet-searching">
                                            Searching users...
                                        </div>
                                    )}

                                    {!vetSearching &&
                                        vetSearch.trim().length >= 2 &&
                                        vetSearchResults.length === 0 &&
                                        !selectedVetUser && (
                                            <div className="admin-clinic-vet-no-results">
                                                No available users found.
                                            </div>
                                        )}

                                    {vetSearchResults.length > 0 &&
                                        !selectedVetUser && (
                                            <div className="admin-clinic-vet-results">

                                                {vetSearchResults.map(account => (
                                                    <button
                                                        key={account.id}
                                                        type="button"
                                                        className="admin-clinic-vet-result"
                                                        onClick={() => {
                                                            setSelectedVetUser(
                                                                account
                                                            );

                                                            setVetSearch(
                                                                account.username
                                                            );

                                                            setVetSearchResults([]);
                                                        }}
                                                    >

                                                        <div className="admin-clinic-vet-result-avatar">
                                                            {account.username
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                'U'}
                                                        </div>

                                                        <div className="admin-clinic-vet-result-info">

                                                            <strong>
                                                                @{account.username}
                                                            </strong>

                                                            <span>
                                                                {account.email ||
                                                                    'No email'}
                                                            </span>

                                                        </div>

                                                        <span
                                                            className={
                                                                `admin-clinic-vet-result-role ${account.role?.toLowerCase()
                                                                }`
                                                            }
                                                        >
                                                            {account.role === 'OWNER'
                                                                ? 'Owner'
                                                                : account.role === 'VETERINARIAN'
                                                                    ? 'Veterinarian'
                                                                    : account.role}
                                                        </span>

                                                    </button>
                                                ))}

                                            </div>
                                        )}

                                    {selectedVetUser && (
                                        <div className="admin-clinic-vet-selected">

                                            <div className="admin-clinic-vet-selected-avatar">
                                                {selectedVetUser.username
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    'U'}
                                            </div>

                                            <div>
                                                <span>
                                                    SELECTED ACCOUNT
                                                </span>

                                                <strong>
                                                    @{selectedVetUser.username}
                                                </strong>

                                                <p>
                                                    {selectedVetUser.email ||
                                                        'No email'}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVetUser(null);
                                                    setVetSearch('');
                                                }}
                                            >
                                                Change
                                            </button>

                                        </div>
                                    )}

                                </div>

                                <label className="admin-clinic-detail-checkbox">

                                    <input
                                        type="checkbox"
                                        checked={vetForm.surgeon}
                                        onChange={event =>
                                            setVetForm(current => ({
                                                ...current,
                                                surgeon:
                                                    event.target.checked
                                            }))
                                        }
                                    />

                                    <span>
                                        <strong>
                                            Surgeon
                                        </strong>

                                        <small>
                                            This veterinarian can be identified as a veterinary surgeon.
                                        </small>
                                    </span>

                                </label>

                                <div className="admin-clinic-detail-form-actions">

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            saving ||
                                            !selectedVetUser
                                        }
                                    >
                                        {saving
                                            ? 'Assigning...'
                                            : 'Assign veterinarian'}
                                    </button>

                                </div>

                            </form>

                            <section className="admin-clinic-detail-resource-panel">

                                <SectionHeading
                                    label="CLINIC TEAM"
                                    title="Veterinarians"
                                    text={`${veterinarians.length} ${veterinarians.length === 1
                                        ? 'veterinarian'
                                        : 'veterinarians'
                                        } assigned`}
                                />

                                {sortedVeterinarians.length === 0 ? (
                                    <EmptyState
                                        title="No veterinarians"
                                        text="Assign the first veterinarian to this clinic."
                                    />
                                ) : (
                                    <div className="admin-clinic-detail-vet-list">

                                        {sortedVeterinarians.map(vet => (
                                            <article
                                                key={vet.id}
                                                className="admin-clinic-detail-vet"
                                            >

                                                <div className="admin-clinic-detail-vet-avatar">
                                                    {getVetName(vet)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="admin-clinic-detail-vet-info">

                                                    <div className="admin-clinic-detail-vet-title">

                                                        <div>
                                                            <h3>
                                                                Dr. {getVetName(vet)}
                                                            </h3>

                                                            <p>
                                                                {usersById[vet.userId]?.email || 'Veterinarian'}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={
                                                                vet.surgeon
                                                                    ? 'surgeon'
                                                                    : ''
                                                            }
                                                        >
                                                            {vet.surgeon
                                                                ? 'Surgeon'
                                                                : 'Veterinarian'}
                                                        </span>

                                                    </div>

                                                    <div className="admin-clinic-detail-resource-actions">

                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            onClick={() =>
                                                                toggleSurgeon(vet)
                                                            }
                                                        >
                                                            {vet.surgeon
                                                                ? 'Remove surgeon'
                                                                : 'Make surgeon'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="danger-button"
                                                            onClick={() =>
                                                                openDeleteVeterinarian(vet)
                                                            }
                                                        >
                                                            Remove
                                                        </button>

                                                    </div>

                                                </div>

                                            </article>
                                        ))}

                                    </div>
                                )}

                            </section>

                        </div>
                    )}

                    {/* ================= SERVICES ================= */}

                    {tab === 'services' && (
                        <div className="admin-clinic-detail-management">

                            <form
                                className="admin-clinic-detail-panel admin-clinic-detail-form-panel"
                                onSubmit={submitService}
                            >

                                <SectionHeading
                                    label={
                                        editingServiceId
                                            ? 'EDIT SERVICE'
                                            : 'NEW SERVICE'
                                    }
                                    title={
                                        editingServiceId
                                            ? 'Edit veterinary service'
                                            : 'Add veterinary service'
                                    }
                                    text="Configure duration, price and service information."
                                />

                                <div className="admin-clinic-detail-field">

                                    <label>
                                        Service name
                                    </label>

                                    <input
                                        value={serviceForm.serviceName}
                                        onChange={event =>
                                            setServiceForm(current => ({
                                                ...current,
                                                serviceName:
                                                    event.target.value
                                            }))
                                        }
                                        placeholder="General consultation"
                                        required
                                    />

                                </div>

                                <div className="admin-clinic-detail-form-grid">

                                    <div className="admin-clinic-detail-field">
                                        <label>
                                            Duration
                                        </label>

                                        <div className="admin-clinic-detail-input-suffix">
                                            <input
                                                type="number"
                                                min="1"
                                                value={serviceForm.duration}
                                                onChange={event =>
                                                    setServiceForm(current => ({
                                                        ...current,
                                                        duration:
                                                            event.target.value
                                                    }))
                                                }
                                                required
                                            />

                                            <span>
                                                min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="admin-clinic-detail-field">
                                        <label>
                                            Price
                                        </label>

                                        <div className="admin-clinic-detail-input-suffix">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={serviceForm.price}
                                                onChange={event =>
                                                    setServiceForm(current => ({
                                                        ...current,
                                                        price:
                                                            event.target.value
                                                    }))
                                                }
                                                required
                                            />

                                            <span>
                                                RON
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                <div className="admin-clinic-detail-field">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        rows="5"
                                        value={serviceForm.description}
                                        onChange={event =>
                                            setServiceForm(current => ({
                                                ...current,
                                                description:
                                                    event.target.value
                                            }))
                                        }
                                        placeholder="Describe the veterinary service..."
                                    />

                                </div>

                                <div className="admin-clinic-detail-form-actions">

                                    {editingServiceId && (
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={cancelServiceEdit}
                                        >
                                            Cancel
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : editingServiceId
                                                ? 'Save service'
                                                : 'Add service'}
                                    </button>

                                </div>

                            </form>

                            <section className="admin-clinic-detail-resource-panel">

                                <SectionHeading
                                    label="SERVICES"
                                    title="Clinic services"
                                    text={`${services.length} ${services.length === 1
                                        ? 'service'
                                        : 'services'
                                        } available`}
                                />

                                {sortedServices.length === 0 ? (
                                    <EmptyState
                                        title="No services"
                                        text="Add the first veterinary service to this clinic."
                                    />
                                ) : (
                                    <div className="admin-clinic-detail-service-list">

                                        {sortedServices.map(service => (
                                            <article
                                                key={service.id}
                                                className="admin-clinic-detail-service"
                                            >

                                                <div className="admin-clinic-detail-service-heading">

                                                    <div>
                                                        <span>
                                                            SERVICE
                                                        </span>

                                                        <h3>
                                                            {service.serviceName}
                                                        </h3>
                                                    </div>

                                                    <strong>
                                                        {formatPrice(service.price)}
                                                    </strong>

                                                </div>

                                                <p>
                                                    {service.description ||
                                                        'No description provided.'}
                                                </p>

                                                <div className="admin-clinic-detail-service-footer">

                                                    <span>
                                                        {service.duration} minutes
                                                    </span>

                                                    <div className="admin-clinic-detail-resource-actions">

                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            onClick={() =>
                                                                editService(service)
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="danger-button"
                                                            onClick={() =>
                                                                openDeleteService(service)
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>

                                            </article>
                                        ))}

                                    </div>
                                )}

                            </section>

                        </div>
                    )}

                    {/* ================= SCHEDULE ================= */}

                    {tab === 'schedule' && (
                        <div className="admin-clinic-detail-management">

                            <form
                                className="admin-clinic-detail-panel admin-clinic-detail-form-panel"
                                onSubmit={submitAvailability}
                            >

                                <SectionHeading
                                    label={
                                        editingAvailability
                                            ? 'EDIT SCHEDULE'
                                            : 'NEW SCHEDULE'
                                    }
                                    title={
                                        editingAvailability
                                            ? 'Edit availability'
                                            : 'Add availability'
                                    }
                                    text="Availability is configured for a specific veterinarian and date."
                                />

                                <div className="admin-clinic-detail-field">

                                    <label>
                                        Veterinarian
                                    </label>

                                    <select
                                        value={
                                            availabilityForm.veterinarianId
                                        }
                                        disabled={
                                            Boolean(editingAvailability)
                                        }
                                        onChange={event =>
                                            setAvailabilityForm(current => ({
                                                ...current,
                                                veterinarianId:
                                                    event.target.value
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select veterinarian
                                        </option>

                                        {sortedVeterinarians.map(vet => (
                                            <option
                                                key={vet.id}
                                                value={vet.id}
                                            >
                                                Dr. {getVetName(vet)}
                                            </option>
                                        ))}
                                    </select>

                                </div>

                                <div className="admin-clinic-detail-field">

                                    <label>
                                        Date
                                    </label>

                                    <input
                                        type="date"
                                        value={availabilityForm.day}
                                        disabled={
                                            Boolean(editingAvailability)
                                        }
                                        onChange={event =>
                                            setAvailabilityForm(current => ({
                                                ...current,
                                                day:
                                                    event.target.value
                                            }))
                                        }
                                        required
                                    />

                                </div>

                                <div className="admin-clinic-detail-form-grid">

                                    <div className="admin-clinic-detail-field">

                                        <label>
                                            Start time
                                        </label>

                                        <input
                                            type="time"
                                            value={
                                                availabilityForm.startHour
                                            }
                                            onChange={event =>
                                                setAvailabilityForm(current => ({
                                                    ...current,
                                                    startHour:
                                                        event.target.value
                                                }))
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="admin-clinic-detail-field">

                                        <label>
                                            End time
                                        </label>

                                        <input
                                            type="time"
                                            value={
                                                availabilityForm.endHour
                                            }
                                            onChange={event =>
                                                setAvailabilityForm(current => ({
                                                    ...current,
                                                    endHour:
                                                        event.target.value
                                                }))
                                            }
                                            required
                                        />

                                    </div>

                                </div>

                                <div className="admin-clinic-detail-form-actions">

                                    {editingAvailability && (
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={
                                                cancelAvailabilityEdit
                                            }
                                        >
                                            Cancel
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            saving ||
                                            veterinarians.length === 0
                                        }
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : editingAvailability
                                                ? 'Save schedule'
                                                : 'Add schedule'}
                                    </button>

                                </div>

                            </form>

                            <section className="admin-clinic-detail-resource-panel">

                                <SectionHeading
                                    label="AVAILABILITY"
                                    title="Work schedule"
                                    text={`${availability.length} ${availability.length === 1
                                        ? 'schedule entry'
                                        : 'schedule entries'
                                        }`}
                                />

                                {sortedAvailability.length === 0 ? (
                                    <EmptyState
                                        title="No work schedule"
                                        text="Add availability for the clinic veterinarians."
                                    />
                                ) : (
                                    <div className="admin-clinic-detail-schedule-list">

                                        {sortedAvailability.map(item => (
                                            <article
                                                key={
                                                    `${item.id.veterinarianId}-${item.id.day}`
                                                }
                                                className="admin-clinic-detail-schedule"
                                            >

                                                <div className="admin-clinic-detail-schedule-date">

                                                    <strong>
                                                        {item.id.day
                                                            ?.split('-')[2]}
                                                    </strong>

                                                    <span>
                                                        {new Date(
                                                            `${item.id.day}T00:00:00`
                                                        )
                                                            .toLocaleString(
                                                                'en-GB',
                                                                {
                                                                    month: 'short'
                                                                }
                                                            )
                                                            .toUpperCase()}
                                                    </span>

                                                </div>

                                                <div className="admin-clinic-detail-schedule-info">

                                                    <div className="admin-clinic-detail-schedule-heading">

                                                        <div>
                                                            <h3>
                                                                Dr. {getVetNameById(
                                                                    item.id.veterinarianId
                                                                )}
                                                            </h3>

                                                            <p>
                                                                {formatDate(
                                                                    item.id.day
                                                                )}
                                                            </p>
                                                        </div>

                                                        <strong>
                                                            {item.startHour?.slice(0, 5)}
                                                            {' – '}
                                                            {item.endHour?.slice(0, 5)}
                                                        </strong>

                                                    </div>

                                                    <div className="admin-clinic-detail-resource-actions">

                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            onClick={() =>
                                                                editAvailability(item)
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="danger-button"
                                                            onClick={() =>
                                                                openDeleteAvailability(item)
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>

                                            </article>
                                        ))}

                                    </div>
                                )}

                            </section>

                        </div>
                    )}

                </div>
            </main>

            {deleteTarget && (
                <div
                    className="admin-clinic-detail-modal-backdrop"
                    onMouseDown={() => {
                        if (!deleting) {
                            setDeleteTarget(null);
                        }
                    }}
                >

                    <div
                        className="admin-clinic-detail-modal"
                        onMouseDown={event =>
                            event.stopPropagation()
                        }
                    >

                        <span>
                            CONFIRM DELETE
                        </span>

                        <h2>
                            {deleteTarget.title}
                        </h2>

                        <p>
                            {deleteTarget.description}
                        </p>

                        <div className="admin-clinic-detail-modal-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                disabled={deleting}
                                onClick={() =>
                                    setDeleteTarget(null)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="admin-clinic-detail-delete-confirm"
                                disabled={deleting}
                                onClick={confirmDelete}
                            >
                                {deleting
                                    ? 'Deleting...'
                                    : 'Delete'}
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </>
    );
}

function Summary({ label, value, text }) {
    return (
        <div className="admin-clinic-detail-summary-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{text}</p>
        </div>
    );
}

function Tab({
    active,
    onClick,
    title,
    count
}) {
    return (
        <button
            type="button"
            className={active ? 'active' : ''}
            onClick={onClick}
        >
            {title}

            {count !== undefined && (
                <span>{count}</span>
            )}
        </button>
    );
}

function SectionHeading({
    label,
    title,
    text
}) {
    return (
        <div className="admin-clinic-detail-section-heading">
            <span>{label}</span>
            <h2>{title}</h2>
            {text && <p>{text}</p>}
        </div>
    );
}

function FormField({
    label,
    value,
    onChange,
    full = false,
    disabled = false
}) {
    return (
        <div
            className={
                `admin-clinic-detail-field${full ? ' full' : ''
                }`
            }
        >
            <label>{label}</label>

            <input
                value={value ?? ''}
                disabled={disabled}
                onChange={
                    disabled
                        ? undefined
                        : event =>
                            onChange(event.target.value)
                }
                required={!disabled}
            />
        </div>
    );
}

function EmptyState({ title, text }) {
    return (
        <div className="admin-clinic-detail-empty">
            <div>+</div>
            <h3>{title}</h3>
            <p>{text}</p>
        </div>
    );
}