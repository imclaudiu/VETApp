import { useEffect, useState } from 'react';
import Navbar from '../../shared/components/Navbar';

import {
    getMyVeterinarian,
    getVeterinarianSchedule,
    addAvailability,
    updateAvailability,
    deleteAvailability
} from '../../features/veterinarian/services/veterinarianService';

import './VeterinarianSchedulePage.css';

export default function VeterinarianSchedulePage() {

    const [veterinarian, setVeterinarian] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [form, setForm] = useState({
        day: '',
        startHour: '',
        endHour: ''
    });

    const [editingDay, setEditingDay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const loadSchedule = async (veterinarianId) => {
        const data = await getVeterinarianSchedule(veterinarianId);

        const sorted = [...data].sort((a, b) => a.id.day.localeCompare(b.id.day));
        setSchedule(sorted);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const vet = await getMyVeterinarian();
                setVeterinarian(vet);

                await loadSchedule(vet.id);
            } catch (err) {
                setError(err.message || 'Could not load your work schedule.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(current => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!veterinarian) return;

        if (form.endHour <= form.startHour) {
            setError('End time must be after start time.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (editingDay) {
                await updateAvailability(veterinarian.id, editingDay, form.startHour, form.endHour);
            } else {
                await addAvailability(veterinarian.id, form.day, form.startHour, form.endHour);
            }

            setForm({
                day: '',
                startHour: '',
                endHour: ''
            });

            setEditingDay(null);
            await loadSchedule(veterinarian.id);
        } catch (err) {
            if (err.response?.status === 409) {
                setError('You already have a work schedule for this date.');
            } else {
                setError(err.message || 'Could not save work schedule.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (availability) => {
        setEditingDay(availability.id.day);

        setForm({
            day: availability.id.day,
            startHour: availability.startHour?.slice(0, 5) || '',
            endHour: availability.endHour?.slice(0, 5) || ''
        });
    };

    const cancelEdit = () => {
        setEditingDay(null);

        setForm({
            day: '',
            startHour: '',
            endHour: ''
        });
    };

    const handleDelete = async (availability) => {
        const confirmed = window.confirm(`Delete your schedule for ${availability.id.day}?`);

        if (!confirmed) return;

        try {
            setError(null);

            await deleteAvailability(veterinarian.id, availability.id.day);
            await loadSchedule(veterinarian.id);

            if (editingDay === availability.id.day) {
                cancelEdit();
            }
        } catch (err) {
            setError(err.message || 'Could not delete work schedule.');
        }
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date(`${date}T00:00:00`));
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="vet-schedule-loading">Loading your schedule...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="vet-schedule-page">
                <div className="vet-schedule-container">

                    <section className="vet-schedule-header">
                        <div>
                            <p className="vet-schedule-eyebrow">VETERINARIAN</p>
                            <h1>My work schedule</h1>
                            <p>Add and manage the days when you are available for appointments.</p>
                        </div>
                    </section>

                    {error && (
                        <div className="vet-schedule-error">
                            {error}
                        </div>
                    )}

                    <div className="vet-schedule-layout">

                        <form className="vet-schedule-form" onSubmit={handleSubmit}>
                            <div className="vet-schedule-form-heading">
                                <p>{editingDay ? 'EDIT SCHEDULE' : 'NEW SCHEDULE'}</p>
                                <h2>{editingDay ? formatDate(editingDay) : 'Add working day'}</h2>
                            </div>

                            <div className="vet-schedule-field">
                                <label>Date</label>

                                <input
                                    type="date"
                                    name="day"
                                    value={form.day}
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={Boolean(editingDay)}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="vet-schedule-hours">
                                <div className="vet-schedule-field">
                                    <label>Start time</label>

                                    <input
                                        type="time"
                                        name="startHour"
                                        value={form.startHour}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="vet-schedule-field">
                                    <label>End time</label>

                                    <input
                                        type="time"
                                        name="endHour"
                                        value={form.endHour}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="vet-schedule-form-actions">
                                {editingDay && (
                                    <button type="button" className="vet-schedule-secondary" onClick={cancelEdit}>
                                        Cancel
                                    </button>
                                )}

                                <button type="submit" className="vet-schedule-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingDay ? 'Save changes' : 'Add schedule'}
                                </button>
                            </div>
                        </form>

                        <section className="vet-schedule-list-wrapper">
                            <div className="vet-schedule-list-heading">
                                <div>
                                    <p>YOUR AVAILABILITY</p>
                                    <h2>Scheduled working days</h2>
                                </div>

                                <span>{schedule.length} days</span>
                            </div>

                            {schedule.length === 0 ? (
                                <div className="vet-schedule-empty">
                                    <div>+</div>
                                    <h3>No schedule added yet</h3>
                                    <p>Add your first working day using the form.</p>
                                </div>
                            ) : (
                                <div className="vet-schedule-list">
                                    {schedule.map(item => (
                                        <article
                                            className="vet-schedule-card"
                                            key={`${item.id.veterinarianId}-${item.id.day}`}
                                        >
                                            <div className="vet-schedule-date">
                                                <strong>{new Date(`${item.id.day}T00:00:00`).getDate()}</strong>
                                                <span>
                                                    {new Date(`${item.id.day}T00:00:00`)
                                                        .toLocaleString('en-GB', { month: 'short' })
                                                        .toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="vet-schedule-card-info">
                                                <h3>{formatDate(item.id.day)}</h3>

                                                <p>
                                                    {item.startHour?.slice(0, 5)}
                                                    {' — '}
                                                    {item.endHour?.slice(0, 5)}
                                                </p>
                                            </div>

                                            <div className="vet-schedule-card-actions">
                                                <button type="button" onClick={() => handleEdit(item)}>
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => handleDelete(item)}
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
                </div>
            </main>
        </>
    );
}