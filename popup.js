// saves to local storage
function saveCourses() {
    localStorage.setItem("myCourseData", JSON.stringify(state.courses));
}

// loads local storage data
function loadCourses() {
    const savedData = localStorage.getItem("myCourseData");
    
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.error("Failed to parse local storage:", e);
            // fallback to sample data on error
            return coursesA; 
        }
    }
    // fallback to sample data if nothing is saved
    return coursesA; 
}

// initial course data
let coursesA = [
    {
    id: "1",
    name: "COMI 2010",
    credits: 3,
    categories: [
        {
        id: "2",
        name: "Assignments",
        weight: 30,
        collapsed: false,
        items: [
            {
                id: "3",
                name: "A1",
                earned: 87,
                possible: 100,
            },
        ],
        },
    ],
    }, 
    {
    id: "2",
    name: "COMM 1010",
    credits: 2,
    categories: [
        {
        id: "22",
        name: "Presentations",
        weight: 20,
        collapsed: false,
        items: [
            {
                id: "23",
                name: "p1",
                earned: 80,
                possible: 100,
            },
        ],
        },
    ],
    },
];

// initial state uses local storage
let state = {
    courses: loadCourses(),
    activeCourseId: null,
    message: "",
};

document.addEventListener("DOMContentLoaded", () => {
    render();
});

// main render function
function render() {
    // select the root container 
    const appContainer = document.getElementById("app");
    
    // clear the current content
    appContainer.innerHTML = "";

    // decide which screen to show based on state
    if (state.activeCourseId === null) {
        // show home screen
        renderHome(appContainer);
    } else {
        // show course detail screen
        renderCourseDetail(appContainer);
    }
}

// grade classes for custom colors
function getGradeStatusClass(grade) {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return "grade-none";
    if (numericGrade >= 90) return "grade-excellent";
    if (numericGrade >= 70) return "grade-pass";
    return "grade-fail";
}

