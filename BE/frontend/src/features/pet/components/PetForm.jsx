import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PetForm.css';

export default function PetForm({ initialData = null, onSubmit, onCancel, loading = false, error = null, submitLabel = 'Save pet' }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', species: '', race: '', dob: '', sex: '' });

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name || '',
                species: initialData.species || '',
                race: initialData.race || '',
                dob: formatDobForDisplay(initialData.dob),
                sex: initialData.sex || ''
            });
        }
    }, [initialData]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleDobChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 8);

        if (value.length > 4) value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
        else if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;

        setForm({ ...form, dob: value });
    };

    const formatDobForDisplay = (dob) => {
        if (!dob) return '';

        const date = dob.split('T')[0];
        const [year, month, day] = date.split('-');

        return `${day}/${month}/${year}`;
    };

    return (
        <form className="pet-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>

            <div className="pet-form-card">
                <div className="pet-form-heading">
                    <h2>Pet information</h2>
                    <p>Enter the basic information used in appointments and medical records.</p>
                </div>

                <div className="pet-form-group">
                    <label>Pet name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Luna" required />
                </div>

                <div className="pet-form-row">
                    <div className="pet-form-group">
                        <label>Species</label>
                        <input name="species" value={form.species} onChange={handleChange} placeholder="e.g. Cat" required />
                    </div>

                    <div className="pet-form-group">
                        <label>Breed</label>
                        <input name="race" value={form.race} onChange={handleChange} placeholder="e.g. British Shorthair" />
                    </div>
                </div>

                <div className="pet-form-row">
                    <div className="pet-form-group">
                        <label>Date of birth</label>
                        <input name="dob"
                            type="text"
                            value={form.dob}
                            onChange={handleDobChange}
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            required
                        />
                    </div>

                    <div className="pet-form-group">
                        <label>Sex</label>
                        <select name="sex" value={form.sex} onChange={handleChange} required>
                            <option value="">Select sex</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="pet-form-error">{error}</div>}

            <div className="pet-form-actions">
                <button type="button" className="secondary-button" onClick={() => onCancel ? onCancel() : navigate('/pets')} disabled={loading}>
                    Cancel
                </button>

                <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? 'Saving...' : submitLabel}
                </button>
            </div>

        </form>
    );
}