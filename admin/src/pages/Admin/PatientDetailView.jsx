import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { FaUserMd, FaCalendarAlt, FaPhone, FaMapMarkerAlt, FaVenusMars, FaNotesMedical, FaMoneyBillWave, FaFileInvoiceDollar, FaHashtag, FaInfoCircle, FaDownload, FaImage, FaPrint } from 'react-icons/fa';
import html2canvas from 'html2canvas';

const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        if (includeTime) { options.hour = 'numeric'; options.minute = '2-digit'; }
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) { console.error("Error formatting date:", dateString, e); return 'Invalid Date'; }
};

const createPlainTextContent = (patient) => {
     if (!patient) return '';
    let content = `MedNova - Patient Detailed Record\n==================================\n\n`;
    content += `Basic Information\n-----------------\nName: ${patient.name || 'N/A'}\nAge: ${patient.age || 'N/A'}\nGender: ${patient.gender || 'N/A'}\nPatient Record ID: ${patient._id || 'N/A'}\n\n`;
    content += `Contact & Address\n-----------------\nPhone: ${patient.phone || 'N/A'}\nAddress: ${patient.address || 'N/A'}\n\n`;
    content += `Appointment & Medical\n---------------------\nAppointment Status: ${patient.appointmentStatus || 'N/A'}\nAppointment Notes/Details: ${patient.appointmentDetails || 'N/A'}\nMedical History Provided: ${patient.medicalHistory || 'N/A'}\n\n`;
    content += `Payment Information\n-------------------\nPayment Status: ${patient.paymentDetails?.status || 'N/A'}\nAmount: ${patient.paymentDetails?.amount !== null ? `$${patient.paymentDetails.amount.toFixed(2)}` : 'N/A'}\nMethod: ${patient.paymentDetails?.method || 'N/A'}\nTransaction ID: ${patient.paymentDetails?.transactionId || 'N/A'}\nPayment Date: ${formatDate(patient.paymentDetails?.paymentDate, true)}\nPayment Notes: ${patient.paymentDetails?.notes || 'N/A'}\n\n`;
    content += `Record Information\n------------------\nDate of Record Creation: ${formatDate(patient.createdAt, true)}\nLast Updated: ${formatDate(patient.updatedAt, true)}\n`;
    return content;
};

