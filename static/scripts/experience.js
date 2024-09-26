

let elementIdCounter = 0;
function createExperienceTextElement(entry, elemName, experience, labelText) {
    const uniqueId = `${elemName}-${elementIdCounter}`;

    const label = document.createElement('label');
    label.setAttribute('for', uniqueId);
    label.innerText = labelText;
    entry.appendChild(label);

    const textElem = document.createElement('input');
    textElem.className = "form-text";
    textElem.type = "text";
    textElem.value = experience[elemName];
    textElem.onchange = (e) => {
        experience[elemName] = e.target.value;
        console.log(experiences); // DEBUG
    }
    entry.appendChild(textElem);
    
}


function createExperienceDateElement(entry, elemName, experience, labelText) {
    const uniqueId = `${elemName}-${elementIdCounter}`;

    const label = document.createElement('label');
    label.setAttribute('for', uniqueId);
    label.innerText = labelText;
    entry.appendChild(label);

    const dateElem = document.createElement('input');
    dateElem.className = "form-text";
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
        entry.className = "form-section";
        const position = createExperienceTextElement(entry, "position", experiences[i], "Position Title:");
        const emp = createExperienceTextElement(entry, "employer", experiences[i], "Employer:");
        const desc = createExperienceTextElement(entry, "description", experiences[i], "Description:");
        const start = createExperienceDateElement(entry, "startDate", experiences[i], "Started:");
        const end = createExperienceDateElement(entry, "endDate", experiences[i], "Ended (leave empty for ongoing):");
        


        // delete experience button
        const delBtn = document.createElement('button');
        delBtn.className="button color-delete"
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


    fetch("./api/experience")
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
                fetch("./api/set-experience", 
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
