// assets/js/appointment_logic.js
import { apiClient } from "./api_client.js";

/* ----------------- CLINIC DROPDOWN + PRESELECT ----------------- */
let selectedAge = null;
let selectedMaritalStatus = null;

// global flag used by validation.js
window.ccpfRecommendedEligible = false;

function findClinicIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function callCcpCentersApi() {
    try {
        const response = await apiClient.callApi("/getCcpfCenters", "GET");
        const centersList = response && response.data ? response.data : [];


        const dropdown = document.getElementById("clinicSelect");
        if (!dropdown) return;

        dropdown.innerHTML = `<option value="">Choose Clinic</option>`;

        centersList.forEach(center => {
            const opt = document.createElement("option");
            opt.value = center.id;
            opt.textContent = center.center_name;
            dropdown.appendChild(opt);
        });

        // preselect clinic from URL (?id=3)
        const preselectedId = findClinicIdFromUrl();
        if (preselectedId) {
            dropdown.value = preselectedId;
        }

        // if using niceSelect plugin, refresh it
        if (typeof $(dropdown).niceSelect === "function") {
            $(dropdown).niceSelect("update");
        }
    } catch (err) {
        console.error("Error loading clinics:", err);
    }
}

/* ----------------- AGE CALC FROM DOB ----------------- */

function calculateAge(dob) {
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : "";
}

function setupDobAndAge() {
    const dobInput = document.getElementById("dob");
    const ageInput = document.getElementById("age");
    if (!dobInput || !ageInput) return;

    // Set DOB max = today (no future DOB)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    dobInput.setAttribute("max", todayStr);

    dobInput.addEventListener("change", () => {
        const dobValue = dobInput.value;
        if (!dobValue) {
            ageInput.value = "";
            selectedAge = null;
            window.ccpfRecommendedEligible = false;
            if (window.ccpfValidateForm) window.ccpfValidateForm();
            return;
        }

        const age = calculateAge(dobValue);
        ageInput.value = age !== "" ? age : "";
        selectedAge = ageInput.value;

        if (ageInput.value !== "") {
            const numericAge = Number(ageInput.value);
            if (
                numericAge >= 1 &&
                numericAge <= 100 &&
                selectedMaritalStatus !== "" &&
                selectedMaritalStatus != null
            ) {
                getRecommendedTests(numericAge, selectedMaritalStatus);
            }
        } else {
            window.ccpfRecommendedEligible = false;
            if (window.ccpfValidateForm) window.ccpfValidateForm();
        }
    });
}

/* ----------------- RECOMMENDED TEST API + UI ----------------- */

async function getRecommendedTests(age, maritalStatus) {
    const testBox = document.getElementById("recommendedTest");
    const testDetails = document.getElementById("testDetails");

    // reset recommendation state before call
    window.ccpfRecommendedEligible = false;
    if (window.ccpfValidateForm) window.ccpfValidateForm();

    let fromAge;
    let toAge;

    if (age >= 10 && age <= 14 && maritalStatus === "unmarried") {
        fromAge = 10;
        toAge = 14;
    } else if (age >= 15 && age <= 45 && maritalStatus === "unmarried") {
        fromAge = 15;
        toAge = 45;
    } else if (age >= 15 && age <= 45 && maritalStatus === "married") {
        fromAge = 15;
        toAge = 45;
    } else if (age > 45 && age <= 65 && maritalStatus === "married") {
        fromAge = 46;
        toAge = 65;
    } else {
        // outside defined ranges → backend will likely return isEligible=false
        fromAge = 1;
        toAge = 2;
    }

    try {
        if (testBox) {
            testBox.style.display = "none";
        }
        if (testDetails) {
            testDetails.innerHTML = "";
        }

        const response = await apiClient.callApi("/getRecommendedTest", "POST", {
            ageFrom: fromAge,
            ageTo: toAge,
            maritalStatus: maritalStatus,
        });

        if (response.success && response.data) {
            console.log("Recommended Tests:", response.data.isEligible);
            localStorage.setItem("test_id", response.data.recommendedTestId);
            getUiRecommendedTestUiUpdated(response.data);
        } else {
            console.error("Error fetching recommended tests:", response.message);
            window.ccpfRecommendedEligible = false;
            if (window.ccpfValidateForm) window.ccpfValidateForm();
        }
    } catch (err) {
        console.error("Error in getRecommendedTests:", err);
        window.ccpfRecommendedEligible = false;
        if (window.ccpfValidateForm) window.ccpfValidateForm();
    }
}