function PatientDetailViews() {
    const { patientId } = useParams();
    const { token, backendUrl } = useContext(AdminContext);

    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const printRef = useRef();

    useEffect(() => {
        const fetchPatientDetails = async () => {
             setIsLoading(true); setError(null); setPatient(null);

             if (!patientId || !token || !backendUrl) {
                 setError("Missing required information (ID, Admin Token, or URL).");
                 setIsLoading(false);
                 return;
             }

             const apiUrl = `${backendUrl}/api/patients/${patientId}`;

             try {
                 const response = await fetch(apiUrl, {
                     method: 'GET',
                     headers: { 'Authorization': `Bearer ${token}` }
                 });

                 if (!response.ok) {
                     let errorMsg = `Error: ${response.status} ${response.statusText}`;
                     try { const errorBody = await response.json(); errorMsg = errorBody.message || errorMsg; } catch (e) {}
                     throw new Error(errorMsg);
                 }
                 const result = await response.json();
                 if (result.success && result.patient) {
                     setPatient(result.patient);
                 } else {
                     throw new Error(result.message || "Failed to fetch patient data.");
                 }
             } catch (err) {
                 console.error("Error fetching patient details:", err);
                 setError(err.message);
             } finally {
                 setIsLoading(false);
             }
        };
        fetchPatientDetails();
    }, [patientId, token, backendUrl]);

    const handleDownloadData = (format) => {
         if (!patient) return;
         let dataStr = ''; let mimeType = ''; let fileExtension = ''; const safeName = (patient.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase(); const filename = `patient_${safeName}_${patient._id || 'details'}`;
         if (format === 'json') { dataStr = JSON.stringify(patient, null, 2); mimeType = 'application/json'; fileExtension = 'json'; } else if (format === 'txt') { dataStr = createPlainTextContent(patient); mimeType = 'text/plain;charset=utf-8'; fileExtension = 'txt'; } else return;
         const blob = new Blob([dataStr], { type: mimeType }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${filename}.${fileExtension}`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    };

    const handleDownloadImage = async (format = 'png') => {
        if (!printRef.current || !patient) { setError("Could not generate image."); return; }
         setError(null); setIsGeneratingImage(true);
        const safeName = (patient.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filenameBase = `patient_${safeName}_${patient._id || 'details'}`;
        const fileExtension = format === 'jpeg' ? 'jpg' : 'png';
        const mimeType = `image/${format}`;
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2, useCORS: true, logging: false,
            });
            const imageURL = canvas.toDataURL(mimeType, 0.95);
            const link = document.createElement('a'); link.href = imageURL; link.download = `${filenameBase}.${fileExtension}`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        } catch (err) { console.error("Error generating image:", err); setError("Failed to generate image file."); } finally { setIsGeneratingImage(false); }
    };

    const handlePrint = async () => {
        if (!printRef.current || isPrinting) { return; }
        setError(null); setIsPrinting(true);
        try {
            const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false, });
            const imageURL = canvas.toDataURL('image/png');
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0'; iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(`<html><head><title>Print Patient Record</title><style>@page { margin: 0.5in; size: auto; } body { margin: 0; padding: 0; } img { max-width: 100%; height: auto; display: block; }</style></head><body><img src="${imageURL}" alt="Patient Record" /></body></html>`);
            iframeDoc.close();
            iframe.contentWindow.onload = () => {
                iframe.contentWindow.focus(); iframe.contentWindow.print();
                setTimeout(() => { document.body.removeChild(iframe); setIsPrinting(false); }, 1000);
            };
        } catch (err) { console.error("Error preparing print:", err); setError("Failed to prepare record for printing."); setIsPrinting(false); }
    };

    if (isLoading) { return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-500">Loading patient details...</p></div>; }

    if (error && !isGeneratingImage) { return <div className="max-w-4xl mx-auto mt-10 p-6 border border-red-300 bg-red-50 rounded-lg text-center"><h2 className="text-2xl font-semibold text-red-700 mb-4">Error</h2><p className="text-red-600">{error}</p>
        <Link to="/patientList" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Back to Patient List</Link>
    </div>; }
    if (!patient) { return <div className="max-w-4xl mx-auto mt-10 p-6 border border-yellow-400 bg-yellow-50 rounded-lg text-center"><h2 className="text-2xl font-semibold text-yellow-700 mb-4">Patient Not Found</h2><p className="text-yellow-600">Could not find details for the requested patient ID.</p>
        <Link to="/patientList" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Back to Patient List</Link>
    </div>; }

    return (
        <>
            <div
                ref={printRef}
                className="printable-area max-w-4xl mx-auto mt-8 mb-4 p-6 bg-white rounded-lg shadow-lg border border-gray-200"
            >
                <div className="text-center mb-6 pb-4 border-b border-gray-300">
                     <p className="text-sm text-gray-500">Mednova Hospital Name / Clinic</p>
                    <p className="text-xs text-gray-400">Madhubani, Madhubani, Bihar | (555) 123-4567</p>
                    <h1 className="text-3xl font-bold text-blue-700 mt-2">MedNova</h1>
                    <h2 className="text-xl font-semibold text-gray-700 mt-4">Patient Detailed Record</h2>
                </div>

                <div className="space-y-6">
                    <InfoCard title="Basic Information">
                        <DetailItem icon={<FaUserMd />} label="Name" value={patient.name} className="text-lg font-medium" />
                        <DetailItem icon={<FaCalendarAlt />} label="Age" value={patient.age} />
                        <DetailItem icon={<FaVenusMars />} label="Gender" value={patient.gender} />
                        <DetailItem icon={<FaHashtag />} label="Patient Record ID" value={patient._id} className="text-xs" />
                    </InfoCard>

                    <InfoCard title="Contact & Address">
                        <DetailItem icon={<FaPhone />} label="Phone" value={patient.phone} />
                        <DetailItem icon={<FaMapMarkerAlt />} label="Address" value={patient.address} isTextArea={true} />
                    </InfoCard>

                    <InfoCard title="Appointment & Medical">
                        <DetailItem icon={<FaInfoCircle />} label="Appointment Status">
                           <StatusBadge status={patient.appointmentStatus} type="appointment" />
                        </DetailItem>
                        <DetailItem icon={<FaNotesMedical />} label="Appointment Notes/Details" value={patient.appointmentDetails || 'N/A'} isTextArea={true} />
                        <DetailItem icon={<FaNotesMedical />} label="Medical History Provided" value={patient.medicalHistory || 'N/A'} isTextArea={true} />
                    </InfoCard>

                    <InfoCard title="Payment Information">
                        <DetailItem icon={<FaFileInvoiceDollar />} label="Payment Status">
                             <StatusBadge status={patient.paymentDetails?.status} type="payment" />
                        </DetailItem>
                        <DetailItem icon={<FaMoneyBillWave />} label="Amount" value={patient.paymentDetails?.amount !== null ? `₹ ${patient.paymentDetails.amount.toFixed(2)}` : 'N/A'} />
                        <DetailItem icon={<FaInfoCircle />} label="Method" value={patient.paymentDetails?.method || 'N/A'} />
                        <DetailItem icon={<FaHashtag />} label="Transaction ID" value={patient.paymentDetails?.transactionId || 'N/A'} />
                        <DetailItem icon={<FaCalendarAlt />} label="Payment Date" value={formatDate(patient.paymentDetails?.paymentDate, true)} />
                        <DetailItem icon={<FaNotesMedical />} label="Payment Notes" value={patient.paymentDetails?.notes || 'N/A'} isTextArea={true}/>
                    </InfoCard>

                     <InfoCard title="Record Information">
                        <DetailItem icon={<FaCalendarAlt />} label="Date of Record Creation" value={formatDate(patient.createdAt, true)} />
                        <DetailItem icon={<FaCalendarAlt />} label="Last Updated" value={formatDate(patient.updatedAt, true)} />
                    </InfoCard>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-4 mb-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-center items-center flex-wrap gap-3 print:hidden">
                 <Link
                    to="/patientList"
                    className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600 transition duration-150 text-center w-full sm:w-auto"
                 >
                    Back to List
                </Link>

                 <button
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className={`bg-teal-600 text-white px-5 py-2 rounded hover:bg-teal-700 transition duration-150 flex items-center justify-center gap-2 w-full sm:w-auto ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Print this record"
                 >
                    <FaPrint /> {isPrinting ? 'Preparing Print...' : 'Print Record'}
                </button>

                 <button
                    onClick={() => handleDownloadImage('png')}
                    disabled={isGeneratingImage || isPrinting}
                    className={`bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700 transition duration-150 flex items-center justify-center gap-2 w-full sm:w-auto ${(isGeneratingImage || isPrinting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Download details as PNG Image"
                 >
                    <FaImage /> {isGeneratingImage ? 'Generating...' : 'Download (.png)'}
                </button>
                 <button
                    onClick={() => handleDownloadImage('jpeg')}
                    disabled={isGeneratingImage || isPrinting}
                    className={`bg-orange-500 text-white px-5 py-2 rounded hover:bg-orange-600 transition duration-150 flex items-center justify-center gap-2 w-full sm:w-auto ${(isGeneratingImage || isPrinting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Download details as JPG Image"
                 >
                    <FaImage /> {isGeneratingImage ? 'Generating...' : 'Download (.jpg)'}
                </button>

            </div>
        </>
    );
}

const InfoCard = ({ title, children }) => (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {children}
        </div>
    </div>
);

const DetailItem = ({ label, value, icon, children, className = '', isTextArea = false }) => (
    <div className={`flex items-start mb-1 ${className}`}>
        <span className="text-blue-600 w-5 mr-2 mt-1">{icon || <FaInfoCircle />}</span>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}:</p>
            {children ? (
                <div className="text-md text-gray-800">{children}</div>
            ) : isTextArea ? (
                 <p className="text-md text-gray-800 whitespace-pre-wrap">{value || 'N/A'}</p>
            ) : (
                <p className="text-md text-gray-800">{value ?? 'N/A'}</p>
            )}
        </div>
    </div>
);

const StatusBadge = ({ status, type }) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    const normalizedStatus = status || (type === 'payment' ? 'Unpaid' : 'N/A');

    if (type === 'appointment') {
        switch (normalizedStatus) {
            case 'Completed': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
            case 'Scheduled': bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
            case 'Cancelled': bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
            case 'CheckedIn': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
            default: break;
        }
    } else if (type === 'payment') {
         switch (normalizedStatus) {
            case 'Paid': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
            case 'Partial': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
            case 'Waived': bgColor = 'bg-purple-100'; textColor = 'text-purple-800'; break;
            case 'Unpaid': default: bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
        }
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
            {normalizedStatus}
        </span>
    );
};


export default PatientDetailViews;