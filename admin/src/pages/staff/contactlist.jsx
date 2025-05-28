import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { StaffContext } from './path/to/your/StaffContext'; // Adjust the import path

// Basic styles for the table
const styles = {
    container: {
        margin: '20px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '15px',
    },
    th: {
        borderBottom: '2px solid #ddd',
        padding: '12px',
        textAlign: 'left',
        backgroundColor: '#e9ecef',
    },
    td: {
        borderBottom: '1px solid #ddd',
        padding: '10px',
        textAlign: 'left',
    },
    trHover: { // Use CSS :hover for better effect
        // backgroundColor: '#f1f1f1',
    },
    errorMsg: {
        color: 'red',
        textAlign: 'center',
        padding: '10px',
    },
    loadingMsg: {
        textAlign: 'center',
        padding: '20px',
        fontSize: '1.1em',
    },
    noContactsMsg: {
        textAlign: 'center',
        padding: '20px',
        fontStyle: 'italic',
        color: '#666',
    },
    title: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
    }
};


function ContactList() {
    const { staffToken, backendUrl } = useContext(StaffContext); // staffToken might be needed if endpoint is protected
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContacts = async () => {
            if (!backendUrl) {
                setError("Backend URL not configured.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            // --- IMPORTANT: Replace with your ACTUAL list endpoint ---
            const listEndpoint = `${backendUrl}/api/staff/contacts`; // Or e.g., /api/v1/staff/contacts

            try {
                console.log(`Fetching contacts from: ${listEndpoint}`);
                const response = await axios.get(listEndpoint, {
                    // Include headers if your list endpoint requires authentication
                    // headers: { 'Authorization': `Bearer ${staffToken}` }
                });

                if (response.data?.success && Array.isArray(response.data.data)) {
                    setContacts(response.data.data);
                } else if (response.data?.success && response.data.data === null) {
                    // Handle cases where the API might return null for an empty list
                    setContacts([]);
                }
                 else {
                    // Handle cases where success might be false or data is not an array
                    console.error("Invalid data structure received:", response.data);
                    setError(response.data?.message || "Failed to fetch contacts or data format is incorrect.");
                    setContacts([]); // Ensure contacts is an array
                }
            } catch (err) {
                console.error("Error fetching contact list:", err);
                 if (err.response?.status === 404) {
                     setError(`Endpoint not found (${listEndpoint}). Please ensure the backend route is correct.`);
                 } else {
                    setError(err.response?.data?.message || "An error occurred while fetching the contact list.");
                 }
                 setContacts([]); // Clear contacts on error
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, [backendUrl, staffToken]); // Re-run if context changes

    // --- Render Logic ---

    if (loading) {
        return <div style={styles.loadingMsg}>Loading Contacts...</div>;
    }

    if (error) {
        return <div style={styles.errorMsg}>Error: {error}</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Contact List</h2>
            {contacts.length === 0 ? (
                <div style={styles.noContactsMsg}>No contacts found.</div>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Primary Phone</th>
                            <th style={styles.th}>Location</th>
                            {/* Add other relevant headers based on your schema */}
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact._id || contact.email} /* Use a reliable unique key */
                                // onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor}
                                // onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
                            >
                                <td style={styles.td}>{contact.contactName || 'N/A'}</td>
                                <td style={styles.td}>
                                    {contact.email ? (
                                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td style={styles.td}>
                                     {contact.primaryPhoneNumber ? (
                                        <a href={`tel:${contact.primaryPhoneNumber}`}>{contact.primaryPhoneNumber}</a>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td style={styles.td}>{contact.location || 'N/A'}</td>
                                {/* Render other relevant data */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ContactList;