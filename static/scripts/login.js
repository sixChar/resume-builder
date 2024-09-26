
const loginForm = document.getElementById("login-form");
loginForm.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    fetch("./api/login", {
        method: "POST",
        body: fd
    })
    .then(response => {
        // Check if the response is successful
        if (!response.ok) {
            return response.json().then(data => {
                // Handle error message if the login fails
                console.error(data.message);
                alert("Login failed: " + data.message);
            });
        }
        // Parse the JSON response
        return response.json();
    })
    .then(data => {
        if (data && data.redirect) {
            // Redirect to the URL returned by the server
            window.location.href = data.redirect;
        }
    })
    .catch(error => {
        // Handle any unexpected errors
        console.error("Error:", error);
        alert("An error occurred during login.");
    });
};

