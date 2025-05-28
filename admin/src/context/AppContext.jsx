import { createContext } from "react";


export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currency = '$'

    const calculateAge = (dob) => {
        if (!dob) return "N/A"; // Handle missing DOB

        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const month = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const slotDataFormat = (slotDate) => {
        const dateArray = slotDate.split('_');
        return `${dateArray[0]} ${month[Number(dateArray[1])]} ${dateArray[2]}`;
    };

    const value = {
        calculateAge,slotDataFormat,currency
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider