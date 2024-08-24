
function createProjectTextElement(entry, elemName, project) {
    const textElem = document.createElement('input');
    textElem.className = "project-text";
    textElem.type = "text";
    textElem.value = project[elemName];
    textElem.onchange = (e) => {
        project[elemName] = e.target.value;
        console.log(projects); // DEBUG
    }
    entry.appendChild(textElem);
    
}

function createProjectSkill(skillList, skillIdx, project) {
    const skillContainer = document.createElement('li');
    const skill = document.createElement('input');
    skill.className = "project-text";
    skill.type = "text";
    skill.value = project.skills[skillIdx];
    skill.onchange = (e) => {
        project.skills[skillIdx] = e.target.value;
        console.log(projects); // DEBUG
    }
    skillContainer.appendChild(skill);
    const delSkill = document.createElement('button');
    delSkill.onclick = (e) => {
        if (confirm("Definitely delete this skill?")) {
            project.skills.splice(skillIdx, 1);
            renderProjects(); // Rerender projects
        }
    }
    delSkill.innerText = "Delete Skill";
    skillContainer.appendChild(delSkill);

    skillList.appendChild(skillContainer);
}


function renderProjects() {
    
    const projList = document.getElementById("projectList");

    const projFrag = document.createDocumentFragment();

    // Project has title, desc, link
    for (let i=0; i < projects.length; i++) {
        const entry = document.createElement('li');
        const title = createProjectTextElement(entry, "title", projects[i]);
        const desc = createProjectTextElement(entry, "desc", projects[i]);
        const link = createProjectTextElement(entry, "link", projects[i]);
        const skillList = document.createElement('ul');
        for (let j=0; j < projects[i].skills.length; j++) {
            createProjectSkill(skillList, j, projects[i]);
        }
        entry.appendChild(skillList);

        const addSkill = document.createElement('button');
        addSkill.innerText = "Add Skill"
        addSkill.onclick = (e) => {
            projects[i].skills.push("");
            renderProjects();
        }
        entry.appendChild(addSkill);



        // delete project button
        const delBtn = document.createElement('button');
        delBtn.innerText = "Delete Project"
        delBtn.onclick = (e) => {
            if(confirm("Are you sure you want to delete this project?")) {
                projects.splice(i, 1);
                renderProjects();
            }
        }
        entry.appendChild(delBtn)
        projFrag.appendChild(entry);
    }

    projList.replaceChildren(projFrag);
}

var projects;
window.onload = () => {
    const projList = document.getElementById("projectList");
    const addProjectBtn = document.getElementById("addProjectButton");
    const saveBtn = document.getElementById("saveProjectsButton");


    fetch("/api/projects")
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
                fetch("/api/set-projects", 
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