let dynamicAmount = null;

function getUiRecommendedTestUiUpdated(response) {
    console.log("isEligible:", response.isEligible);

    const testBox = document.getElementById("recommendedTest");
    const testDetails = document.getElementById("testDetails");
    if (!testBox || !testDetails) return;

    let result = "";
    testBox.style.display = "none";
    testDetails.innerHTML = "";

    if (!response.isEligible) {
        // NOT eligible → keep flag false
        window.ccpfRecommendedEligible = false;
        result =
            "⚠️ Not eligible for vaccination or screening based on age and marital status";
    } 
    else if (response.pricing.hpvDetails.regularCost != null) {
        console.log("HPV regular cost present");
        window.ccpfRecommendedEligible = true;
        dynamicAmount = response.totalOnline || null;

        result = `
          <div style="font-size: 18px; font-weight: bold; color: #28a745; margin-bottom: 10px;">
            ✅ ${response.vaccineTitle}
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745;">
            <strong>Pricing:</strong><br>
            ${response.pricing &&
                response.pricing.hpvDetails &&
                (response.pricing.hpvDetails.regularCost || response.pricing.hpvDetails.onlineCost)
                ? `
                  • HPV Vaccination:
                    ${response.pricing.hpvDetails.regularCost ? `${response.pricing.hpvDetails.regularCost} (Regular)` : ""}
                    ${response.pricing.hpvDetails.onlineCost ? `/ ${response.pricing.hpvDetails.onlineCost} (Online)` : ""}
                  <br>
                  `
                : ""
            }
            ${response.pricing &&
                response.pricing.papDetails &&
                (response.pricing.papDetails.regularCost || response.pricing.papDetails.onlineCost)
                ? `
                  • Pap Smear Test:
                    ${response.pricing.papDetails.regularCost ? `${response.pricing.papDetails.regularCost} (Regular)` : ""}
                    ${response.pricing.papDetails.onlineCost ? `/ ${response.pricing.papDetails.onlineCost} (Online)` : ""}
                  <br>
                  `
                : ""
            }
            ${response.totalOnline
                ? `<span style="color: #28a745; font-weight: bold;">Total Online: ${response.totalOnline}</span><br>`
                : ""
            }
            ${response.totalSavings
                ? `<span style="color: #dc3545; font-weight: bold;">You Save: ${response.totalSavings}!</span>`
                : ""
            }
          </div>
        `;
    }
    else if ( response.pricing.hpvDetails.regularCost==null && response.pricing.regularCostDetails.perDoseCost == null ) {
        // Vaccine-only scenario
        window.ccpfRecommendedEligible = true;

        dynamicAmount = response.pricing.onlineDiscountDetails.onlineDiscount;

        result = `
          <div style="font-size: 18px; font-weight: bold; color: #28a745; margin-bottom: 10px;">
            ✅ ${response.vaccineTitle}
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745;">
            <strong>Pricing:</strong><br>
            ${response.pricing.regularCostDetails.regularCost 
                ? `• Regular Cost: ${response.pricing.regularCostDetails.regularCost} <br>`
                : ""
            }
            ${
                response.pricing.onlineDiscountDetails.onlineDiscount 
                ? `• <span style="color: #28a745; font-weight: bold;">Online Discount: ${response.pricing.onlineDiscountDetails.onlineDiscount}</span><br>`
                : ""
            }
            ${response.totalSavings
                ? `• <span style="color: #dc3545; font-weight: bold;">You Save: ${response.totalSavings}!</span>`
                : ""
            }
          </div>
        `;
    }
    
    else if (response.pricing && response.pricing.regularCostDetails && response.pricing.regularCostDetails.regularCost != null) {
        // Vaccine-only scenario
        window.ccpfRecommendedEligible = true;

        dynamicAmount = response.pricing.onlineDiscountDetails.onlineDiscount;

        result = `
          <div style="font-size: 18px; font-weight: bold; color: #28a745; margin-bottom: 10px;">
            ✅ ${response.vaccineTitle}
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745;">
            <strong>Pricing:</strong><br>
            ${response.pricing.regularCostDetails.regularCost &&
                response.pricing.regularCostDetails.perDoseCost &&
                response.pricing.regularCostDetails.totalDoses
                ? `• Regular Cost: ${response.pricing.regularCostDetails.regularCost} (${response.pricing.regularCostDetails.perDoseCost} × ${response.pricing.regularCostDetails.totalDoses} doses)<br>`
                : ""
            }
            ${response.pricing.onlineDiscountDetails &&
                response.pricing.onlineDiscountDetails.onlineDiscount &&
                response.pricing.onlineDiscountDetails.perDoseCost &&
                response.pricing.onlineDiscountDetails.totalDoses
                ? `• <span style="color: #28a745; font-weight: bold;">Online Discount: ${response.pricing.onlineDiscountDetails.onlineDiscount} (${response.pricing.onlineDiscountDetails.perDoseCost} × ${response.pricing.onlineDiscountDetails.totalDoses} doses)</span><br>`
                : ""
            }
            ${response.totalSavings
                ? `• <span style="color: #dc3545; font-weight: bold;">You Save: ${response.totalSavings}!</span>`
                : ""
            }
          </div>
        `;
    } else if (response.pricing.hpvDetails.regularCost != null) {
        window.ccpfRecommendedEligible = true;

        dynamicAmount = response.totalOnline || null;

        result = `
          <div style="font-size: 18px; font-weight: bold; color: #28a745; margin-bottom: 10px;">
            ✅ ${response.vaccineTitle}
          </div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745;">
            <strong>Pricing:</strong><br>
            ${response.pricing &&
                response.hpvDetails &&
                (response.pricing.hpvDetails.regularCost || response.pricing.hpvDetails.onlineCost)
                ? `
                  • HPV Vaccination:
                    ${response.pricing.hpvDetails.regularCost ? `${response.pricing.hpvDetails.regularCost} (Regular)` : ""}
                    ${response.pricing.hpvDetails.onlineCost ? `/ ${response.pricing.hpvDetails.onlineCost} (Online)` : ""}
                  <br>
                  `
                : ""
            }
            ${response.pricing &&
                response.papDetails &&
                (response.pricing.papDetails.regularCost || response.pricing.papDetails.onlineCost)
                ? `
                  • Pap Smear Test:
                    ${response.pricing.papDetails.regularCost ? `${response.pricing.papDetails.regularCost} (Regular)` : ""}
                    ${response.pricing.papDetails.onlineCost ? `/ ${response.pricing.papDetails.onlineCost} (Online)` : ""}
                  <br>
                  `
                : ""
            }
            ${response.totalOnline
                ? `<span style="color: #28a745; font-weight: bold;">Total Online: ${response.totalOnline}</span><br>`
                : ""
            }
            ${response.totalSavings
                ? `<span style="color: #dc3545; font-weight: bold;">You Save: ${response.totalSavings}!</span>`
                : ""
            }
          </div>
        `;
    }

    else {
        // HPV + Pap scenario (or similar)

    }

    testDetails.innerHTML = result;
    testBox.style.display = "block";

    // Re-run validation after updating recommendation
    if (window.ccpfValidateForm) window.ccpfValidateForm();
}

