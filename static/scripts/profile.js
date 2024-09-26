

window.onload = function() {
    const form = document.getElementById("profile-form");
    const deleteBtn = document.getElementById("delete-profile-btn");
    const saveBtn = document.getElementById("save-profile-btn");

    saveBtn.onclick = (e) => {
        e.preventDefault();
        const fd = new FormData(form);

        fetch("/api/update-profile", {
            method: 'post',
            body: fd,
        }).then(resp => console.log("Got resp!"));
    }

    
    deleteBtn.onclick = (e) => {
        if(confirm("WARNGING: Are you sure you want to PERMANENTLY delete your profile?")) {
            fetch("/api/delete-profile", {
                method: 'post',
                body: {},
            }).then(resp => {
                if (resp.redirected) {
                    window.location.href = resp.url;
                } else {
                    console.log(resp);
                }
	    });
        }
        
        
    }

}