// render home function
function renderHome(container) {

    // title
    const h1 = document.createElement("h1");
    h1.textContent = "My Courses";
    container.appendChild(h1);

    // add course form
    const formSection = document.createElement("section");
    formSection.classList.add("form-container");
    
    formSection.innerHTML = `
        <h2>Add New Course</h2>
        <form id="createCourseForm">
            <label for="courseName">Course Name:</label>
            <input type="text" id="courseName" placeholder="e.g. CS101" required>

            <label for="courseCredits">Credits:</label>
            <input type="number" id="courseCredits" placeholder="1" min="1" required>

            <button type="submit" id="submitCourseBtn">Create Course</button>
        </form>
        <div id="formMessage" class="message-area"></div>
    `;
    
    container.appendChild(formSection);

    // attach the handler to the form submit event
    const form = formSection.querySelector("#createCourseForm");
    form.addEventListener("submit", CreateCourse);


    // GPA display
    const gpaDisplay = document.createElement("div"); 
    gpaDisplay.classList.add("gpa-card");

    let score = calculateGPA(); 
    score
    gpaDisplay.innerHTML = `
        <span class="gpa-label">GPA</span>
        <span class="gpa-value">${score}</span>
    `;

    container.appendChild(gpaDisplay);

    // list of Courses
    const list = document.createElement("div");
    state.courses.forEach((course, index) => {
        const courseCard = document.createElement("div");
        courseCard.classList.add("form-container");

        const grade = calculateCourseGrade(course);
        const statusClass = getGradeStatusClass(grade);
        
        courseCard.classList.add("form-container", "course-card", statusClass);

        courseCard.innerHTML = `
            <div>
                <strong>${course.name}</strong> (${course.credits} Credits)<br>
                <span>Current Grade: ${grade}%</span>
            </div>
            <div>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // open course card
        courseCard.onclick = () => {
            state.activeCourseId = course.id;
            render();
        };

        // delete course
        const deleteBtn = courseCard.querySelector(".delete-btn");
        deleteBtn.onclick = (event) => {
            
            event.stopPropagation(); 

            // ask for confirmation
            if (!confirm("All the course data will be deleted, are you sure?")) return;

            // deletes selected course
            state.courses.splice(index, 1);
            saveCourses();
            render();
        };

        list.appendChild(courseCard);
    });
    container.appendChild(list);

    // export Button
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export to JSON";

    exportBtn.onclick = () => {
        exportData();
    };

    container.appendChild(exportBtn);

    // import json section
    const importSection = document.createElement("div");
    importSection.style.marginTop = "1em";

    importSection.innerHTML = `
        <button id="importBtn">Import JSON</button>
        <input type="file" id="fileInput" accept=".json" style="display: none;">
    `;

    const importBtn = importSection.querySelector("#importBtn");
    const fileInput = importSection.querySelector("#fileInput");

    // when button is clicked, trigger the hidden file input
    importBtn.onclick = () => fileInput.click();

    // handle the file selection
    fileInput.onchange = (e) => handleImport(e);

    container.appendChild(importSection);
}

// function to import json
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    
    const reader = new FileReader();
    // read file using filereader
    reader.onload = (e) => {
        try {
            // parse json
            const importedData = JSON.parse(e.target.result);

            // validation course properties
            if (!Array.isArray(importedData)) {
                throw new Error("Invalid format: Data must be a list of courses.");
            }

            // structure check for the first item
            if (importedData.length > 0) {
                const first = importedData[0];
                if (!first.name || !first.id || !Array.isArray(first.categories)) {
                    throw new Error("Invalid course structure detected.");
                }
            }

            // update state and replace data
            state.courses = importedData;
            saveCourses();
            state.message = "Data imported successfully!";
            // render interface
            render();

        } catch (err) {
            // error invalid JSON or bad structure
            alert("Failed to import: " + err.message);
        }
    };

    reader.readAsText(file);
}

// create course function
function CreateCourse(event) {
        // stop default submission 
        event.preventDefault();
        
        // read input values
        const nameInput = document.getElementById("courseName");
        const creditsInput = document.getElementById("courseCredits");
        const messageArea = document.getElementById("formMessage");
        messageArea.textContent = "";
        const name = nameInput.value.trim();
        const credits = parseInt(creditsInput.value);

        // validate values
        let errors = [];

        if (!name) 
            errors.push("Empty course name");
        if (isNaN(credits)) 
            errors.push("Invalid credits");
        else if (credits <= 0) 
            errors.push("Credits must be greater than 0");
        else if (credits > 5) 
            errors.push("Credits must be lower than 5");

        if (errors.length > 0) {
            messageArea.textContent = "Please review: " + errors.join(", ") + ".";
            return;
        }

        // create a course object
        const newCourse = {
            // generates a unique id 
            id: crypto.randomUUID(), 
            name: name,
            credits: credits,
            // starts empty
            categories: [] 
        };

        // add object to the array
        state.courses.push(newCourse);
        saveCourses();
        // show success message 
        state.message = `Successfully added ${name}!`;

        // re-render the interface
        render();
    }

// export json function
function exportData() {
    // convert course data to JSON string
    const jsonString = JSON.stringify(state.courses, null, 2); 

    // create a Blob 
    const blob = new Blob([jsonString], { type: "application/json" });

    // create a temporary download URL
    const url = URL.createObjectURL(blob);

    // create a temporary anchor and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = "chronoroom_data.json";
    
    // append to body
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // clean up the temporary URL to free up memory
    URL.revokeObjectURL(url);
}


// calculates weighted average for a course  
function calculateCategoryPercent(category) {
    if (!category.items || category.items.length === 0) {
    // no items = no score
        return null; 
    }

    const totalEarned = category.items.reduce((sum, item) => sum + item.earned, 0);
    const totalPossible = category.items.reduce((sum, item) => sum + item.possible, 0);

    // prevent division by zero
    if (totalPossible === 0) return 0;
    // returns decimal (0.87 for 87%)
    return (totalEarned / totalPossible); 
}


function calculateCourseGrade(course) {
    if (!course.categories || course.categories.length === 0) return "N/A";

    let totalWeightedScore = 0;
    let totalWeightUsed = 0;

    course.categories.forEach(cat => {
        const catPercent = calculateCategoryPercent(cat);

        // only add to the total if the category actually has items
        if (catPercent !== null) {
            totalWeightedScore += (catPercent * cat.weight);
            totalWeightUsed += cat.weight;
        }
    });

    // if no categories have items yet, return "N/A" or "0.00"
    if (totalWeightUsed === 0) return "0.00";

    return ((totalWeightedScore / totalWeightUsed) * 100).toFixed(2);
}

// main course section
function renderCourseDetail(container) {
    const course = state.courses.find(c => c.id === state.activeCourseId);
    if (!course) return;

    // back Button
    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to Courses";
    backBtn.onclick = () => {
        state.activeCourseId = null;
        render();
    };
    container.appendChild(backBtn);

    // course title and credit card
    const courseCard = document.createElement("div");

    // calculate sum of weight
    const existingTotal = course.categories.reduce((sum, cat) => sum + cat.weight, 0);

    courseCard.innerHTML = `
        <div class="card-content">
            <h2 class="course-name">${course.name}</h2>
            
                <span><strong>${course.credits}</strong> Credits</span>
                <span><strong>${existingTotal}%</strong> Weight</span>
            
        </div>
    `;
    container.appendChild(courseCard);

    // form to add category
    const formSectionCategory = document.createElement("section");
    formSectionCategory.innerHTML = `
       
        <form id="createCatForm">
            <h2>Add New Category</h2>
            <label for="categoryName">Category Name</label>
            <input type="text" id="categoryName" placeholder="Category Name">

            <label for="categoryWeight">Category weight</label>
            <input type="number" id="categoryWeight" placeholder="Weight %" min="1" >
            <button type="submit" id="submitCatBtn">Add Category</button>
            <div id="formMessageCat" class="message-area"></div>
        </form>
    `;

   
    container.appendChild(formSectionCategory);
    formSectionCategory.querySelector("#createCatForm").onsubmit = (e) => CreateCategory(e, course.id);

    // show categories
    course.categories.forEach(cat => {
        const catSection = document.createElement("section");
        catSection.classList.add("category-card"); 

        const catPercent = calculateCategoryPercent(cat);
        

        // calculate category average
        const avg = catPercent !== null ? (catPercent * 100).toFixed(2) : "0.00";

        // header
        const header = document.createElement("div");
        header.classList.add("header-container");

        header.innerHTML = `
            <div class="header-info">
                
                <h2 class="cat-name"><strong>${cat.name}</strong></h2>
                <span class="cat-weight">${cat.weight}% Weight</span>
                <span class="cat-avg">${avg}% Grade</span>
                <button class="toggle-btn">${cat.collapsed ?  '▼':'▶'}</button>
            </div>
        `;

        const delBtn = document.createElement("button");

        // text and click for btn
        delBtn.textContent = "Delete";
        delBtn.classList.add("delete-btn"); 
        delBtn.onclick = () => deleteCategory(course.id, cat.id);
        header.appendChild(delBtn);
        
        // changes collapse state
        header.querySelector(".toggle-btn").onclick = () => {
            cat.collapsed = !cat.collapsed;
            render();
        };

        catSection.appendChild(header);

        // collapse  
        if (cat.collapsed && cat.items.length >0) {
            const table = document.createElement("table");

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Item</th><th>Score</th><th>Possible</th><th>Percent</th><th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    ${cat.items.map(item => {
                        // calculate individual item percentage
                        const score = parseFloat(item.earned) || 0;
                        const possible = parseFloat(item.possible) || 0;
                        const itemPercent = possible > 0 ? ((score / possible) * 100).toFixed(2) : "0.00";

                        return `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.earned}</td>
                                <td>${item.possible}</td>
                                <td>${itemPercent}</td> 
                                <td>
                                    <button class="delete-item-btn" 
                                            data-course-id="${course.id}" 
                                            data-cat-id="${cat.id}" 
                                            data-item-id="${item.id}" 
                                            >×</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;

            table.querySelectorAll(".delete-item-btn").forEach(btn => {
                btn.onclick = () => {
                    const { courseId, catId, itemId } = btn.dataset;
                    deleteItem(courseId, catId, itemId);
                };
            });
            catSection.appendChild(table);

        
        }
        // add item form
            const addItemForm = document.createElement("form");
            addItemForm.innerHTML = `
                <h2>Add Item</h2>
                <label for="itemName">Item Name</label><br>
                <input type="text" id="itemName" placeholder="Item Name" required><br>
                <label for="earnedPoints">Earned points</label>
                <input type="number" id="earnedPoints" placeholder="Earned" min="0" required><br>
                
                <label for="possiblePoints">Possible Points</label>
                <input type="number" id="possiblePoints" placeholder="Possible" min="1" required> 
                <button type="submit" id="addItem">Add Item</button>
                <div id="formMessageItem" class="message-area"></div>
            `;
            addItemForm.onsubmit = (e) => addItem(e, course.id, cat.id);
            catSection.appendChild(addItemForm);
        container.appendChild(catSection);
    }); 
} 

