'use client';

import { useState } from 'react';
import { CustomContact, useCustomContacts } from '@/lib/contactManagement';

interface ContactEditorProps {
    orgName: string;
    onClose: () => void;
}

export function ContactEditor({ orgName, onClose }: ContactEditorProps) {
    const { contacts, addContact, updateContact, removeContact, setPrimaryEmail } = useCustomContacts(orgName);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        role: '',
        email: '',
        linkedin: '',
        phone: '',
        notes: ''
    });

    const resetForm = () => {
        setForm({ name: '', role: '', email: '', linkedin: '', phone: '', notes: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        if (editingId) {
            updateContact(editingId, {
                name: form.name,
                role: form.role,
                email: form.email || null,
                linkedin: form.linkedin || null,
                phone: form.phone || null,
                notes: form.notes || null
            });
        } else {
            addContact({
                name: form.name,
                role: form.role,
                email: form.email || null,
                linkedin: form.linkedin || null,
                phone: form.phone || null,
                notes: form.notes || null
            });
        }
        resetForm();
    };

    const startEdit = (contact: CustomContact) => {
        setForm({
            name: contact.name,
            role: contact.role,
            email: contact.email || '',
            linkedin: contact.linkedin || '',
            phone: contact.phone || '',
            notes: contact.notes || ''
        });
        setEditingId(contact.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Weet je zeker dat je dit contact wilt verwijderen?')) {
            removeContact(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">👤 Contactpersonen Bewerken</h2>
                            <p className="text-blue-100 text-sm mt-1">{orgName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1">
                    {/* Existing Custom Contacts */}
                    {contacts?.customContacts && contacts.customContacts.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-500 uppercase mb-3">Eigen contactpersonen</h3>
                            <div className="space-y-2">
                                {contacts.customContacts.map((contact) => (
                                    <div key={contact.id} className="bg-slate-50 rounded-lg p-3 flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800">{contact.name}</div>
                                            <div className="text-sm text-indigo-600">{contact.role}</div>
                                            {contact.email && <div className="text-sm text-slate-500">📧 {contact.email}</div>}
                                            {contact.phone && <div className="text-sm text-slate-500">📞 {contact.phone}</div>}
                                            {contact.linkedin && (
                                                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline">
                                                    LinkedIn →
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(contact)}
                                                className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-slate-100 transition"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(contact.id)}
                                                className="px-2 py-1 text-xs bg-red-50 border border-red-200 rounded hover:bg-red-100 transition text-red-600"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add / Edit Form */}
                    {(isAdding || editingId) && (
                        <form onSubmit={handleSubmit} className="bg-blue-50 rounded-lg p-4 mb-4">
                            <h3 className="font-medium text-slate-800 mb-3">
                                {editingId ? '✏️ Contact bewerken' : '➕ Nieuw contact toevoegen'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Naam *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Jan Jansen"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Rol / Functie</label>
                                    <input
                                        type="text"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        placeholder="CIO, Privacy Officer, etc."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="jan@organisatie.nl"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Telefoon</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="06-12345678"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-slate-500 mb-1">LinkedIn URL</label>
                                    <input
                                        type="url"
                                        value={form.linkedin}
                                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                                        placeholder="https://www.linkedin.com/in/..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-slate-500 mb-1">Notities</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Extra informatie..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    {editingId ? 'Opslaan' : 'Toevoegen'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition"
                                >
                                    Annuleren
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Add Button */}
                    {!isAdding && !editingId && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">➕</span>
                            Nieuw contact toevoegen
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-4 bg-slate-50 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                            {contacts?.customContacts?.length || 0} eigen contact(en)
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                        >
                            Sluiten
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
