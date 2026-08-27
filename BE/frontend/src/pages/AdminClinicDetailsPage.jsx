import {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Link,
    useNavigate,
    useParams
} from 'react-router-dom';

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
    updateVetService
} from '../features/admin/services/adminClinicService';

import './AdminClinics.css';


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


    const [clinic, setClinic] =
        useState(null);

    const [veterinarians, setVeterinarians] =
        useState([]);

    const [services, setServices] =
        useState([]);

    const [availability, setAvailability] =
        useState([]);

    const [users, setUsers] =
        useState([]);

    const [allVeterinarians, setAllVeterinarians] =
        useState([]);


    const [tab, setTab] =
        useState('clinic');


    const [clinicForm, setClinicForm] =
        useState({
            name: '',
            address: '',
            city: '',
            phone: ''
        });


    const [vetForm, setVetForm] =
        useState({
            userId: '',
            surgeon: false
        });


    const [serviceForm, setServiceForm] =
        useState(EMPTY_SERVICE);

    const [editingServiceId, setEditingServiceId] =
        useState(null);


    const [
        availabilityForm,
        setAvailabilityForm
    ] = useState(
        EMPTY_AVAILABILITY
    );

    const [
        editingAvailability,
        setEditingAvailability
    ] = useState(null);


    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);


    const loadData = async () => {

        setLoading(true);
        setError(null);

        try {

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
                address:
                    clinicData.address || '',
                city: clinicData.city || '',
                phone: clinicData.phone || ''
            });


            setVeterinarians(clinicVets);

            setServices(clinicServices);

            setUsers(usersData);

            setAllVeterinarians(allVets);


            const vetIds =
                new Set(
                    clinicVets.map(
                        (vet) => vet.id
                    )
                );


            setAvailability(
                availabilityData.filter(
                    (item) =>
                        vetIds.has(
                            item.id
                                ?.veterinarianId
                        )
                )
            );

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadData();
    }, [id]);


    const usersById =
        useMemo(() => {

            const map = {};

            users.forEach((user) => {
                map[user.id] = user;
            });

            return map;

        }, [users]);


    const availableUsers =
        useMemo(() => {

            const existingVetUsers =
                new Set(
                    allVeterinarians.map(
                        (vet) => vet.userId
                    )
                );


            return users.filter(
                (user) =>
                    !existingVetUsers.has(
                        user.id
                    )
            );

        }, [
            users,
            allVeterinarians
        ]);


    const getVetName = (
        veterinarianId
    ) => {

        const vet =
            veterinarians.find(
                (item) =>
                    item.id === veterinarianId
            );


        if (!vet) {
            return 'Unknown veterinarian';
        }


        return (
            usersById[vet.userId]?.name
            || 'Veterinarian'
        );
    };


    /* =====================================
       CLINIC
    ===================================== */

    const saveClinic = async (e) => {

        e.preventDefault();

        try {

            setError(null);

            const updated =
                await updateClinic(
                    id,
                    clinicForm
                );


            setClinic(updated);

        } catch (err) {

            setError(err.message);

        }
    };


    const removeClinic = async () => {

        const confirmed =
            window.confirm(
                `Delete clinic "${clinic.name}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await deleteClinicSafely(id);

            navigate(
                '/admin/clinics',
                { replace: true }
            );

        } catch (err) {

            setError(err.message);

        }
    };


    /* =====================================
       VETERINARIANS
    ===================================== */

    const createVeterinarian =
        async (e) => {

            e.preventDefault();

            try {

                setError(null);


                await addVeterinarian({
                    userId:
                        vetForm.userId,

                    clinicId: id,

                    surgeon:
                        vetForm.surgeon
                });


                setVetForm({
                    userId: '',
                    surgeon: false
                });


                await loadData();

            } catch (err) {

                setError(err.message);

            }
        };


    const toggleSurgeon =
        async (vet) => {

            try {

                setError(null);


                await updateVeterinarian(
                    vet.id,
                    {
                        surgeon:
                            !vet.surgeon
                    }
                );


                await loadData();

            } catch (err) {

                setError(err.message);

            }
        };


    const removeVeterinarian =
        async (vet) => {

            const name =
                usersById[
                    vet.userId
                ]?.name
                || 'this veterinarian';


            if (
                !window.confirm(
                    `Delete ${name} from this clinic?`
                )
            ) {
                return;
            }


            try {

                setError(null);

                await deleteVeterinarian(
                    vet.id
                );

                await loadData();

            } catch (err) {

                setError(err.message);

            }
        };


    /* =====================================
       SERVICES
    ===================================== */

    const submitService = async (e) => {

        e.preventDefault();

        try {

            setError(null);


            const payload = {

                serviceName:
                    serviceForm.serviceName,

                duration:
                    Number(
                        serviceForm.duration
                    ),

                price:
                    Number(
                        serviceForm.price
                    ),

                description:
                    serviceForm.description
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


            setEditingServiceId(null);

            setServiceForm(
                EMPTY_SERVICE
            );


            await loadData();

        } catch (err) {

            setError(err.message);

        }
    };


    const editService = (service) => {

        setEditingServiceId(
            service.id
        );


        setServiceForm({

            serviceName:
                service.serviceName,

            duration:
                service.duration,

            price:
                service.price,

            description:
                service.description || ''
        });
    };


    const removeService = async (
        service
    ) => {

        if (
            !window.confirm(
                `Delete "${service.serviceName}"?`
            )
        ) {
            return;
        }


        try {

            await deleteVetService(
                service.id
            );

            await loadData();

        } catch (err) {

            setError(err.message);

        }
    };


    /* =====================================
       AVAILABILITY
    ===================================== */

    const submitAvailability =
        async (e) => {

            e.preventDefault();

            try {

                setError(null);


                if (editingAvailability) {

                    await updateAvailability(

                        editingAvailability
                            .veterinarianId,

                        editingAvailability
                            .day,

                        {
                            startHour:
                                availabilityForm
                                    .startHour,

                            endHour:
                                availabilityForm
                                    .endHour
                        }
                    );

                } else {

                    await addAvailability(
                        availabilityForm
                    );

                }


                setEditingAvailability(
                    null
                );

                setAvailabilityForm(
                    EMPTY_AVAILABILITY
                );


                await loadData();

            } catch (err) {

                setError(err.message);

            }
        };


    const editAvailability =
        (item) => {

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
                    item.startHour
                        ?.slice(0, 5),

                endHour:
                    item.endHour
                        ?.slice(0, 5)
            });
        };


    const removeAvailability =
        async (item) => {

            if (
                !window.confirm(
                    'Delete this work schedule?'
                )
            ) {
                return;
            }


            try {

                await deleteAvailability(
                    item.id.veterinarianId,
                    item.id.day
                );

                await loadData();

            } catch (err) {

                setError(err.message);

            }
        };


    if (loading) {

        return (
            <>
                <Navbar />

                <div className="admin-loading">
                    Loading clinic...
                </div>
            </>
        );
    }


    if (!clinic) {

        return (
            <>
                <Navbar />

                <div className="admin-loading">
                    Clinic not found.
                </div>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="admin-clinics-page">

                <div className="admin-clinics-container">


                    <Link
                        to="/admin/clinics"
                        className="admin-back-link"
                    >
                        ← Back to clinics
                    </Link>


                    <div className="admin-clinic-detail-header">

                        <div>

                            <p className="admin-section-eyebrow">
                                CLINIC MANAGEMENT
                            </p>

                            <h1>
                                {clinic.name}
                            </h1>

                            <p>
                                {clinic.address},
                                {' '}
                                {clinic.city}
                            </p>

                        </div>


                        <button
                            type="button"
                            className="admin-delete-button-large"
                            onClick={removeClinic}
                        >
                            Delete clinic
                        </button>

                    </div>


                    {error && (

                        <div className="admin-error-box">
                            {error}
                        </div>

                    )}


                    <div className="admin-tabs">

                        <button
                            className={
                                tab === 'clinic'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setTab('clinic')
                            }
                        >
                            Clinic
                        </button>


                        <button
                            className={
                                tab === 'vets'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setTab('vets')
                            }
                        >
                            Veterinarians
                        </button>


                        <button
                            className={
                                tab === 'services'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setTab('services')
                            }
                        >
                            Services
                        </button>


                        <button
                            className={
                                tab === 'schedule'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setTab('schedule')
                            }
                        >
                            Work schedule
                        </button>

                    </div>


                    {/* =========================
                        CLINIC TAB
                    ========================= */}

                    {tab === 'clinic' && (

                        <form
                            className="admin-detail-card"
                            onSubmit={saveClinic}
                        >

                            <div className="admin-card-heading">

                                <div>
                                    <h2>
                                        Clinic details
                                    </h2>

                                    <p>
                                        Update the clinic
                                        information.
                                    </p>
                                </div>

                            </div>


                            <div className="admin-form-grid">

                                {[
                                    [
                                        'name',
                                        'Clinic name'
                                    ],

                                    [
                                        'city',
                                        'City'
                                    ],

                                    [
                                        'address',
                                        'Address'
                                    ],

                                    [
                                        'phone',
                                        'Phone'
                                    ]

                                ].map(
                                    ([
                                        field,
                                        label
                                    ]) => (

                                        <div
                                            className="admin-form-group"
                                            key={field}
                                        >

                                            <label>
                                                {label}
                                            </label>

                                            <input
                                                value={
                                                    clinicForm[
                                                    field
                                                    ]
                                                }
                                                onChange={
                                                    (e) =>
                                                        setClinicForm(
                                                            {
                                                                ...clinicForm,

                                                                [field]:
                                                                    e
                                                                        .target
                                                                        .value
                                                            }
                                                        )
                                                }
                                                required
                                            />

                                        </div>

                                    )
                                )}

                            </div>


                            <div className="admin-form-actions">

                                <button
                                    className="admin-primary-button"
                                    type="submit"
                                >
                                    Save clinic changes
                                </button>

                            </div>

                        </form>

                    )}


                    {/* =========================
                        VETS TAB
                    ========================= */}

                    {tab === 'vets' && (

                        <div className="admin-management-layout">


                            <form
                                className="admin-detail-card"
                                onSubmit={
                                    createVeterinarian
                                }
                            >

                                <div className="admin-card-heading">

                                    <div>
                                        <h2>
                                            Add veterinarian
                                        </h2>

                                        <p>
                                            Select an existing
                                            VETApp user.
                                        </p>
                                    </div>

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        User
                                    </label>

                                    <select
                                        value={
                                            vetForm.userId
                                        }
                                        onChange={(e) =>
                                            setVetForm({
                                                ...vetForm,

                                                userId:
                                                    e.target
                                                        .value
                                            })
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select user
                                        </option>

                                        {availableUsers.map(
                                            (user) => (

                                                <option
                                                    value={
                                                        user.id
                                                    }
                                                    key={
                                                        user.id
                                                    }
                                                >
                                                    {user.name}
                                                    {' — '}
                                                    {user.email}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                <label className="admin-checkbox">

                                    <input
                                        type="checkbox"
                                        checked={
                                            vetForm.surgeon
                                        }
                                        onChange={(e) =>
                                            setVetForm({
                                                ...vetForm,

                                                surgeon:
                                                    e.target
                                                        .checked
                                            })
                                        }
                                    />

                                    Surgeon

                                </label>


                                <div className="admin-form-actions">

                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                    >
                                        Add veterinarian
                                    </button>

                                </div>

                            </form>


                            <div className="admin-resource-list">

                                {veterinarians.map(
                                    (vet) => {

                                        const user =
                                            usersById[
                                            vet.userId
                                            ];


                                        return (

                                            <article
                                                className="admin-resource-card"
                                                key={vet.id}
                                            >

                                                <div>

                                                    <h3>
                                                        {user?.name
                                                            || 'Veterinarian'}
                                                    </h3>

                                                    <p>
                                                        {user?.email}
                                                    </p>

                                                    <span>
                                                        {vet.surgeon
                                                            ? 'Surgeon'
                                                            : 'Veterinarian'}
                                                    </span>

                                                </div>


                                                <div className="admin-resource-actions">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleSurgeon(
                                                                vet
                                                            )
                                                        }
                                                    >
                                                        {vet.surgeon
                                                            ? 'Remove surgeon'
                                                            : 'Make surgeon'}
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="danger"
                                                        onClick={() =>
                                                            removeVeterinarian(
                                                                vet
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </article>

                                        );
                                    }
                                )}

                            </div>

                        </div>

                    )}


                    {/* =========================
                        SERVICES TAB
                    ========================= */}

                    {tab === 'services' && (

                        <div className="admin-management-layout">


                            <form
                                className="admin-detail-card"
                                onSubmit={
                                    submitService
                                }
                            >

                                <div className="admin-card-heading">

                                    <div>
                                        <h2>
                                            {editingServiceId
                                                ? 'Edit service'
                                                : 'Add service'}
                                        </h2>
                                    </div>

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Service name
                                    </label>

                                    <input
                                        value={
                                            serviceForm
                                                .serviceName
                                        }
                                        onChange={(e) =>
                                            setServiceForm({
                                                ...serviceForm,

                                                serviceName:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="admin-form-grid">

                                    <div className="admin-form-group">

                                        <label>
                                            Duration (minutes)
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                serviceForm
                                                    .duration
                                            }
                                            onChange={(e) =>
                                                setServiceForm({
                                                    ...serviceForm,

                                                    duration:
                                                        e.target
                                                            .value
                                                })
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="admin-form-group">

                                        <label>
                                            Price (RON)
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                serviceForm
                                                    .price
                                            }
                                            onChange={(e) =>
                                                setServiceForm({
                                                    ...serviceForm,

                                                    price:
                                                        e.target
                                                            .value
                                                })
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            serviceForm
                                                .description
                                        }
                                        onChange={(e) =>
                                            setServiceForm({
                                                ...serviceForm,

                                                description:
                                                    e.target
                                                        .value
                                            })
                                        }
                                    />

                                </div>


                                <div className="admin-form-actions">

                                    {editingServiceId && (

                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={() => {

                                                setEditingServiceId(
                                                    null
                                                );

                                                setServiceForm(
                                                    EMPTY_SERVICE
                                                );
                                            }}
                                        >
                                            Cancel edit
                                        </button>

                                    )}


                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                    >
                                        {editingServiceId
                                            ? 'Save service'
                                            : 'Add service'}
                                    </button>

                                </div>

                            </form>


                            <div className="admin-resource-list">

                                {services.map(
                                    (service) => (

                                        <article
                                            className="admin-resource-card"
                                            key={
                                                service.id
                                            }
                                        >

                                            <div>

                                                <h3>
                                                    {
                                                        service
                                                            .serviceName
                                                    }
                                                </h3>

                                                <p>
                                                    {
                                                        service
                                                            .description
                                                    }
                                                </p>

                                                <span>
                                                    {
                                                        service
                                                            .duration
                                                    }
                                                    {' min • '}
                                                    {
                                                        service
                                                            .price
                                                    }
                                                    {' RON'}
                                                </span>

                                            </div>


                                            <div className="admin-resource-actions">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        editService(
                                                            service
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>


                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        removeService(
                                                            service
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        </div>

                    )}


                    {/* =========================
                        SCHEDULE TAB
                    ========================= */}

                    {tab === 'schedule' && (

                        <div className="admin-management-layout">


                            <form
                                className="admin-detail-card"
                                onSubmit={
                                    submitAvailability
                                }
                            >

                                <div className="admin-card-heading">

                                    <div>

                                        <h2>
                                            {editingAvailability
                                                ? 'Edit work schedule'
                                                : 'Add work schedule'}
                                        </h2>

                                        <p>
                                            Programul backendului
                                            actual este definit pe
                                            dată concretă.
                                        </p>

                                    </div>

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Veterinarian
                                    </label>

                                    <select
                                        value={
                                            availabilityForm
                                                .veterinarianId
                                        }
                                        disabled={
                                            Boolean(
                                                editingAvailability
                                            )
                                        }
                                        onChange={(e) =>
                                            setAvailabilityForm({
                                                ...availabilityForm,

                                                veterinarianId:
                                                    e.target
                                                        .value
                                            })
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select veterinarian
                                        </option>

                                        {veterinarians.map(
                                            (vet) => (

                                                <option
                                                    key={
                                                        vet.id
                                                    }
                                                    value={
                                                        vet.id
                                                    }
                                                >
                                                    {
                                                        usersById[
                                                            vet
                                                                .userId
                                                        ]?.name
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            availabilityForm
                                                .day
                                        }
                                        disabled={
                                            Boolean(
                                                editingAvailability
                                            )
                                        }
                                        onChange={(e) =>
                                            setAvailabilityForm({
                                                ...availabilityForm,

                                                day:
                                                    e.target
                                                        .value
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="admin-form-grid">

                                    <div className="admin-form-group">

                                        <label>
                                            Start
                                        </label>

                                        <input
                                            type="time"
                                            value={
                                                availabilityForm
                                                    .startHour
                                            }
                                            onChange={(e) =>
                                                setAvailabilityForm({
                                                    ...availabilityForm,

                                                    startHour:
                                                        e.target
                                                            .value
                                                })
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="admin-form-group">

                                        <label>
                                            End
                                        </label>

                                        <input
                                            type="time"
                                            value={
                                                availabilityForm
                                                    .endHour
                                            }
                                            onChange={(e) =>
                                                setAvailabilityForm({
                                                    ...availabilityForm,

                                                    endHour:
                                                        e.target
                                                            .value
                                                })
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                <div className="admin-form-actions">

                                    {editingAvailability && (

                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={() => {

                                                setEditingAvailability(
                                                    null
                                                );

                                                setAvailabilityForm(
                                                    EMPTY_AVAILABILITY
                                                );
                                            }}
                                        >
                                            Cancel
                                        </button>

                                    )}


                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                    >
                                        {editingAvailability
                                            ? 'Save schedule'
                                            : 'Add schedule'}
                                    </button>

                                </div>

                            </form>


                            <div className="admin-resource-list">

                                {availability
                                    .slice()
                                    .sort(
                                        (a, b) =>
                                            a.id.day.localeCompare(
                                                b.id.day
                                            )
                                    )
                                    .map((item) => (

                                        <article
                                            className="admin-resource-card"
                                            key={
                                                `${item.id.veterinarianId}-${item.id.day}`
                                            }
                                        >

                                            <div>

                                                <h3>
                                                    {getVetName(
                                                        item.id
                                                            .veterinarianId
                                                    )}
                                                </h3>

                                                <p>
                                                    {
                                                        item.id
                                                            .day
                                                    }
                                                </p>

                                                <span>
                                                    {
                                                        item
                                                            .startHour
                                                            ?.slice(
                                                                0,
                                                                5
                                                            )
                                                    }
                                                    {' — '}
                                                    {
                                                        item
                                                            .endHour
                                                            ?.slice(
                                                                0,
                                                                5
                                                            )
                                                    }
                                                </span>

                                            </div>


                                            <div className="admin-resource-actions">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        editAvailability(
                                                            item
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        removeAvailability(
                                                            item
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </article>

                                    ))}

                            </div>

                        </div>

                    )}

                </div>

            </main>
        </>
    );
}