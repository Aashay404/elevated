// assets/js/appointment_validation.js
$(document).ready(function () {

    const form = $("#appointmentForm");
    const submitBtn = $("#submitBtn");

    if (!form.length || !submitBtn.length) return;

    // Disable & hide button initially
    submitBtn.prop("disabled", true);

    const clinicSelect      = $("#clinicSelect");
    const maritalStatus     = $("#maritalStatus");
    const nameInput         = $("#name");
    const emailInput        = $("#email");
    const phoneInput        = $("#phone");
    const dobInput          = $("#dob");
    const ageInput          = $("#age");
    const appointmentDate   = $("#appointmentDate");
    const appointmentTime   = $("#appointmentTime");
    const aadharInput       = $("#aadhar");

    /* -----------------------------------------------------------
       Restrict typing for date fields (YYYY-MM-DD max)
    ------------------------------------------------------------ */
    function restrictDateInput(input) {
        if (!input || !input.length) return;

        input.on("input", function () {
            let value = input.val();

            // Remove invalid characters
            value = value.replace(/[^\d-]/g, "");

            // Max length = 10 (YYYY-MM-DD)
            if (value.length > 10) {
                value = value.slice(0, 10);
            }

            input.val(value);
        });
    }

    restrictDateInput(dobInput);
    restrictDateInput(appointmentDate);

    /* -----------------------------------------------------------
       Helper: Add / remove red border
    ------------------------------------------------------------ */
    function applyErrorStyle(el, isValid) {
        if (!el || !el.length) return;
        if (!isValid) {
            // you can uncomment this if you want red borders
            // el.addClass("form-validation-error");
        } else {
            el.removeClass("form-validation-error");
        }
    }

    /* -----------------------------------------------------------
       Core Validation Function
    ------------------------------------------------------------ */
    function validateForm() {
        let valid = true;

        // Ensure global flag exists
        if (typeof window.ccpfRecommendedEligible === "undefined") {
            window.ccpfRecommendedEligible = false;
        }

        const clinicVal  = clinicSelect.val();
        const maritalVal = maritalStatus.val();

        // Native validations
        const nameValid    = nameInput[0].checkValidity();
        const emailValid   = emailInput[0].checkValidity();
        const phoneValid   = phoneInput[0].checkValidity();
        const appDateValid = appointmentDate[0].checkValidity();
        const appTimeValid = appointmentTime[0].checkValidity();

        const dobVal = dobInput.val();
        const ageVal = ageInput.val();
        const dobValid = !!dobVal;
        const ageValid = !!ageVal && !isNaN(ageVal) && Number(ageVal) > 0;

        let aadharValid = true;
        if (aadharInput.val()) {
            aadharValid = aadharInput[0].checkValidity();
        }

        // Recommended test must be available / eligible
        const recommendedOk = !!window.ccpfRecommendedEligible;

        // Combine validity
        if (!clinicVal)     valid = false;
        if (!maritalVal)    valid = false;
        if (!nameValid)     valid = false;
        if (!emailValid)    valid = false;
        if (!phoneValid)    valid = false;
        if (!appDateValid)  valid = false;
        if (!appTimeValid)  valid = false;
        if (!dobValid)      valid = false;
        if (!ageValid)      valid = false;
        if (!aadharValid)   valid = false;
        if (!recommendedOk) valid = false;

        // Apply error styles
        applyErrorStyle(clinicSelect, !!clinicVal);
        applyErrorStyle(maritalStatus, !!maritalVal);
        applyErrorStyle(nameInput, nameValid);
        applyErrorStyle(emailInput, emailValid);
        applyErrorStyle(phoneInput, phoneValid);
        applyErrorStyle(dobInput, dobValid);
        applyErrorStyle(ageInput, ageValid);
        applyErrorStyle(appointmentDate, appDateValid);
        applyErrorStyle(appointmentTime, appTimeValid);
        if (aadharInput.val()) applyErrorStyle(aadharInput, aadharValid);

        // Optional: highlight recommended box when invalid
        const recommendedBox = $("#recommendedTest");
        if (recommendedBox.length) {
            applyErrorStyle(recommendedBox, recommendedOk);
        }

        // Enable/disable + show/hide button
        submitBtn.prop("disabled", !valid);

        // Button visible ONLY when recommendation exists
       

        return valid;
    }

    // Expose validateForm globally so logic.js can call after API, DOB, etc.
    window.ccpfValidateForm = validateForm;

    /* -----------------------------------------------------------
       Listen to all normal inputs and selects
    ------------------------------------------------------------ */
    $("input, select").on("input change blur", function () {
        validateForm();
    });

    /* -----------------------------------------------------------
       Fix for niceSelect (clinic + marital dropdown)
    ------------------------------------------------------------ */
    $(document).on("click", ".nice-select .option", function () {
        setTimeout(() => validateForm(), 10);
    });

    /* -----------------------------------------------------------
       Final guard on Submit (browser native messages)
    ------------------------------------------------------------ */
    form.on("submit", function (e) {
        if (!validateForm()) {
            e.preventDefault();
            form[0].reportValidity();
        }
    });

    // Initial validation run
    validateForm();
});