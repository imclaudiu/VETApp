import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './PetForm.css';

export default function PetForm({
    initialData = null,
    onSubmit,
    loading = false,
    error = null,
    submitLabel = 'Save pet'
}) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        species: '',
        race: '',
        dob: '',
        sex: '',
    });

    useEffect(() => {
        if (!initialData) {
            return;
        }

        setForm({
            name: initialData.name || '',
            species: initialData.species || '',
            race: initialData.race || '',
            dob: initialData.dob
                ? initialData.dob.split('T')[0]
                : '',
            sex: initialData.sex || '',
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit(form);
    };

    return (
        <form
            className="pet-form"
            onSubmit={handleSubmit}
        >

            <div className="pet-form-section">

                <div className="pet-form-section-heading">
                    <span className="pet-form-section-number">
                        01
                    </span>

                    <div>
                        <h2>Basic information</h2>

                        <p>
                            Add the general information about your pet.
                        </p>
                    </div>
                </div>


                <div className="pet-form-fields">

                    <div className="pet-form-group pet-form-group-full">

                        <label htmlFor="name">
                            Pet name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="e.g. Luna"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="pet-form-row">

                        <div className="pet-form-group">

                            <label htmlFor="species">
                                Species
                            </label>

                            <input
                                id="species"
                                name="species"
                                type="text"
                                placeholder="e.g. Cat"
                                value={form.species}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        <div className="pet-form-group">

                            <label htmlFor="race">
                                Breed
                            </label>

                            <input
                                id="race"
                                name="race"
                                type="text"
                                placeholder="e.g. British Shorthair"
                                value={form.race}
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                </div>

            </div>


            <div className="pet-form-section">

                <div className="pet-form-section-heading">
                    <span className="pet-form-section-number">
                        02
                    </span>

                    <div>
                        <h2>Additional details</h2>

                        <p>
                            Enter your pet's birth date and sex.
                        </p>
                    </div>
                </div>


                <div className="pet-form-fields">

                    <div className="pet-form-row">

                        <div className="pet-form-group">

                            <label htmlFor="dob">
                                Date of birth
                            </label>

                            <input
                                id="dob"
                                name="dob"
                                type="date"
                                value={form.dob}
                                onChange={handleChange}
                                max={
                                    new Date()
                                        .toISOString()
                                        .split('T')[0]
                                }
                                required
                            />

                        </div>


                        <div className="pet-form-group">

                            <label htmlFor="sex">
                                Sex
                            </label>

                            <select
                                id="sex"
                                name="sex"
                                value={form.sex}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Select sex
                                </option>

                                <option value="M">
                                    Male
                                </option>

                                <option value="F">
                                    Female
                                </option>
                            </select>

                        </div>

                    </div>

                </div>

            </div>


            {error && (
                <div className="pet-form-error">

                    <strong>
                        Could not save pet
                    </strong>

                    <p>
                        {error}
                    </p>

                </div>
            )}


            <div className="pet-form-actions">

                <button
                    type="button"
                    className="pet-form-cancel"
                    onClick={() => navigate('/pets')}
                    disabled={loading}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="pet-form-submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Saving...'
                        : submitLabel}
                </button>

            </div>

        </form>
    );
}