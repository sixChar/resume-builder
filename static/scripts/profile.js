

window.onload = function() {
    const form = document.getElementById("profile-form");

    form.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);

        fetch("/api/update-profile", {
            method: 'post',
            body: fd,
        }).then(resp => console.log("Got resp!"));
    }

}



