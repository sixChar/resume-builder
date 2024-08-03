
const signupForm = document.getElementById("signup-form");
signupForm.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fetch("/api/signup", {
        method: "post",
        body: fd
    });
    
}
