const form = document.getElementById("studentForm");
const studentList = document.getElementById("studentList");
const emptyState = document.getElementById("emptyState");
const studentCount = document.getElementById("studentCount");
const message = document.getElementById("message");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");
const previewImage = document.getElementById("previewImage");
const skillInput = document.getElementById("skillInput");
const addSkillBtn = document.getElementById("addSkillBtn");
const skillList = document.getElementById("skillList");

let students = JSON.parse(localStorage.getItem("tejasvaStudents")) || [];
let customSkills = []; // skills added in the form for the student being registered
let messageTimer;

function clearMessage() {
  clearTimeout(messageTimer);
  message.textContent = "";
  message.className = "message";
}

function showMessage(text, type) {
  clearTimeout(messageTimer);
  message.textContent = text;
  message.className = `message ${type}`;
  // errors stay a little longer so they can be read
  messageTimer = setTimeout(clearMessage, type === "error" ? 4000 : 2500);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  }[char]));
}

function renderStudents() {
  studentList.innerHTML = "";
  emptyState.style.display = students.length ? "none" : "block";

  const count = students.length;
  studentCount.textContent = `${count} ${count === 1 ? "student" : "students"} registered`;

  students.forEach((student, index) => {
    const card = document.createElement("article");
    card.className = "student";

    const image = student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=eeebff&color=4537b7`;

    card.innerHTML = `
      <img class="avatar" src="${escapeHTML(image)}" alt="${escapeHTML(student.name)}"
           onerror="this.src='https://ui-avatars.com/api/?name=Student&background=eeebff&color=4537b7'">
      <div>
        <h3>${escapeHTML(student.name)}</h3>
        <p>${escapeHTML(student.email)}${student.gender ? " • " + escapeHTML(student.gender) : ""}</p>
        <div class="tags">
          ${(student.skills || []).length
            ? student.skills.map(skill => `<span class="tag">${escapeHTML(skill)}</span>`).join("")
            : `<span class="tag">No skills added</span>`}
        </div>
      </div>
      <button class="delete" type="button" aria-label="Delete student" onclick="removeStudent(${index})">×</button>
    `;

    studentList.appendChild(card);
  });
}

// Draw the skill chips currently added in the form
function renderSkillChips() {
  skillList.innerHTML = "";

  customSkills.forEach(skill => {
    const chip = document.createElement("span");
    chip.className = "skill-chip";

    const label = document.createElement("span");
    label.textContent = skill; // textContent keeps user text safe

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "skill-remove";
    removeBtn.setAttribute("aria-label", `Remove ${skill}`);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => removeSkill(skill));

    chip.append(label, removeBtn);
    skillList.appendChild(chip);
  });
}

function addSkill() {
  const skill = skillInput.value.trim().replace(/\s+/g, " ");

  if (!skill) {
    showMessage("Please type a skill before clicking Add Skill.", "error");
    skillInput.focus();
    return;
  }

  // same skill is not allowed twice (case-insensitive)
  const alreadyAdded = customSkills.some(item => item.toLowerCase() === skill.toLowerCase());
  if (alreadyAdded) {
    showMessage(`"${skill}" is already added.`, "error");
    skillInput.select();
    return;
  }

  customSkills.push(skill);
  skillInput.value = "";
  renderSkillChips();
  skillInput.focus();
}

function removeSkill(skill) {
  customSkills = customSkills.filter(item => item !== skill);
  renderSkillChips();
}

addSkillBtn.addEventListener("click", addSkill);

skillInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault(); // stop Enter from submitting the whole form
    addSkill();
  }
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) {
    photoPreview.hidden = true;
    previewImage.src = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    showMessage("Please choose an image file.", "error");
    photoInput.value = "";
    photoPreview.hidden = true;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    photoPreview.hidden = false;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(form);
  const name = data.get("name").trim();
  const email = data.get("email").trim();
  const website = data.get("website").trim();
  const gender = data.get("gender");
  const skills = [...customSkills];
  const photoFile = photoInput.files[0];

  if (name.length < 3) {
    showMessage("Please enter a name with at least 3 characters.", "error");
    return;
  }

  // Photo is mandatory: stop here so nothing is added or saved
  if (!photoFile) {
    showMessage("Student photo is required. Please upload a photo before registering.", "error");
    return;
  }

  const saveStudent = photo => {
    students.unshift({ name, email, website, photo, gender, skills });

    try {
      localStorage.setItem("tejasvaStudents", JSON.stringify(students));
    } catch (error) {
      // Browser storage is full (photos are large), so undo the add
      students.shift();
      showMessage("Could not save the student. Browser storage is full - try a smaller photo.", "error");
      return;
    }

    form.reset(); // also clears the photo preview and skills (see reset handler)
    renderStudents();
    showMessage("Student added successfully!", "success");
  };

  const reader = new FileReader();
  reader.onload = () => saveStudent(reader.result);
  reader.onerror = () => showMessage("Could not read the photo. Please choose it again.", "error");
  reader.readAsDataURL(photoFile);
});

// Runs for the Clear Form button and for form.reset() after a successful add
form.addEventListener("reset", () => {
  customSkills = [];
  renderSkillChips();
  skillInput.value = "";
  photoPreview.hidden = true;
  previewImage.src = "";
  clearMessage();
});

function removeStudent(index) {
  students.splice(index, 1);
  localStorage.setItem("tejasvaStudents", JSON.stringify(students));
  renderStudents();
}

renderStudents();