// create category form
function CreateCategory(event, courseId) {

    event.preventDefault();

    // find the course
    const course = state.courses.find(c => c.id === courseId);
    const messageArea = document.getElementById("formMessageCat");
    // clear messages
    messageArea.textContent = "";
    // read input values
    const nameInput = document.getElementById("categoryName");
    const weightInput = document.getElementById("categoryWeight");

    const name = nameInput.value.trim();
    const weight = parseInt(weightInput.value);

    // validate values
    let errors = [];
    if (!name) errors.push("Empty category name");

    if (isNaN(weight)) errors.push("invalid weight");
    else if (weight <= 0) 
        errors.push("weight must be greater than 0");
    else if (weight > 100) 
        errors.push("weight maximum allowed is 100");

    const existingTotal = course.categories.reduce((sum, cat) => sum + cat.weight, 0);

    // Check if adding the new weight exceeds 100
    if (existingTotal + weight > 100) {
        const remaining = 100 - existingTotal;
        errors.push(`Total weight cannot exceed 100%. You have ${remaining}% remaining.`);
    }

    if (errors.length > 0) {
        messageArea.textContent = "Please review: " + errors.join(", ") + ".";
        return;
    }

    

    // prevent duplicate category names in the SAME course
    const isDuplicate = course.categories.some(cat => 
        cat.name.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
        messageArea.textContent = `Error: "${name}" already exists in this course.`;
        return;
    }

    // create the category object
    const newCategory = {
        id: crypto.randomUUID(),
        name: name,
        weight: weight,
        items: [] // Array of items as requested
    };

    // add it to that course
    course.categories.push(newCategory);
    saveCourses();

    // re-render the interface
    render();
}

