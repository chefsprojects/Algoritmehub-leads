// Contact Management - localStorage persistence for custom contacts

export interface CustomContact {
    id: string;
    role: string;
    name: string;
    email: string | null;
    linkedin: string | null;
    phone: string | null;
    notes: string | null;
    addedAt: string;
}

export interface OrganizationContacts {
    customContacts: CustomContact[];
    primaryEmail: string | null;
    updatedAt: string;
}

const STORAGE_KEY = 'algoritmehub_custom_contacts';

// Get all custom contacts from localStorage
export function getAllCustomContacts(): Record<string, OrganizationContacts> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

// Get custom contacts for a specific organization
export function getOrgCustomContacts(orgName: string): OrganizationContacts | null {
    const all = getAllCustomContacts();
    return all[orgName] || null;
}

// Save custom contacts for an organization
export function saveOrgCustomContacts(orgName: string, contacts: OrganizationContacts): void {
    if (typeof window === 'undefined') return;
    try {
        const all = getAllCustomContacts();
        all[orgName] = {
            ...contacts,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
        console.error('Failed to save contacts:', e);
    }
}

// Add a new contact to an organization
export function addCustomContact(orgName: string, contact: Omit<CustomContact, 'id' | 'addedAt'>): CustomContact {
    const existing = getOrgCustomContacts(orgName) || { customContacts: [], primaryEmail: null, updatedAt: '' };
    const newContact: CustomContact = {
        ...contact,
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString()
    };
    existing.customContacts.push(newContact);
    saveOrgCustomContacts(orgName, existing);
    return newContact;
}

// Update a contact
export function updateCustomContact(orgName: string, contactId: string, updates: Partial<CustomContact>): void {
    const existing = getOrgCustomContacts(orgName);
    if (!existing) return;

    const idx = existing.customContacts.findIndex(c => c.id === contactId);
    if (idx !== -1) {
        existing.customContacts[idx] = { ...existing.customContacts[idx], ...updates };
        saveOrgCustomContacts(orgName, existing);
    }
}

// Delete a contact
export function deleteCustomContact(orgName: string, contactId: string): void {
    const existing = getOrgCustomContacts(orgName);
    if (!existing) return;

    existing.customContacts = existing.customContacts.filter(c => c.id !== contactId);
    saveOrgCustomContacts(orgName, existing);
}

// Update primary email for an organization
export function updatePrimaryEmail(orgName: string, email: string | null): void {
    const existing = getOrgCustomContacts(orgName) || { customContacts: [], primaryEmail: null, updatedAt: '' };
    existing.primaryEmail = email;
    saveOrgCustomContacts(orgName, existing);
}

// React Hook for contact management
import { useState, useEffect, useCallback } from 'react';

export function useCustomContacts(orgName: string) {
    const [contacts, setContacts] = useState<OrganizationContacts | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setContacts(getOrgCustomContacts(orgName));
        setIsLoading(false);
    }, [orgName]);

    const addContact = useCallback((contact: Omit<CustomContact, 'id' | 'addedAt'>) => {
        const newContact = addCustomContact(orgName, contact);
        setContacts(getOrgCustomContacts(orgName));
        return newContact;
    }, [orgName]);

    const updateContact = useCallback((contactId: string, updates: Partial<CustomContact>) => {
        updateCustomContact(orgName, contactId, updates);
        setContacts(getOrgCustomContacts(orgName));
    }, [orgName]);

    const removeContact = useCallback((contactId: string) => {
        deleteCustomContact(orgName, contactId);
        setContacts(getOrgCustomContacts(orgName));
    }, [orgName]);

    const setPrimaryEmail = useCallback((email: string | null) => {
        updatePrimaryEmail(orgName, email);
        setContacts(getOrgCustomContacts(orgName));
    }, [orgName]);

    return {
        contacts,
        isLoading,
        addContact,
        updateContact,
        removeContact,
        setPrimaryEmail
    };
}
