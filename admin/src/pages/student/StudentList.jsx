// components/StudentList.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { StaffContext } from '../../context/StaffContext';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaBan, FaCheckCircle, FaUserCircle, FaCheck, FaTimes } from 'react-icons/fa';
// Import motion components from framer-motion
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';


// Basic inline styles (replace with your CSS/UI library)
const styles = {
    container: { padding: '20px', maxWidth: '1400px', margin: '20px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    heading: { textAlign: 'center', marginBottom: '20px', color: '#333' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '0.9em' },
    th: { padding: '12px 8px', borderBottom: '1px solid #ddd', textAlign: 'left', backgroundColor: '#f2f2f2', fontWeight: 'bold', whiteSpace: 'nowrap' },
    td: { padding: '12px 8px', borderBottom: '1px solid #ddd', textAlign: 'left', verticalAlign: 'top' },
    actionButtons: { display: 'flex', gap: '8px' },
    button: { padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontSize: '0.9em' },
    editButton: { backgroundColor: '#ffc107', color: 'white' },
    deleteButton: { backgroundColor: '#dc3545', color: 'white' },
    blockButton: { backgroundColor: '#6c757d', color: 'white' },
    unblockButton: { backgroundColor: '#28a745', color: 'white' },
    loading: { textAlign: 'center', padding: '20px' },
    error: { textAlign: 'center', padding: '20px', color: 'red' },
    statusBlocked: { color: '#dc3545', fontWeight: 'bold' },
    statusActive: { color: '#28a745', fontWeight: 'bold' },
    statusOther: { color: '#6c757d' },
    profileImage: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
    imagePlaceholderIcon: { fontSize: '30px', color: '#aaa' },
    vaccinatedIcon: { color: '#28a745', fontSize: '1.2em' },
    notVaccinatedIcon: { color: '#dc3545', fontSize: '1.2em' },
};

const StudentList = () => {
    const { staffToken, backendUrl } = useContext(StaffContext);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Students ---
    useEffect(() => {
        const fetchStudents = async () => {
            if (!staffToken) {
                setError('Authentication token missing. Cannot fetch students.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null); // Clear previous errors

            try {
                const response = await fetch(`${backendUrl}/api/student/studentdata`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${staffToken}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setStudents(result.data.students);

            } catch (err) {
                console.error('Error fetching students:', err);
                setError(err.message);
                toast.error(`Failed to fetch students: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [staffToken, backendUrl]);

    // --- Delete Student Handler ---
    const handleDelete = async (studentId) => {
        if (!staffToken) {
            toast.error('Authentication token missing.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return; // User cancelled
        }

        // Note: We intentionally don't set global isLoading here
        // to allow the removal animation to play smoothly.
        // Individual button disabling is used for loading feedback per action.
        try {
            const response = await fetch(`${backendUrl}/api/student/studentdelete/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${staffToken}`,
                },
            });

            if (!response.ok) {
                let errorMsg = `Failed to delete student. Status: ${response.status}`;
                try {
                     const errorData = await response.json();
                     errorMsg = errorData.message || errorMsg;
                } catch(jsonError) { } // Ignore JSON parse error for 204
                throw new Error(errorMsg);
            }

            toast.success('Student deleted successfully!');
            // Update state triggers the exit animation for the deleted item
            setStudents(prevStudents => prevStudents.filter(student => student._id !== studentId));

        } catch (err) {
            console.error('Error deleting student:', err);
            toast.error(`Failed to delete student: ${err.message}`);
        }
         // No finally block with setIsLoading(false) here as we aren't setting it true
    };

    // --- Block/Unblock Student Handler ---
    const handleStatusChange = async (studentId, currentStatus) => {
        if (!staffToken) {
            toast.error('Authentication token missing.');
            return;
        }

        const targetStatus = currentStatus === 'active' ? 'blocked' : 'active';
        const confirmationAction = targetStatus === 'blocked' ? 'block' : 'unblock';
        const confirmationMessage = `Are you sure you want to ${confirmationAction} this student?`;
        const successMessage = `Student ${confirmationAction}ed successfully!`;
        const apiEndpoint = `${backendUrl}/api/student/Update/${studentId}`;
        const requestBody = { status: targetStatus };

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        // Note: No global isLoading here, allow animation on update
        try {
            const response = await fetch(apiEndpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${staffToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (!response.ok) {
                 throw new Error(result.message || `Failed to ${confirmationAction} student. Status: ${response.status}`);
            }

            toast.success(successMessage);
            // Update the status in the local state - this triggers a re-render
            // and framer-motion animates the change if needed
            setStudents(prevStudents =>
                prevStudents.map(student =>
                    student._id === studentId ? { ...student, status: result.data.student.status } : student
                )
            );

        } catch (err) {
            console.error(`Error ${confirmationAction}ing student:`, err);
            toast.error(`Failed to ${confirmationAction} student: ${err.message}`);
        }
         // No finally block with setIsLoading(false) here
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    };


    if (!staffToken) {
        return <div style={styles.container}>Please log in as staff to view students.</div>;
    }

    if (isLoading) {
        return <div style={styles.loading}>Loading students...</div>;
    }

    if (error) {
        return <div style={styles.error}>Error: {error}</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Student List</h2>
            {students.length === 0 ? (
                <p>No students found.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Image</th>
                                <th style={styles.th}>Full Name</th>
                                <th style={styles.th}>Roll Number</th>
                                <th style={styles.th}>Virtual ID</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Phone</th>
                                <th style={styles.th}>Course</th>
                                <th style={styles.th}>Year/Semester</th>
                                <th style={styles.th}>DOB</th>
                                <th style={styles.th}>Gender</th>
                                <th style={styles.th}>Guardian Contact</th>
                                <th style={styles.th}>Blood Group</th>
                                <th style={styles.th}>Vaccinated</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        {/* Wrap tbody with LayoutGroup and AnimatePresence */}
                         <LayoutGroup>
                             <AnimatePresence mode="popLayout"> {/* mode="popLayout" animates exiting components and then the layout of remaining ones */}
                                 <tbody>
                                     {/* Use motion.tr instead of tr */}
                                     {students.map(student => (
                                         <motion.tr
                                             key={student._id} // Key is crucial for animations
                                             layout // Automatically animates position changes
                                             initial={{ opacity: 0, y: 10 }} // Initial state (fade in from slightly below)
                                             animate={{ opacity: 1, y: 0 }} // Animate to normal state
                                             exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }} // Animate out (fade out, move left slightly)
                                             transition={{ duration: 0.3 }} // Default transition duration
                                         >
                                             {/* Image Cell */}
                                             <td style={styles.td}>
                                                 {student.profileImage ? (
                                                     <img src={student.profileImage} alt={`${student.fullName}'s profile`} style={styles.profileImage} />
                                                 ) : (
                                                     <FaUserCircle style={styles.imagePlaceholderIcon} title="No Image" />
                                                 )}
                                             </td>
                                             <td style={styles.td}>{student.fullName}</td>
                                             <td style={styles.td}>{student.rollNumber}</td>
                                             <td style={styles.td}>{student.virtualId}</td>
                                             <td style={styles.td}>{student.email}</td>
                                             <td style={styles.td}>{student.phoneNumber}</td>
                                             <td style={styles.td}>{student.course}</td>
                                             <td style={styles.td}>{student.yearSemester}</td>
                                             <td style={styles.td}>{formatDate(student.dateOfBirth)}</td>
                                             <td style={styles.td}>{student.gender}</td>
                                             <td style={styles.td}>{student.guardianContact}</td>
                                             <td style={styles.td}>{student.bloodGroup}</td>
                                             <td style={styles.td}>
                                                 {student.isVaccinated ? (
                                                     <FaCheck style={styles.vaccinatedIcon} title="Vaccinated" />
                                                 ) : (
                                                     <FaTimes style={styles.notVaccinatedIcon} title="Not Vaccinated" />
                                                 )}
                                             </td>
                                             <td style={styles.td}>
                                                  <span style={
                                                      student.status === 'active' ? styles.statusActive :
                                                      student.status === 'blocked' ? styles.statusBlocked :
                                                      styles.statusOther
                                                  }>
                                                     {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                                  </span>
                                             </td>
                                             <td style={styles.td}>
                                                 <div style={styles.actionButtons}>
                                                     <Link to={`/students/edit/${student._id}`} style={{ textDecoration: 'none' }}>
                                                         <button style={{ ...styles.button, ...styles.editButton }} title="Edit Student">
                                                             <FaEdit />
                                                         </button>
                                                     </Link>
                                                     <button
                                                         style={{ ...styles.button, ...styles.deleteButton }}
                                                         onClick={() => handleDelete(student._id)}
                                                          // Disable button based on global loading or per-item loading if implemented
                                                         disabled={isLoading}
                                                         title="Delete Student"
                                                     >
                                                         <FaTrash />
                                                     </button>
                                                     <button
                                                         style={{ ...styles.button, ...(student.status === 'active' ? styles.blockButton : styles.unblockButton) }}
                                                         onClick={() => handleStatusChange(student._id, student.status)}
                                                          // Disable button based on global loading or per-item loading if implemented
                                                         disabled={isLoading}
                                                         title={student.status === 'active' ? 'Block Student' : 'Unblock Student'}
                                                     >
                                                         {student.status === 'active' ? <FaBan /> : <FaCheckCircle />}
                                                     </button>
                                                 </div>
                                             </td>
                                         </motion.tr>
                                     ))}
                                 </tbody>
                             </AnimatePresence>
                         </LayoutGroup>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentList;