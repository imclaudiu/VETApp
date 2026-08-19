import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { addClinic } from '../../features/clinic/services/clinicService';

import './AddClinicPage.css';

export default function AddClinicPage() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        address: '',
        city: '',
        phone: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value
        }));
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError(null);

        try {

            await addClinic({
                name: form.name,
                address: form.address,
                city: form.city,
                phone: form.phone,

                /*
                 * Backend-ul cere rating NOT NULL.
                 * O clinică nouă începe fără review-uri.
                 */
                rating: 0
            });

            navigate('/dashboard');

        } catch (err) {

            setError(
                err.message ||
                'Could not create clinic.'
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <>
            <Navbar />

            <main className="add-clinic-page">

                <div className="add-clinic-container">

                    <div className="add-clinic-back">

                        <Link to="/dashboard">
                            ← Back to dashboard
                        </Link>

                    </div>


                    <section className="add-clinic-header">

                        <p className="add-clinic-eyebrow">
                            ADMINISTRATION
                        </p>

                        <h1>Add a new clinic</h1>

                        <p>
                            Register a veterinary clinic in VETApp.
                        </p>

                    </section>


                    <div className="add-clinic-layout">


                        {/* FORM */}

                        <form
                            className="add-clinic-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="add-clinic-form-header">

                                <span>01</span>

                                <div>
                                    <h2>
                                        Clinic information
                                    </h2>

                                    <p>
                                        Enter the clinic's general
                                        information.
                                    </p>
                                </div>

                            </div>


                            <div className="add-clinic-fields">


                                {/* NAME */}

                                <div className="add-clinic-group">

                                    <label htmlFor="name">
                                        Clinic name
                                    </label>

                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="e.g. GreenVet Clinic"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>


                                {/* CITY + PHONE */}

                                <div className="add-clinic-row">

                                    <div className="add-clinic-group">

                                        <label htmlFor="city">
                                            City
                                        </label>

                                        <input
                                            id="city"
                                            name="city"
                                            type="text"
                                            placeholder="e.g. Cluj-Napoca"
                                            value={form.city}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>


                                    <div className="add-clinic-group">

                                        <label htmlFor="phone">
                                            Phone number
                                        </label>

                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+40 264..."
                                            value={form.phone}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>

                                </div>


                                {/* ADDRESS */}

                                <div className="add-clinic-group">

                                    <label htmlFor="address">
                                        Address
                                    </label>

                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        placeholder="Street, number..."
                                        value={form.address}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>


                            </div>


                            {error && (

                                <div className="add-clinic-error">

                                    <strong>
                                        Could not create clinic
                                    </strong>

                                    <p>
                                        {error}
                                    </p>

                                </div>

                            )}


                            <div className="add-clinic-actions">

                                <button
                                    type="button"
                                    className="clinic-cancel-button"
                                    onClick={() =>
                                        navigate('/dashboard')
                                    }
                                    disabled={loading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="clinic-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? 'Creating clinic...'
                                        : 'Create clinic'}
                                </button>

                            </div>

                        </form>


                        {/* SIDEBAR */}

                        <aside className="add-clinic-sidebar">

                            <div className="add-clinic-info">

                                <div className="add-clinic-info-icon">
                                    +
                                </div>

                                <h2>
                                    New veterinary clinic
                                </h2>

                                <p>
                                    Once created, the clinic can have
                                    veterinarians, services and
                                    availability associated with it.
                                </p>


                                <div className="add-clinic-info-items">

                                    <div>
                                        <span>01</span>

                                        <p>
                                            Add veterinarians
                                        </p>
                                    </div>

                                    <div>
                                        <span>02</span>

                                        <p>
                                            Add veterinary services
                                        </p>
                                    </div>

                                    <div>
                                        <span>03</span>

                                        <p>
                                            Configure availability
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </aside>


                    </div>

                </div>

            </main>
        </>
    );
}