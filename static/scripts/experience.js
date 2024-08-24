
function createExperienceTextElement(entry, elemName, experience) {
    const textElem = document.createElement('input');
    textElem.className = "experience-text";
    textElem.type = "text";
    textElem.value = experience[elemName];
    textElem.onchange = (e) => {
        experience[elemName] = e.target.value;
        console.log(experiences); // DEBUG
    }
    entry.appendChild(textElem);
    
}


function createExperienceDateElement(entry, elemName, experience) {
    const dateElem = document.createElement('input');
    dateElem.className = "experience-text";
    dateElem.type = "date";
    dateElem.value = experience[elemName];
    dateElem.onchange = (e) => {
        experience[elemName] = e.target.value;
        console.log(experiences); // DEBUG
    }
    entry.appendChild(dateElem);
}


function renderExperiences() {
    
    const expList = document.getElementById("experienceList");

    const expFrag = document.createDocumentFragment();

    for (let i=0; i < experiences.length; i++) {
        const entry = document.createElement('li');
        const position = createExperienceTextElement(entry, "position", experiences[i]);
        const emp = createExperienceTextElement(entry, "employer", experiences[i]);
        const desc = createExperienceTextElement(entry, "description", experiences[i]);
        const start = createExperienceDateElement(entry, "startDate", experiences[i]);
        const end = createExperienceDateElement(entry, "endDate", experiences[i]);
        


        // delete experience button
        const delBtn = document.createElement('button');
        delBtn.innerText = "Delete Position"
        delBtn.onclick = (e) => {
            if(confirm("Are you sure you want to delete this experience?")) {
                experiences.splice(i, 1);
                renderExperiences();
            }
        }
        entry.appendChild(delBtn)
        expFrag.appendChild(entry);
    }

    expList.replaceChildren(expFrag);
}

var experiences;
window.onload = () => {
    const expList = document.getElementById("experienceList");
    const addExperienceBtn = document.getElementById("addExperienceButton");
    const saveBtn = document.getElementById("saveExperienceButton");


    fetch("/api/experience")
        .then(resp=>resp.json())
        .then((data)=>{
            console.log(data);
            experiences = data;         
            renderExperiences();
            addExperienceBtn.onclick = (e) => {
                experiences.push({"position":"", "employer":"", "description":"", "startDate":"", "endDate":""});
                renderExperiences();
            }

            saveBtn.onclick = () => {
                fetch("/api/set-experience", 
                    {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({"experience":experiences}),
                    }
                ).then(resp => resp.json())
                 .then(data => console.log(data));
            }
        });
}