// delete category
function deleteCategory(courseId, categoryId) {
    // confirm with the user before deleting
    if (!confirm("Are you sure you want to delete this category?")) {
        return;
    }

    // find the specific course
    const course = state.courses.find(c => c.id === courseId);

    if (course) {
        // filter out the category that matches the ID
        course.categories = course.categories.filter(cat => cat.id !== categoryId);
        saveCourses();
        // success message to the state
        state.message = "Category deleted successfully.";

        // re-render the interface to show the changes
        render();
    }
}

// add item form content
function addItem(event, courseId, catId) {
    event.preventDefault();
    
    // get inputs from the specific form that triggered the event
    const inputs = event.target.querySelectorAll("input");
    const name = inputs[0].value.trim();
    const earned = parseFloat(inputs[1].value);
    const possible = parseFloat(inputs[2].value);

    const messageAreaItem = document.getElementById("formMessageItem");
    messageAreaItem.textContent = "";

    
    // validation
    let errors = [];
    if (!name) errors.push("Empty item name");

    if (isNaN(earned)) errors.push("invalid points earned");
    else if (earned < 0) 
        errors.push("Earned must be 0 or greater");

    if (isNaN(possible)) {
        errors.push("numerical possible points");
    } else if (possible < 1) {
        errors.push("possible points must be 1 or greater");
    } else if (!Number.isInteger(possible)) {
        errors.push("possible points should be a whole number");
    }

    // return error message
    if (errors.length > 0) {
        messageAreaItem.textContent = "Please review: " + errors.join(", ") + ".";
        return;
    }


    const course = state.courses.find(c => c.id === courseId);
    const category = course.categories.find(cat => cat.id === catId);

    // create item in category
    category.items.push({
        id: crypto.randomUUID(),
        name: name,
        earned: earned,
        possible: possible
    });
    saveCourses();

    render();
}

// deletes a specific item from a category 
function deleteItem(courseId, catId, itemId) {
    if (!confirm("Delete this assignment?")) return;

    // find the course
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    // find the category within that course
    const category = course.categories.find(cat => cat.id === catId);
    if (!category) return;

    // filter the items array to remove the specific item ID
    category.items = category.items.filter(item => item.id !== itemId);

    saveCourses();
    // update message and re-render
    state.message = "Item deleted.";
    render();
}

/**
 Converts a numeric grade (0-100) to GPA points.
 Standard 4.0 Scale:
 90-100: 4.0 (A)
 80-89:  3.0 (B)
 70-79:  2.0 (C)
 60-69:  1.0 (D)
 Below 60: 0.0 (F)
*/

function gradeToGpa(grade) {
    if (grade >= 90) return 4.0;
    if (grade >= 80) return 3.0;
    if (grade >= 70) return 2.0;
    if (grade >= 60) return 1.0;
    return 0.0;
}

function calculateGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    state.courses.forEach(course => {
        // check if the course has graded items
        const hasItems = course.categories.some(cat => cat.items && cat.items.length > 0);
        // if there are no items, skip this course for GPA calculation
        if (!hasItems) return;

        // calculate the actual numeric grade for this course first
        const gradeResult = calculateCourseGrade(course);
        
        // convert "N/A" or "0.00" string back to a number
        const numericGrade = parseFloat(gradeResult);
        const credits = parseFloat(course.credits);

        if (!isNaN(numericGrade) && !isNaN(credits) && credits > 0) {
            totalPoints += gradeToGpa(numericGrade) * credits;
            totalCredits += credits;
        }
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
}