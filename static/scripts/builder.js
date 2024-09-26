window.onload = function() {
    fetch("./api/projects")
        .then(resp => resp.json())
        .then(data => {
            const projectSidebarList = document.getElementById("projectSidebarList");
            projectSidebarList.innerHTML = '';  // Clear existing content
            
            const fragment = document.createDocumentFragment();

            data.forEach(project => {
                const listItem = document.createElement('li');
                listItem.className = "sidebar-list-item";
                listItem.setAttribute('draggable', 'true');
                listItem.dataset.projectTitle = project.title;

                listItem.addEventListener('dragstart', handleDragStart);
                listItem.addEventListener('dragover', handleDragOver);
                listItem.addEventListener('drop', handleDrop);

                const checkbox = document.createElement('input');
                checkbox.id = `checkbox-${project.title}`;
                checkbox.type = 'checkbox';
                checkbox.value = project.title;
                checkbox.onchange = handleProjectSelectionChange;

                const label = document.createElement('label');
                label.htmlFor = `checkbox-${project.title}`;
                label.innerHTML = project.title;
                
                listItem.appendChild(checkbox);
                listItem.appendChild(label);
                
                fragment.appendChild(listItem);
            });

            projectSidebarList.appendChild(fragment);
        });

    // Download button event listener
    document.getElementById("downloadResumeButton").addEventListener("click", handleDownloadResume);

    updateResumePreview();
};

function handleDownloadResume() {
    const selectedProjects = Array.from(document.querySelectorAll('#projectSidebarList input:checked'))
                                .map(checkbox => checkbox.value);
    
    const orderedProjects = Array.from(document.querySelectorAll('#projectSidebarList li'))
                                .map(li => li.dataset.projectTitle)
                                .filter(title => selectedProjects.includes(title));

    fetch("./download-resume", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_projects: orderedProjects })
    })
    .then(resp => resp.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        document.body.appendChild(a); // Append anchor to body
        a.click();
        a.remove(); // Remove anchor after downloading
        window.URL.revokeObjectURL(url); // Clean up
    })
    .catch(error => console.error("Error downloading resume:", error));
}

function handleProjectSelectionChange() {
    updateResumePreview();
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.projectTitle);
    e.dropEffect = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}


function handleDrop(e) {
    e.preventDefault();
    const draggedProjectTitle = e.dataTransfer.getData('text/plain');
    const projectSidebarList = document.getElementById("projectSidebarList");
    const draggedElement = projectSidebarList.querySelector(`li[data-project-title="${draggedProjectTitle}"]`);
    const dropTarget = e.target.closest('li');
    
    if (dropTarget) {
        // If the drop target is the last item in the list or if we're specifically dragging it below the target
        if (!dropTarget.nextSibling || e.clientY > dropTarget.getBoundingClientRect().bottom) {
            projectSidebarList.insertBefore(draggedElement, dropTarget.nextSibling);
        } else {
            projectSidebarList.insertBefore(draggedElement, dropTarget);
        }
    } else {
        // If no valid drop target (e.g., dragged to the end), append to the end
        projectSidebarList.appendChild(draggedElement);
    }

    updateResumePreview();
}


function updateResumePreview() {
    const selectedProjects = Array.from(document.querySelectorAll('#projectSidebarList input:checked'))
                                .map(checkbox => checkbox.value);
    
    const orderedProjects = Array.from(document.querySelectorAll('#projectSidebarList li'))
                                .map(li => li.dataset.projectTitle)
                                .filter(title => selectedProjects.includes(title));

    fetch("./api/filtered-resume", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_projects: orderedProjects })
    })
    .then(resp => resp.json())
    .then(data => {
        document.getElementById("resumePreviewContainer").innerHTML = data.resume_html;
    });
}

