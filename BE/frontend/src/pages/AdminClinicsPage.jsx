import {
    useEffect,
    useMemo,
    useState
} from 'react';

import { Link } from 'react-router-dom';

import Navbar from '../shared/components/Navbar';

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
    phone: ''
};


export default function AdminClinicsPage() {

    const [clinics, setClinics] = useState([]);

    const [search, setSearch] = useState('');

    const [form, setForm] =
        useState(EMPTY_FORM);

    const [showAddForm, setShowAddForm] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState(null);


    const loadClinics = async () => {

        setLoading(true);
        setError(null);

        try {

            const data =
                await getAllClinics();

            setClinics(data);

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadClinics();
    }, []);


    const filteredClinics =
        useMemo(() => {

            const value =
                search.trim().toLowerCase();

            if (!value) {
                return clinics;
            }


            return clinics.filter(
                (clinic) =>

                    clinic.name
                        ?.toLowerCase()
                        .includes(value)

                    ||

                    clinic.city
                        ?.toLowerCase()
                        .includes(value)

                    ||

                    clinic.address
                        ?.toLowerCase()
                        .includes(value)
            );

        }, [clinics, search]);


    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };


    const handleCreate = async (e) => {

        e.preventDefault();

        setSaving(true);
        setError(null);

        try {

            await addClinic({
                ...form,

                /*
                 * Clinica nouă nu are reviews.
                 */
                rating: 0
            });


            setForm(EMPTY_FORM);
            setShowAddForm(false);

            await loadClinics();

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);

        }
    };


    const handleDelete = async (
        clinic
    ) => {

        const confirmed =
            window.confirm(
                `Delete clinic "${clinic.name}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setError(null);

            await deleteClinicSafely(
                clinic.id
            );


            await loadClinics();

        } catch (err) {

            setError(err.message);

        }
    };


    return (
        <>
            <Navbar />

            <main className="admin-clinics-page">

                <div className="admin-clinics-container">


                    <div className="admin-clinics-top">

                        <div>

                            <p className="admin-section-eyebrow">
                                ADMINISTRATION
                            </p>

                            <h1>
                                Manage clinics
                            </h1>

                            <p>
                                Create, edit and manage
                                veterinary clinics and their
                                resources.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={() =>
                                setShowAddForm(
                                    !showAddForm
                                )
                            }
                        >
                            <span>+</span>

                            Add clinic
                        </button>

                    </div>


                    {error && (

                        <div className="admin-error-box">
                            {error}
                        </div>

                    )}


                    {showAddForm && (

                        <form
                            className="admin-create-card"
                            onSubmit={handleCreate}
                        >

                            <div className="admin-card-heading">

                                <div>

                                    <p className="admin-section-eyebrow">
                                        NEW CLINIC
                                    </p>

                                    <h2>
                                        Clinic information
                                    </h2>

                                </div>

                            </div>


                            <div className="admin-form-grid">

                                <div className="admin-form-group">

                                    <label>
                                        Clinic name
                                    </label>

                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="GreenVet Clinic"
                                        required
                                    />

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        City
                                    </label>

                                    <input
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Cluj-Napoca"
                                        required
                                    />

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Address
                                    </label>

                                    <input
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        placeholder="Street and number"
                                        required
                                    />

                                </div>


                                <div className="admin-form-group">

                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+40..."
                                        required
                                    />

                                </div>

                            </div>


                            <div className="admin-form-actions">

                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setForm(EMPTY_FORM);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Creating...'
                                        : 'Create clinic'}
                                </button>

                            </div>

                        </form>

                    )}


                    <div className="admin-clinics-toolbar">

                        <input
                            type="text"
                            placeholder="Search clinics..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                        <span>
                            {filteredClinics.length}
                            {' '}
                            clinics
                        </span>

                    </div>


                    {loading ? (

                        <div className="admin-loading">
                            Loading clinics...
                        </div>

                    ) : (

                        <div className="admin-clinic-grid">

                            {filteredClinics.map(
                                (clinic) => (

                                    <article
                                        className="admin-clinic-card"
                                        key={clinic.id}
                                    >

                                        <Link
                                            to={`/admin/clinics/${clinic.id}`}
                                            className="admin-clinic-main"
                                        >

                                            <div className="admin-clinic-icon">
                                                +
                                            </div>


                                            <div>

                                                <h2>
                                                    {clinic.name}
                                                </h2>

                                                <p className="admin-clinic-city">
                                                    {clinic.city}
                                                </p>

                                                <p>
                                                    {clinic.address}
                                                </p>

                                                <p>
                                                    {clinic.phone}
                                                </p>

                                            </div>

                                        </Link>


                                        <div className="admin-clinic-card-bottom">

                                            <Link
                                                to={`/admin/clinics/${clinic.id}`}
                                                className="admin-manage-link"
                                            >
                                                Manage clinic →
                                            </Link>


                                            <button
                                                type="button"
                                                className="admin-delete-button"
                                                onClick={() =>
                                                    handleDelete(
                                                        clinic
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

                    )}

                </div>

            </main>
        </>
    );
}