/* ----------------- APPOINTMENT DATE LIMIT (NO PAST DATES) ----------------- */

function setupAppointmentDateLimit() {
    const appointmentDate = document.getElementById("appointmentDate");
    if (!appointmentDate) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    appointmentDate.setAttribute("min", todayStr);
}

/* ----------------- MARITAL STATUS / niceSelect HANDLER ----------------- */

$(document).on("click", ".nice-select .option", function () {
    const originalSelect = $(this).closest(".nice-select").prev("select")[0];

    // Only handle maritalStatus dropdown
    if (!originalSelect || originalSelect.id !== "maritalStatus") {
        return;
    }

    const newValue = this.getAttribute("data-value");
    originalSelect.value = newValue;
    selectedMaritalStatus = newValue;

    const numericAge = selectedAge ? Number(selectedAge) : null;
    if (
        numericAge &&
        numericAge >= 1 &&
        numericAge <= 100 &&
        newValue !== "" &&
        newValue != null
    ) {
        getRecommendedTests(numericAge, newValue);
    } else {
        window.ccpfRecommendedEligible = false;
        if (window.ccpfValidateForm) window.ccpfValidateForm();
    }

    // Trigger native change in case something else listens
    originalSelect.dispatchEvent(new Event("change"));
});

/* ----------------- INIT ----------------- */

// Utility function to sanitize amount by removing currency symbols and commas
function sanitizeAmount(amount) {
    return parseInt(amount.replace(/[^0-9]/g, ""), 10);
}

