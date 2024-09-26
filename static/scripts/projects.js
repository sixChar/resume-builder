
// Counter for generating unique IDs
let elementIdCounter = 0;
function createProjectInputElement(entry, elemName, project, labelText) {
    // Increment the counter and create a unique ID
    const uniqueId = `${elemName}-${elementIdCounter++}`;

    const label = document.createElement('label');
    label.setAttribute('for', uniqueId);
    label.innerText = labelText;
    entry.appendChild(label);

    const textElem = document.createElement('input');
    textElem.className = "form-text";
    textElem.type = "text";
    textElem.id = uniqueId; // Set the input's id using the unique ID
    textElem.value = project[elemName];
    textElem.onchange = (e) => {
        project[elemName] = e.target.value;
        console.log(projects); // DEBUG
    }
    entry.appendChild(textElem);
}

function createProjectTextElement(entry, elemName, project, labelText) {
    // Increment the counter and create a unique ID
    const uniqueId = `${elemName}-${elementIdCounter++}`;

    const label = document.createElement('label');
    label.setAttribute('for', uniqueId);
    label.innerText = labelText;
    entry.appendChild(label);

    const textElem = document.createElement('textarea');
    textElem.className = "form-textarea";
    textElem.type = "text";
    textElem.id = uniqueId; // Set the input's id using the unique ID
    textElem.rows = 5;
    textElem.value = project[elemName];
    textElem.onchange = (e) => {
        project[elemName] = e.target.value;
        console.log(projects); // DEBUG
    }
    entry.appendChild(textElem);
}


function createProjectSkill(skillList, skillIdx, project) {
    const skillContainer = document.createElement('div');
    skillContainer.className = "form-list-item";

    const skill = document.createElement('input');
    skill.className = "form-text";
    skill.type = "text";
    skill.value = project.skills[skillIdx];
    skill.onchange = (e) => {
        project.skills[skillIdx] = e.target.value;
    }
    skillContainer.appendChild(skill);

    const delSkill = document.createElement('button');
    delSkill.innerText = "Delete Skill";
    delSkill.className = 'button color-delete';
    delSkill.onclick = (e) => {
        if (confirm("Definitely delete this skill?")) {
            project.skills.splice(skillIdx, 1);
            renderProjects(); // Rerender projects
        }
    }
    skillContainer.appendChild(delSkill);

    skillList.appendChild(skillContainer);
}


function renderProjects() {
    const projList = document.getElementById("projectList");
    const projFrag = document.createDocumentFragment();

    for (let i = 0; i < projects.length; i++) {
        const entry = document.createElement('li');
        entry.className = 'form-section';

        // Add labels and inputs
        createProjectInputElement(entry, "title", projects[i], "Project Title:");
        createProjectTextElement(entry, "desc", projects[i], "Description:");
        createProjectInputElement(entry, "link", projects[i], "Link:");

        const skillsLabel = document.createElement('label');
        skillsLabel.innerText = "Skills:";
        entry.appendChild(skillsLabel);

        const skillList = document.createElement('div');
        skillList.className = "form-list";
        for (let j = 0; j < projects[i].skills.length; j++) {
            createProjectSkill(skillList, j, projects[i]);
        }
        entry.appendChild(skillList);

        const addSkill = document.createElement('button');
        addSkill.className = 'button color-add';
        addSkill.innerText = "Add Skill";
        addSkill.onclick = () => {
            projects[i].skills.push("");
            renderProjects();
        };
        entry.appendChild(addSkill);

        const delBtn = document.createElement('button');
        delBtn.className = 'button color-delete';
        delBtn.innerText = "Delete Project";
        delBtn.onclick = () => {
            if (confirm("Are you sure you want to delete this project?")) {
                projects.splice(i, 1);
                renderProjects();
            }
        };
        entry.appendChild(delBtn);

        projFrag.appendChild(entry);
    }

    projList.replaceChildren(projFrag);
}


var projects;
window.onload = () => {
    const projList = document.getElementById("projectList");
    const addProjectBtn = document.getElementById("addProjectButton");
    const saveBtn = document.getElementById("saveProjectsButton");


    fetch("./api/projects")
        .then(resp=>resp.json())
        .then((data)=>{
            console.log(data);
            projects = data;         
            renderProjects();
            addProjectBtn.onclick = (e) => {
                projects.push({"title":"", "desc":"", "link":"", skills:[]});
                renderProjects();
            }

            saveBtn.onclick = () => {
                fetch("./api/set-projects", 
                    {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({"projects":projects}),
                    }
                ).then(resp => resp.json())
                 .then(data => console.log(data));
            }
        });
}
