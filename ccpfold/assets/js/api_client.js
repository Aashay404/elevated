/**
* CCPF Frontend API Client
* Simple reusable class to call backend APIs with minimal code.
*/
class ApiClient {
    constructor() {
        this.baseUrl = "https://server.ccpf.in/public/api";   // ← CHANGE THIS
        this.timeout = 15000; // 15 seconds timeout
    }
 
    async callApi(endpoint, method = "GET", body = null) {
        const url = `${this.baseUrl}${endpoint}`;
 
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
 
        let fetchOptions = {
            method: method.toUpperCase(),
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            signal: controller.signal
        };
 
        // Add body only for non-GET requests
        if (body && method.toUpperCase() !== "GET") {
            fetchOptions.body = JSON.stringify(body);
        }
 
        // Handle GET params if body provided
        let finalUrl = url;
        if (method.toUpperCase() === "GET" && body && typeof body === "object") {
            const query = new URLSearchParams(body).toString();
            finalUrl = `${url}?${query}`;
        }
 
        try {
            const res = await fetch(finalUrl, fetchOptions);
            clearTimeout(timeoutId);
 
            const data = await res.json().catch(() => ({}));
 
            if (!res.ok) {
                return {
                    success: false,
                    status: res.status,
                    message: data?.header?.message || "API Request Failed",
                    errorDetails: data?.body || null
                };
            }
            return {
                success: true,
                status: res.status,
                data: data.body || data,
                message: data?.header?.message || "Success"
            };
        } catch (error) {
            clearTimeout(timeoutId);
 
            return {
                success: false,
                status: 0,
                message: error.name === "AbortError"
                    ? "Request Timed Out"
                    : "Network Error",
                error: error.message
            };
        }
    }
}
 
// Export for usage
export const apiClient = new ApiClient();