// INIT PAYMENT
async function callInitPaymentApi(amount, billingName, billingEmail, billingTel) {
    try {
        // Sanitize the amount before sending it in the request body
        const sanitizedAmount = sanitizeAmount(amount);

        const response = await apiClient.callApi("/payments/init", "POST", {
            amount: sanitizedAmount,
            billingName: billingName,
            billingEmail: billingEmail,
            billingTel: billingTel,
        });

        console.log("Init Payment API Response:", response);

        if (!response.success) {
            console.error("Payment init failed:", response.message, response.errorDetails);
            alert("Failed to start payment. Please try again.");
            return;
        }

        // Our ApiResponse puts body into response.data
        const data = response.data || {};

        const paymentUrl = data.paymentUrl;
        const encRequest = data.encRequest;
        const accessCode = data.accessCode;
        const orderId = data.orderId;

        if (!paymentUrl || !encRequest || !accessCode) {
            console.error("Missing required fields from init API:", data);
            alert("Error initiating payment. Please contact support.");
            return;
        }

        // (Optional) store orderId for later appointment API

        localStorage.setItem("ccpf_order_id", orderId);
        localStorage.setItem("center_id", $("#clinicSelect").val());
        localStorage.setItem("user_name", $("#name").val());
        localStorage.setItem("user_email", $("#email").val());
        localStorage.setItem("user_mobile", $("#phone").val());
        localStorage.setItem("user_adhar", $("#aadhar").val());
        localStorage.setItem("user_dob", $("#dob").val());
        localStorage.setItem("user_age", $("#age").val());
        localStorage.setItem("marital_status", $("#maritalStatus").val());
        localStorage.setItem("appointment_date", $("#appointmentDate").val());
        localStorage.setItem("appointment_time", $("#appointmentTime").val());

        // ---- Create form and auto-submit to CCAvenue ----
        const form = document.createElement("form");
        form.method = "POST";
        form.action = paymentUrl;
        form.style.display = "none";

        // encRequest field
        const encInput = document.createElement("input");
        encInput.type = "hidden";
        encInput.name = "encRequest";
        encInput.value = encRequest;
        form.appendChild(encInput);

        // access_code field
        const accessInput = document.createElement("input");
        accessInput.type = "hidden";
        accessInput.name = "access_code";
        accessInput.value = accessCode;
        form.appendChild(accessInput);

        document.body.appendChild(form);

        console.log("Redirecting to CCAvenue with auto-submitted form...");
        form.submit();
    } catch (err) {
        console.error("Error loading initiating payments:", err);
        alert("Something went wrong while initiating payment.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    callCcpCentersApi();
    setupDobAndAge();
    setupAppointmentDateLimit();

    const submitAppointmentBtn = document.getElementById("submitBtn");
    const submitText = document.getElementById("submitText");
    const loadingText = document.getElementById("loadingText");
    const loadingSpinner = document.getElementById("loadingSpinner");
    
    let isSubmitting = false;

    submitAppointmentBtn.addEventListener("click", async function () {
        
        if (isSubmitting) return;

            isSubmitting = true;
        
            // 🔄 Show loading UI
            submitAppointmentBtn.disabled = true;
            submitText.style.display = "none";
            loadingText.style.display = "inline";
            loadingSpinner.style.display = "inline-block";

    try {
        const response = await apiClient.callApi("/appointments/submit", "POST", {
            orderId: null,
            ccpfCenterId: $("#clinicSelect").val(),
            recommendedTestId: localStorage.getItem("test_id"),

            name: $("#name").val(),
            email: $("#email").val(),
            phoneNo: $("#phone").val(),
            aadharNo: $("#aadhar").val(),

            dob: $("#dob").val(),
            age: $("#age").val(),
            maritalStatus: $("#maritalStatus").val(),

            appointmentDate: $("#appointmentDate").val(),
            appointmentTime: $("#appointmentTime").val(),
        });

        if (response.success) {
            alert("Appointment booked successfully!");
            window.location.reload();
        } else {
            alert("Something went wrong while booking appointment.");
        }

    } catch (err) {
        console.error(err);
        alert("Server error while booking appointment.");
    }finally{
        isSubmitting = false;
        submitAppointmentBtn.disabled = false;

        submitText.style.display = "inline";
        loadingText.style.display = "none";
        loadingSpinner.style.display = "none";
    }
});

});