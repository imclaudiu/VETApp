import { useEffect, useMemo, useState } from 'react';
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
    const [deletingItem, setDeletingItem] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const parseDate = value => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;

        const [day, month, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day ||
            date < today
        ) return null;

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const toDisplayDate = value => {
        if (!value) return '';

        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatDate = value => {
        if (!value) return '—';

        return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const loadSchedule = async veterinarianId => {
        const data = await getVeterinarianSchedule(veterinarianId);

        const sorted = [...(Array.isArray(data) ? data : [])].sort(
            (a, b) => a.id.day.localeCompare(b.id.day)
        );

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
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load your work schedule.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const upcomingSchedule = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return schedule.filter(item => {
            const date = new Date(`${item.id.day}T00:00:00`);
            return date >= today;
        });
    }, [schedule]);

    const nextWorkingDay = upcomingSchedule[0];

    const handleDateChange = e => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 8);

        if (value.length > 4) {
            value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
        } else if (value.length > 2) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }

        setForm(current => ({
            ...current,
            day: value
        }));

        setError(null);
        setSuccess(null);
    };

    const handleChange = e => {
        const { name, value } = e.target;

        setForm(current => ({
            ...current,
            [name]: value
        }));

        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();

        if (!veterinarian) return;

        const backendDay = editingDay || parseDate(form.day);

        if (!backendDay) {
            setError('Please enter a valid future date in DD/MM/YYYY format.');
            return;
        }

        if (!form.startHour || !form.endHour) {
            setError('Please select both start and end time.');
            return;
        }

        if (form.endHour <= form.startHour) {
            setError('End time must be after start time.');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            if (editingDay) {
                await updateAvailability(
                    veterinarian.id,
                    editingDay,
                    form.startHour,
                    form.endHour
                );

                setSuccess('Schedule updated successfully.');
            } else {
                await addAvailability(
                    veterinarian.id,
                    backendDay,
                    form.startHour,
                    form.endHour
                );

                setSuccess('Working day added successfully.');
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
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Could not save work schedule.'
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = item => {
        setEditingDay(item.id.day);

        setForm({
            day: toDisplayDate(item.id.day),
            startHour: item.startHour?.slice(0, 5) || '',
            endHour: item.endHour?.slice(0, 5) || ''
        });

        setError(null);
        setSuccess(null);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const cancelEdit = () => {
        setEditingDay(null);

        setForm({
            day: '',
            startHour: '',
            endHour: ''
        });

        setError(null);
    };

    const confirmDelete = async () => {
        if (!deletingItem || !veterinarian) return;

        try {
            setDeleting(true);
            setError(null);
            setSuccess(null);

            await deleteAvailability(
                veterinarian.id,
                deletingItem.id.day
            );

            if (editingDay === deletingItem.id.day) {
                cancelEdit();
            }

            setDeletingItem(null);
            setSuccess('Working day removed.');

            await loadSchedule(veterinarian.id);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Could not delete work schedule.'
            );
        } finally {
            setDeleting(false);
        }
    };

    const getDuration = item => {
        if (!item.startHour || !item.endHour) return '';

        const [startH, startM] = item.startHour.split(':').map(Number);
        const [endH, endM] = item.endHour.split(':').map(Number);

        const minutes =
            endH * 60 +
            endM -
            (startH * 60 + startM);

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (!remainingMinutes) {
            return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        }

        return `${hours}h ${remainingMinutes}m`;
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="vet-schedule-page">
                    <div className="vet-schedule-loading">
                        <div className="vet-schedule-spinner" />
                        <p>Loading your schedule...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="vet-schedule-page">
                <div className="vet-schedule-container">

                    <header className="vet-schedule-header">
                        <div>
                            <span>VETERINARIAN</span>
                            <h1>Work schedule</h1>
                            <p>
                                Manage the days and hours when patients can book appointments with you.
                            </p>
                        </div>
                    </header>

                    <section className="vet-schedule-summary">
                        <div>
                            <span>UPCOMING WORKING DAYS</span>
                            <strong>{upcomingSchedule.length}</strong>
                            <p>Days currently open for appointments</p>
                        </div>

                        <div>
                            <span>NEXT WORKING DAY</span>
                            <strong className="text-value">
                                {nextWorkingDay
                                    ? toDisplayDate(nextWorkingDay.id.day)
                                    : 'None'}
                            </strong>

                            <p>
                                {nextWorkingDay
                                    ? `${nextWorkingDay.startHour?.slice(0, 5)} – ${nextWorkingDay.endHour?.slice(0, 5)}`
                                    : 'Add availability using the form below'}
                            </p>
                        </div>
                    </section>

                    {error && (
                        <div className="vet-schedule-message error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="vet-schedule-message success">
                            {success}
                        </div>
                    )}

                    <div className="vet-schedule-layout">

                        <form
                            className="vet-schedule-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="vet-schedule-form-heading">
                                <span>
                                    {editingDay
                                        ? 'EDIT AVAILABILITY'
                                        : 'NEW AVAILABILITY'}
                                </span>

                                <h2>
                                    {editingDay
                                        ? formatDate(editingDay)
                                        : 'Add working day'}
                                </h2>

                                <p>
                                    {editingDay
                                        ? 'Change your working hours for this date.'
                                        : 'Choose a date and define when appointments can be scheduled.'}
                                </p>
                            </div>

                            <div className="vet-schedule-field">
                                <label>Date</label>

                                <input
                                    type="text"
                                    name="day"
                                    value={form.day}
                                    onChange={handleDateChange}
                                    placeholder="DD/MM/YYYY"
                                    maxLength={10}
                                    disabled={Boolean(editingDay)}
                                    required
                                />

                                {editingDay && (
                                    <small>
                                        The date cannot be changed while editing.
                                    </small>
                                )}

                                {!editingDay &&
                                    form.day.length === 10 &&
                                    !parseDate(form.day) && (
                                        <small className="field-error">
                                            Enter a valid future date.
                                        </small>
                                    )}
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

                            {form.startHour &&
                                form.endHour &&
                                form.endHour > form.startHour && (
                                    <div className="vet-schedule-preview">
                                        <span>Working hours</span>

                                        <strong>
                                            {form.startHour} – {form.endHour}
                                        </strong>
                                    </div>
                                )}

                            <div className="vet-schedule-form-actions">
                                {editingDay && (
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={cancelEdit}
                                        disabled={saving}
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
                                        : editingDay
                                            ? 'Save changes'
                                            : 'Add availability'}
                                </button>
                            </div>
                        </form>

                        <section className="vet-schedule-list-section">
                            <div className="vet-schedule-list-heading">
                                <div>
                                    <span>YOUR AVAILABILITY</span>
                                    <h2>Upcoming working days</h2>
                                </div>

                                <p>
                                    {upcomingSchedule.length}{' '}
                                    {upcomingSchedule.length === 1
                                        ? 'day'
                                        : 'days'}
                                </p>
                            </div>

                            {upcomingSchedule.length === 0 ? (
                                <div className="vet-schedule-empty">
                                    <div>+</div>

                                    <h3>No availability added</h3>

                                    <p>
                                        Add your first working day to allow owners to book appointments with you.
                                    </p>
                                </div>
                            ) : (
                                <div className="vet-schedule-list">
                                    {upcomingSchedule.map(item => {
                                        const editing =
                                            editingDay === item.id.day;

                                        return (
                                            <article
                                                className={`vet-schedule-card${editing ? ' editing' : ''}`}
                                                key={`${item.id.veterinarianId}-${item.id.day}`}
                                            >
                                                <div className="vet-schedule-date">
                                                    <strong>
                                                        {String(
                                                            new Date(
                                                                `${item.id.day}T00:00:00`
                                                            ).getDate()
                                                        ).padStart(2, '0')}
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

                                                <div className="vet-schedule-card-info">
                                                    <h3>
                                                        {formatDate(
                                                            item.id.day
                                                        )}
                                                    </h3>

                                                    <div className="vet-schedule-time">
                                                        <strong>
                                                            {item.startHour?.slice(
                                                                0,
                                                                5
                                                            )}
                                                            {' – '}
                                                            {item.endHour?.slice(
                                                                0,
                                                                5
                                                            )}
                                                        </strong>

                                                        <span>
                                                            {getDuration(item)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="vet-schedule-card-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="danger"
                                                        onClick={() =>
                                                            setDeletingItem(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                    </div>
                </div>
            </main>

            {deletingItem && (
                <div
                    className="vet-schedule-modal-backdrop"
                    onMouseDown={() => {
                        if (!deleting) setDeletingItem(null);
                    }}
                >
                    <div
                        className="vet-schedule-modal"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <span>REMOVE AVAILABILITY</span>

                        <h2>Delete this working day?</h2>

                        <p>
                            Owners will no longer be able to book new appointments during this availability.
                        </p>

                        <div className="vet-schedule-modal-day">
                            <strong>
                                {formatDate(deletingItem.id.day)}
                            </strong>

                            <span>
                                {deletingItem.startHour?.slice(0, 5)}
                                {' – '}
                                {deletingItem.endHour?.slice(0, 5)}
                            </span>
                        </div>

                        <div className="vet-schedule-modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={deleting}
                                onClick={() =>
                                    setDeletingItem(null)
                                }
                            >
                                Keep availability
                            </button>

                            <button
                                type="button"
                                className="vet-schedule-delete-button"
                                disabled={deleting}
                                onClick={confirmDelete}
                            >
                                {deleting
                                    ? 'Deleting...'
                                    : 'Delete availability'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}