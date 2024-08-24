
const loginForm = document.getElementById("login-form");
loginForm.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fetch("/api/login", {
        method: "post",
        body: fd
    });


}

