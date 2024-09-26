const signupForm = document.getElementById("signup-form");

signupForm.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    fetch("./api/signup", {
        method: "POST",
        body: fd
    })
    .then(response => {
        // Check if the response is successful
        if (!response.ok) {
            return response.json().then(data => {
                // Handle error message if the signup fails
                console.error(data.message);
                alert("Signup failed: " + data.message);
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
        alert("An error occurred during signup.");
    });
};

