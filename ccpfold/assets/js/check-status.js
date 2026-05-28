import { apiClient } from "./api_client.js";

async function callCheckPaymentStatusApi() {
    try {
        const response = await apiClient.callApi("/payments/status", "GET",{
            orderId : localStorage.getItem("ccpf_order_id")
        });
        callSubmitAppointmentApi();
      
    } catch (err) {
        console.error("Error loading clinics:", err);
    }
}

async function callSubmitAppointmentApi(){
    try{
        const response = await apiClient.callApi("/appointments/submit","POST",{
            orderId : localStorage.getItem("ccpf_order_id"),
            ccpfCenterId : localStorage.getItem("center_id"),
            recommendedTestId : localStorage.getItem("test_id"),
            name: localStorage.getItem("user_name"),
            email: localStorage.getItem("user_email"),
            phoneNo: localStorage.getItem("user_mobile"),
            aadharNo: localStorage.getItem("user_adhar"),
            dob: localStorage.getItem("user_dob"),
            age: localStorage.getItem("user_age"),
            maritalStatus: localStorage.getItem("marital_status"),
            appointmentDate: localStorage.getItem("appointment_date"),
            appointmentTime: localStorage.getItem("appointment_time"),
        });
        if(!response.success){
            alert("Failed to submit appointment. Please try again or contact support.");
             windows.location.replace('appointment.html');
            return;
        } 
        alert("Appointment submitted successfully!");
        localStorage.removeItem("ccpf_order_id");
        localStorage.removeItem("center_id");
        localStorage.removeItem("test_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_mobile");
        localStorage.removeItem("user_adhar");
        localStorage.removeItem("user_dob");
        localStorage.removeItem("user_age");
        localStorage.removeItem("marital_status");
        localStorage.removeItem("appointment_date");
        localStorage.removeItem("appointment_time");
        window.location.replace('index.html');


    }catch(err){
        console.log(err);
            alert("Something went wrong!");
    }
}
document.addEventListener("DOMContentLoaded", () => {
   callCheckPaymentStatusApi();
   
});