// src/components/AdminUserList.js
import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext'; // Adjust the path as needed

// Helper function to calculate age from a date string
const calculateAge = (dobString) => {
    if (!dobString) return 'N/A'; // Handle cases where DoB is not set
    try {
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return 'Invalid Date'; // Use getTime() for robust check

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        // Adjust age if the birthday hasn't occurred yet this year
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        // Prevent negative ages if DOB is in the future by mistake
        return age >= 0 ? age : 'Invalid Date';

    } catch (error) {
        console.error("Error calculating age for", dobString, error);
        return 'Error'; // Handle unexpected errors during calculation
    }
};


const AdminUserList = () => {
    const { backendUrl, token } = useContext(AdminContext);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshList, setRefreshList] = useState(0); // State to trigger re-fetch after actions

    // --- New State for Search and Filter ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'blocked', 'unblocked'
    // --- End New State ---


    // Function to fetch users
    const fetchUsers = async () => {
        if (!backendUrl || !token) {
            // Don't set error if it's just initial state before context loads
             if (backendUrl === undefined || token === undefined) {
                 // Wait for context to potentially load
                 return;
             }
            setError('Backend URL or authentication token is missing.');
            setLoading(false);
            // Optional: Redirect to login if token is missing here
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const apiUrl = `${backendUrl}/api/admin/users`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

             if (!response.ok) {
                 let errorMessage = `HTTP error! status: ${response.status}`;
                 const contentType = response.headers.get("content-type");

                 if (contentType && contentType.includes("application/json")) {
                     const errorData = await response.json();
                     errorMessage = errorData.message || errorMessage;
                 } else {
                     const text = await response.text();
                     console.error("Backend responded with non-JSON:", text.substring(0, 200));
                     errorMessage = `Server responded with status ${response.status} but not valid JSON when fetching users.`;
                 }
                 if (response.status === 401 || response.status === 403) {
                     errorMessage = "Authentication or authorization failed. Please login again.";
                      // TODO: Implement actual logout/redirect using context if available
                 }
                 throw new Error(errorMessage);
             }

            const responseData = await response.json();
            // Assuming backend returns { data: [...] } structure
            setUsers(responseData.data || []); // Ensure it's always an array

        } catch (error) {
            console.error("Error fetching users for admin:", error);
            setError(error.message);
            setUsers([]); // Clear users on fetch error
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch users on mount and when dependencies change
    useEffect(() => {
         // Only fetch if backendUrl and token are available
        if (backendUrl && token) {
            fetchUsers();
        } else {
             // If context isn't ready, set loading to false and maybe an info message
            setLoading(false);
             // Optionally set an error or info message here if context is unexpectedly empty
             // setError('Admin context not fully initialized.');
        }
    }, [backendUrl, token, refreshList]); // refreshList triggers re-fetch after actions


    // --- Action Handlers (Block/Delete) ---
    const handleBlockUser = async (userId, isCurrentlyBlocked) => {
        if (!window.confirm(`Are you sure you want to ${isCurrentlyBlocked ? 'unblock' : 'block'} this user?`)) {
            return; // User cancelled
        }

        if (!backendUrl || !token) {
             alert('Backend URL or authentication token is missing.');
             // TODO: Handle this more gracefully, maybe redirect
             return;
        }

        // You could add a state here like `actionLoading[userId]` to show a spinner per button
        // For simplicity, we'll rely on alert/confirm and update state directly on success/failure

        try {
             const apiUrl = `${backendUrl}/api/admin/users/${userId}/block`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // If your backend requires a body to specify the new status:
                // body: JSON.stringify({ isBlocked: !isCurrentlyBlocked }),
            });

            let errorMessage = `HTTP error! status: ${response.status}`;
            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                 if (contentType && contentType.includes("application/json")) {
                     const errorData = await response.json();
                     errorMessage = errorData.message || errorMessage;
                     if (response.status === 400 && errorMessage.includes('Cannot block your own account')) {
                         alert(errorMessage);
                         return;
                     }
                      if (response.status === 404) {
                         alert('User not found.');
                         return;
                     }
                      if (response.status === 403) {
                         alert('Not authorized to perform this action.');
                         // TODO: Handle forbidden action (e.g., trying to block another admin)
                         return;
                     }
                     // Generic client-side alert for other 400/500 errors
                     alert(`Action failed: ${errorMessage}`);
                     return; // Stop processing on error
                 } else {
                     const text = await response.text();
                     console.error("Backend responded with non-JSON:", text.substring(0, 200));
                     errorMessage = `Server responded with status ${response.status} but not valid JSON during block/unblock action.`;
                      alert(`Action failed: ${errorMessage}`);
                      return;
                 }
                 // If response is not ok and wasn't handled above (e.g., network error before response)
                 // This throw won't be reached if we return after alert, but good practice
                 throw new Error(errorMessage);
            }

            // Success - Update local state instead of re-fetching for better UX
            setUsers(prevUsers =>
                 prevUsers.map(user =>
                     user._id === userId ? { ...user, isBlocked: !isCurrentlyBlocked } : user
                 )
            );
            // alert(`User ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully!`); // Avoid excessive alerts

        } catch (error) {
            console.error(`Error ${isCurrentlyBlocked ? 'unblocking' : 'blocking'} user ${userId}:`, error);
             // This catch block will primarily handle network errors or errors thrown from the fetch itself
             alert(`An error occurred: ${error.message}`);
        } finally {
             // If you were using per-button loading state, you'd unset it here
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return; // User cancelled
        }

         if (!backendUrl || !token) {
             alert('Backend URL or authentication token is missing.');
              // TODO: Handle this more gracefully
             return;
         }

        // You could add a state here like `actionLoading[userId]`
        // setLoading(true); // Global loading might be annoying for single actions
        setError(null); // Clear errors from previous actions

        try {
            const apiUrl = `${backendUrl}/api/admin/users/${userId}/delete`;

            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

             let errorMessage = `HTTP error! status: ${response.status}`;
             const contentType = response.headers.get("content-type");

             if (!response.ok) {
                  if (contentType && contentType.includes("application/json")) {
                      const errorData = await response.json();
                      errorMessage = errorData.message || errorMessage;
                       if (response.status === 400 && errorMessage.includes('Cannot delete your own account')) {
                          alert(errorMessage);
                          return;
                      }
                       if (response.status === 404) {
                          alert('User not found.');
                          return;
                       }
                        if (response.status === 403) {
                          alert('Not authorized to perform this action.');
                           // TODO: Handle forbidden action
                          return;
                      }
                       alert(`Action failed: ${errorMessage}`);
                       return; // Stop processing on error
                  } else {
                       const text = await response.text();
                       console.error("Backend responded with non-JSON:", text.substring(0, 200));
                       errorMessage = `Server responded with status ${response.status} but not valid JSON during delete action.`;
                        alert(`Action failed: ${errorMessage}`);
                        return;
                  }
                 throw new Error(errorMessage); // Will not be reached if we return after alert
             }

            // Success - Update local state instead of re-fetching for better UX
            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
            // alert("User deleted successfully!"); // Avoid excessive alerts

        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error);
             alert(`An error occurred: ${error.message}`);
        } finally {
            // If you were using per-button loading state, you'd unset it here
        }
    };
    // --- End Action Handlers ---


    // --- Filtering and Searching Logic ---
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredUsers = users.filter(user => {
        // Apply filter first
        if (filterStatus === 'blocked' && !user.isBlocked) {
            return false; // Skip if filtering blocked and user is not blocked
        }
        if (filterStatus === 'unblocked' && user.isBlocked) {
            return false; // Skip if filtering unblocked and user is blocked
        }

        // Apply search second (if searchTerm is not empty)
        if (lowerCaseSearchTerm) {
            // Check multiple fields (ID, name, email, phone, role) - added role
            const userIdMatch = user._id?.toLowerCase().includes(lowerCaseSearchTerm);
            const nameMatch = user.name?.toLowerCase().includes(lowerCaseSearchTerm);
            const emailMatch = user.email?.toLowerCase().includes(lowerCaseSearchTerm);
            const phoneMatch = user.phone?.toLowerCase().includes(lowerCaseSearchTerm);
            const roleMatch = user.role?.toLowerCase().includes(lowerCaseSearchTerm); // Added role search

            // Return true if any field matches the search term
            if (!userIdMatch && !nameMatch && !emailMatch && !phoneMatch && !roleMatch) {
                return false; // Skip if none of the fields match
            }
        }

        // If we pass both filter and search conditions, include the user
        return true;
    });
    // --- End Filtering and Searching Logic ---

    // --- Calculate Counts ---
    const totalUsers = users.length;
    const blockedUsersCount = users.filter(user => user.isBlocked).length;
    // --- End Calculate Counts ---


    // --- Render Logic & Styles ---

    // Simple inline styles for demonstration (Enhanced)
     const styles = {
        container: {
            padding: '20px',
            backgroundColor: '#f8f8f8',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
            color: '#333',
        },
        heading: {
            color: '#333',
            borderBottom: '2px solid #007bff', // Changed border color
            paddingBottom: '15px', // Increased padding
            marginBottom: '20px',
            fontSize: '2em', // Larger heading
        },
         statsContainer: { // New style for counts display
             display: 'flex',
             gap: '30px', // Space between stats
             marginBottom: '20px',
             fontSize: '1.1em',
             color: '#555',
             padding: '10px 0',
             borderBottom: '1px solid #eee', // Separator below stats
         },
          statItem: { // Style for individual stat (e.g., Total Users:)
              fontWeight: 'bold',
          },
         controlsContainer: { // New style for filter/search
             display: 'flex',
             flexWrap: 'wrap', // Allow wrapping on smaller screens
             gap: '15px', // Space between controls
             marginBottom: '30px', // More space below controls
             alignItems: 'center',
             backgroundColor: '#fff', // Added background
             padding: '15px', // Added padding
             borderRadius: '8px', // Rounded corners
             boxShadow: '0 1px 3px rgba(0,0,0,0.08)', // Subtle shadow
         },
         controlGroup: { // Group label and input/select
             display: 'flex',
             alignItems: 'center',
             gap: '5px',
         },
         controlLabel: { // Style for labels
             fontWeight: 'bold',
             color: '#555',
         },
         searchInput: {
             padding: '8px 12px', // Adjusted padding
             borderRadius: '4px',
             border: '1px solid #ccc',
             fontSize: '1em',
             width: '250px', // Fixed width
             // flexGrow: 1, // Removed flex-grow if using fixed width
              outline: 'none', // Remove default outline
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease', // Add transition
              ':focus': { // Add focus style (requires a CSS-in-JS library or CSS module for actual :focus)
                  borderColor: '#007bff',
                   boxShadow: '0 0 0 0.2rem rgba(0, 123, 255, 0.25)',
              }
         },
         filterSelect: {
             padding: '8px 12px', // Adjusted padding
             borderRadius: '4px',
             border: '1px solid #ccc',
             fontSize: '1em',
             backgroundColor: '#fff',
             cursor: 'pointer',
             outline: 'none',
             transition: 'border-color 0.2s ease',
              ':focus': {
                  borderColor: '#007bff',
              }
         },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '0px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // More prominent shadow
            backgroundColor: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
        },
        th: {
            border: '1px solid #ddd', // Keep border for structure
            borderBottom: '2px solid #007bff', // Stronger border bottom on header
            padding: '15px 12px', // More padding
            textAlign: 'left',
            backgroundColor: '#007bff',
            color: 'white',
            fontWeight: 'bold',
            textTransform: 'uppercase', // Uppercase headers
            fontSize: '0.9em', // Slightly smaller font
        },
        td: {
            border: '1px solid #eee', // Lighter border for data cells
             borderBottom: 'none', // Remove individual cell bottom borders for cleaner look
            padding: '12px',
            textAlign: 'left',
            wordBreak: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            verticalAlign: 'top', // Align cell content to top
        },
         // Updated row styles for cleaner look without internal borders
        trEven: {
             backgroundColor: '#f8f9fa', // Lighter alternating color
             borderBottom: '1px solid #eee', // Separator between rows
        },
        trOdd: {
            backgroundColor: '#fff',
            borderBottom: '1px solid #eee', // Separator between rows
        },
         trLast: { // Style for the last row to remove bottom border
             borderBottom: 'none',
         },
         loading: {
             color: '#007bff',
             textAlign: 'center',
             padding: '20px',
             fontSize: '1.2em',
         },
          infoMessage: {
             color: '#555',
             textAlign: 'center',
             padding: '20px',
             fontSize: '1.1em',
             backgroundColor: '#e9ecef', // Light background
             borderRadius: '5px',
             marginTop: '20px',
          },
         error: {
             color: '#dc3545',
             textAlign: 'center',
             padding: '20px',
             fontWeight: 'bold',
             backgroundColor: '#f8d7da',
             border: '1px solid #f5c6cb',
             borderRadius: '5px',
             marginBottom: '15px',
         },
         button: {
             padding: '7px 10px', // Adjusted padding
             marginRight: '5px',
             border: 'none',
             borderRadius: '4px',
             cursor: 'pointer',
             transition: 'background-color 0.2s ease, opacity 0.2s ease',
             fontSize: '0.9em', // Slightly smaller button text
             ':hover': { // Add hover style (requires CSS-in-JS/CSS module)
                 opacity: 0.9,
             }
         },
         blockButton: {
            backgroundColor: '#ffc107',
            color: '#333', // Darker text for better contrast on yellow
             fontWeight: 'bold',
         },
          unblockButton: {
             backgroundColor: '#28a745',
             color: 'white',
              fontWeight: 'bold',
          },
         deleteButton: {
            backgroundColor: '#dc3545',
            color: 'white',
             fontWeight: 'bold',
         },
     };

     // Helper to apply conditional row styles (alternating + last row)
     const getRowStyle = (index, arrayLength) => {
         let style = index % 2 === 0 ? styles.trEven : styles.trOdd;
         if (index === arrayLength - 1) {
             style = { ...style, ...styles.trLast };
         }
         return style;
     };


    if (loading && users.length === 0 && (!backendUrl || !token)) {
        // Show loading only when truly loading and no previous data exists
        return <div style={styles.loading}>Loading users...</div>;
    }

    // Show error message prominently at the top if it exists
    if (error) {
        return (
            <div style={styles.container}>
                 <div style={styles.error}>Error: {error}</div>
                 {/* Render controls and table below if some users were loaded before error */}
                 {users.length > 0 && (
                     <>
                         <div style={styles.statsContainer}>
                             <span style={styles.statItem}>Total Users: {totalUsers}</span>
                             <span style={styles.statItem}>Blocked: {blockedUsersCount}</span>
                         </div>
                         <div style={styles.controlsContainer}>
                            <div style={styles.controlGroup}>
                                <label htmlFor="user-search" style={styles.controlLabel}>Search:</label>
                                <input
                                    id="user-search" // Added ID for label
                                    type="text"
                                    placeholder="ID, Name, Email, Phone, Role"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </div>
                            <div style={styles.controlGroup}>
                                <label htmlFor="user-filter" style={styles.controlLabel}>Filter:</label>
                                <select
                                    id="user-filter" // Added ID for label
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={styles.filterSelect}
                                >
                                    <option value="all">All Users</option>
                                    <option value="unblocked">Unblocked Users</option>
                                    <option value="blocked">Blocked Users</option>
                                </select>
                            </div>
                         </div>
                         {/* Proceed to render the table with potentially partial data below */}
                         {filteredUsers.length > 0 && (
                              <table style={styles.table}>
                                  <thead>
                                      <tr>
                                          <th style={styles.th}>ID</th>
                                          <th style={styles.th}>Name</th>
                                          <th style={styles.th}>Email</th>
                                          <th style={styles.th}>Phone</th>
                                          <th style={styles.th}>Role</th>
                                          <th style={styles.th}>Age</th>
                                          <th style={styles.th}>Blocked</th>
                                          <th style={styles.th}>Verified</th>
                                          <th style={styles.th}>Created At</th>
                                          <th style={styles.th}>Actions</th>
                                      </tr>
                                  </thead>
                                   <tbody>
                                       {filteredUsers.map((user, index) => (
                                           <tr key={user._id} style={getRowStyle(index, filteredUsers.length)}>
                                               <td style={styles.td} title={user._id}>{user._id}</td>
                                               <td style={styles.td} title={user.name}>{user.name}</td>
                                               <td style={styles.td} title={user.email}>{user.email}</td>
                                               <td style={styles.td} title={user.phone}>{user.phone}</td>
                                               <td style={styles.td}>{user.role}</td>
                                               <td style={styles.td}>{calculateAge(user.dob)}</td>
                                               <td style={styles.td}>{user.isBlocked ? 'Yes' : 'No'}</td>
                                               <td style={styles.td}>{user.isEmailVerified ? 'Yes' : 'No'}</td>
                                                <td style={styles.td}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                               <td style={styles.td}>
                                                   <button
                                                       onClick={() => handleBlockUser(user._id, user.isBlocked)}
                                                       style={{ ...styles.button, ...(user.isBlocked ? styles.unblockButton : styles.blockButton) }}
                                                   >
                                                       {user.isBlocked ? 'Unblock' : 'Block'}
                                                   </button>
                                                    <button
                                                       onClick={() => handleDeleteUser(user._id)}
                                                       style={{ ...styles.button, ...styles.deleteButton }}
                                                   >
                                                       Delete
                                                   </button>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                              </table>
                         )}
                     </>
                 )}
            </div>
        );
    }

    // Render controls and table if users are loaded (even if empty array)
    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Application Users</h2>

            {/* User Counts */}
            <div style={styles.statsContainer}>
                <span style={styles.statItem}>Total Users: {totalUsers}</span>
                <span style={styles.statItem}>Blocked: {blockedUsersCount}</span>
            </div>

            {/* Search and Filter Controls */}
            <div style={styles.controlsContainer}>
                 <div style={styles.controlGroup}>
                     <label htmlFor="user-search" style={styles.controlLabel}>Search:</label>
                     <input
                         id="user-search" // Added ID for label
                         type="text"
                         placeholder="ID, Name, Email, Phone, Role" // Updated placeholder
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         style={styles.searchInput}
                     />
                 </div>
                 <div style={styles.controlGroup}>
                     <label htmlFor="user-filter" style={styles.controlLabel}>Filter:</label>
                     <select
                         id="user-filter" // Added ID for label
                         value={filterStatus}
                         onChange={(e) => setFilterStatus(e.target.value)}
                         style={styles.filterSelect}
                     >
                         <option value="all">All Users</option>
                         <option value="unblocked">Unblocked Users</option>
                         <option value="blocked">Blocked Users</option>
                     </select>
                 </div>
            </div>
            {/* End Search and Filter Controls */}

            {loading && users.length > 0 && <div style={{...styles.loading, fontSize: '0.9em', padding: '5px 0'}}>Updating user list...</div>}

            {/* Display messages based on filtered users */}
            {filteredUsers.length === 0 && users.length > 0 && !loading && (
                <div style={styles.infoMessage}>No users match your search or filter criteria.</div>
            )}
             {filteredUsers.length === 0 && users.length === 0 && !loading && (
                 <div style={styles.infoMessage}>No users found in the system.</div>
            )}

            {/* User Table */}
            {filteredUsers.length > 0 && (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {/* Table Headers */}
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Phone</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Age</th>
                            <th style={styles.th}>Blocked</th>
                            <th style={styles.th}>Verified</th>
                            <th style={styles.th}>Created At</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, index) => (
                            <tr
                                key={user._id}
                                // Apply alternating row styles and handle the last row's border
                                style={getRowStyle(index, filteredUsers.length)}
                            >
                                <td style={styles.td} title={user._id}>{user._id}</td>
                                <td style={styles.td} title={user.name}>{user.name}</td>
                                <td style={styles.td} title={user.email}>{user.email}</td>
                                <td style={styles.td} title={user.phone}>{user.phone}</td>
                                <td style={styles.td}>{user.role}</td>
                                <td style={styles.td}>{calculateAge(user.dob)}</td>
                                <td style={styles.td}>{user.isBlocked ? 'Yes' : 'No'}</td>
                                <td style={styles.td}>{user.isEmailVerified ? 'Yes' : 'No'}</td>
                                {/* Format the date, handle potential invalid dates */}
                                <td style={styles.td}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                <td style={styles.td}>
                                    {/* Block/Unblock Button */}
                                     <button
                                        onClick={() => handleBlockUser(user._id, user.isBlocked)}
                                        // Apply base and specific styles
                                        style={{
                                            ...styles.button,
                                            ...(user.isBlocked ? styles.unblockButton : styles.blockButton)
                                        }}
                                     >
                                        {user.isBlocked ? 'Unblock' : 'Block'}
                                    </button>

                                    {/* Delete Button */}
                                     <button
                                        onClick={() => handleDeleteUser(user._id)}
                                         // Apply base and delete styles
                                        style={{...styles.button, ...styles.deleteButton}}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {/* End User Table */}

        </div>
    );
};

export default AdminUserList;