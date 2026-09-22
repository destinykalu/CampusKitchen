let addRecipe = document.getElementById("addRecipebtn");
let openRecipeOverlay = document.getElementById("addRecipeModal");
let closeModal = document.getElementById("closeModalBtn");


addRecipe.addEventListener("click", function(){ 
        openRecipeOverlay.classList.add("show")

});

closeModal.addEventListener("click", function(){
    openRecipeOverlay.classList.remove("show") 
});


const itemInput = document.getElementById("groceryItem");
const addBtn = document.getElementById("addItemBtn");
const itemList = document.getElementById("ingredientList");

addBtn.addEventListener("click", function () {
    const itemText = itemInput.value.trim();

    if (itemText === "") {
        return;
    }

    const newListItem = document.createElement("li");
    newListItem.textContent = itemText;

    itemList.appendChild(newListItem);

    itemInput.value = "";
    itemInput.focus();
});

/* ==========================================================
   PASTE THIS AT THE VERY BOTTOM OF script.js
   Nothing above it needs to change. It reuses these variables
   from your existing code: addRecipe, openRecipeOverlay,
   itemInput, addBtn, itemList
   ========================================================== */

// ---------- Settings ----------
const STORAGE_KEY = "campusCookbookRecipes";
const SPOONACULAR_KEY = "e60e8afdd87b4a7195bf060d577c0e04";
const DEFAULT_IMAGE = "images/What'sForDinner.jpeg";

// ---------- Elements ----------
const recipeContainer = document.getElementById("recipeContainer");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect"); // first match = the search bar filter

const recipeForm = openRecipeOverlay.querySelector("form");
const recipeNameInput = openRecipeOverlay.querySelector(".modal-header input");
const modalTitle = openRecipeOverlay.querySelector(".modal-title");
const cookTimeInput = document.getElementById("cookTime");
const yieldsInput = document.getElementById("yeilds");
const categorySelect = openRecipeOverlay.querySelector("select"); // the select inside the modal
const instructionsInput = document.getElementById("instructions");

const uploadImageBox = document.getElementById("uploadImage");
const uploadLabel = uploadImageBox.querySelector("h4");
const imageInput = document.getElementById("imageInput");

const recipeUrlInput = document.getElementById("recipeUrl");
const importBtn = document.getElementById("importBtn");

const confirmModal = document.getElementById("confirmModal");
const cancelDeleteBtn = document.getElementById("cancelBtn");
const confirmDeleteBtn = document.getElementById("DeleteBtn");

// ---------- State ----------
let recipes = loadRecipes();
let currentImage = "";   // image chosen or imported in the modal
let editingId = null;    // null = adding a new recipe
let deleteId = null;     // recipe waiting on the delete confirmation

// ---------- Storage ----------
function loadRecipes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (err) {
        return [];
    }
}

function saveRecipes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        return true;
    } catch (err) {
        alert("Couldn't save: browser storage is full. Try a smaller image or delete a recipe.");
        return false;
    }
}

// ---------- Small helpers ----------
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function categoryLabel(value) {
    if (!value || value === "all") return "Uncategorized";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------- Ingredients (works with your existing Add Item list) ----------
function getIngredients() {
    const items = Array.from(itemList.children)
        .filter(li => !li.contains(itemInput))   // skip the <li> that holds the input box
        .map(li => li.textContent.trim())
        .filter(Boolean);

    const pending = itemInput.value.trim();      // typed but not added yet
    if (pending) items.push(pending);
    return items;
}

function setIngredients(items) {
    Array.from(itemList.children).forEach(li => {
        if (!li.contains(itemInput)) li.remove();
    });
    items.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        itemList.appendChild(li);
    });
    itemInput.value = "";
}

// Pressing Enter in the ingredient box would submit the whole form, so add the item instead
itemInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
    }
});

// ---------- Image upload ----------
// Shrinks the photo so it fits comfortably in browser storage
function resizeImage(file, maxSize = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff"; // keeps transparent PNGs from turning black
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

uploadImageBox.addEventListener("click", function () {
    imageInput.click();
});

imageInput.addEventListener("change", async function () {
    const file = imageInput.files[0];
    if (!file) return;
    try {
        currentImage = await resizeImage(file);
        uploadLabel.textContent = file.name;
    } catch (err) {
        alert("That image couldn't be read. Try a JPG or PNG.");
    }
});

// ---------- Modal reset / edit ----------
function resetModal() {
    editingId = null;
    currentImage = "";
    modalTitle.textContent = "New Recipe:";
    recipeNameInput.value = "";
    recipeUrlInput.value = "";
    cookTimeInput.value = "";
    yieldsInput.value = "";
    categorySelect.value = "all";
    instructionsInput.value = "";
    setIngredients([]);
    imageInput.value = "";
    uploadLabel.textContent = "Upload Image";
}

// Start every "Add" click with a blank form
addRecipe.addEventListener("click", resetModal);

function openEditor(id) {
    const r = recipes.find(item => item.id === id);
    if (!r) return;

    resetModal();
    editingId = id;
    modalTitle.textContent = "Edit Recipe:";
    recipeNameInput.value = r.name;
    recipeUrlInput.value = r.sourceUrl || "";
    cookTimeInput.value = r.cookTime || "";
    yieldsInput.value = r.yields || "";
    categorySelect.value = r.category || "all";
    instructionsInput.value = r.instructions || "";
    setIngredients(r.ingredients || []);
    currentImage = r.image || "";
    if (r.image) uploadLabel.textContent = "Image added (click to change)";

    openRecipeOverlay.classList.add("show");
}

// ---------- Save (new or edited) ----------
recipeForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // The name box sits outside the <form>, so check it here
    if (!recipeNameInput.reportValidity()) return;

    const recipe = {
        id: editingId || Date.now().toString(),
        name: recipeNameInput.value.trim(),
        ingredients: getIngredients(),
        cookTime: cookTimeInput.value.trim(),
        yields: yieldsInput.value.trim(),
        category: categorySelect.value,
        instructions: instructionsInput.value.trim(),
        image: currentImage,
        sourceUrl: recipeUrlInput.value.trim()
    };

    const previous = recipes.slice();
    if (editingId) {
        recipes = recipes.map(r => (r.id === editingId ? recipe : r));
    } else {
        recipes.unshift(recipe); // newest first
    }

    if (!saveRecipes()) {
        recipes = previous;
        return;
    }

    renderRecipes();
    openRecipeOverlay.classList.remove("show");
});

// ---------- Delete (uses your existing confirm modal) ----------
cancelDeleteBtn.addEventListener("click", function () {
    deleteId = null;
    confirmModal.classList.remove("show");
});

confirmDeleteBtn.addEventListener("click", function () {
    recipes = recipes.filter(r => r.id !== deleteId);
    saveRecipes();
    deleteId = null;
    confirmModal.classList.remove("show");
    renderRecipes();
});

// ---------- Recipe cards ----------
function createCard(r) {
    const card = el("div", "recipe-card");

        const img = el("img", "recipe-image");
    img.alt = r.name;
    img.referrerPolicy = "no-referrer";
    img.onerror = function () {
    img.onerror = null;          // stops a loop if the default fails too
    img.src = DEFAULT_IMAGE;
    };
    img.src = r.image || DEFAULT_IMAGE;
    card.appendChild(img);

    const content = el("div", "recipe-content");
    const header = el("div", "recipe-header");
    header.appendChild(el("h4", "recipe-title", r.name));

    const meta = el("div", "recipe-meta");
    const time = el("span", "recipe-time");
    time.appendChild(el("i", "fas fa-clock"));
    time.append(" " + (r.cookTime || "No time listed"));
    meta.appendChild(time);
    meta.appendChild(el("span", "recipe-category", categoryLabel(r.category)));
    header.appendChild(meta);
    content.appendChild(header);

    const actions = el("div", "recipe-actions");

    const editBtn = el("button", "add-item", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", function () {
        openEditor(r.id);
    });

    const deleteBtn = el("button", "add-item", "Delete");
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", function () {
        deleteId = r.id;
        confirmModal.classList.add("show");
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    content.appendChild(actions);

    card.appendChild(content);
    return card;
}

function renderRecipes() {
    const term = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;

    const visible = recipes.filter(r =>
        (filter === "all" || r.category === filter) &&
        r.name.toLowerCase().includes(term)
    );

    recipeContainer.innerHTML = "";
    visible.forEach(r => recipeContainer.appendChild(createCard(r)));

    // Hide "No Recipes" once there is at least one saved recipe
    emptyState.style.display = recipes.length ? "none" : "";
}

searchInput.addEventListener("input", renderRecipes);
filterSelect.addEventListener("change", renderRecipes);

// ---------- Import from a link (recipe scraper API) ----------
// Swap this one function if you use a different scraper API.
async function fetchRecipeFromUrl(url) {
    const endpoint = "https://api.spoonacular.com/recipes/extract?" +
        new URLSearchParams({ url: url, apiKey: SPOONACULAR_KEY });

    const response = await fetch(endpoint);
    if (!response.ok) {
    const details = await response.text();
    throw new Error("Status " + response.status + " - " + details);
}
    return response.json();
}

function extractInstructions(data) {
    const first = data.analyzedInstructions && data.analyzedInstructions[0];
    if (first && first.steps && first.steps.length) {
        return first.steps.map((s, i) => (i + 1) + ". " + s.step).join("\n");
    }
    // Fall back to the raw text and strip any HTML tags
    return (data.instructions || "").replace(/<[^>]*>/g, "").trim();
}

function guessCategory(dishTypes) {
    const types = (dishTypes || []).map(t => t.toLowerCase());
    const map = [
        ["breakfast", ["breakfast", "morning meal", "brunch"]],
        ["dessert", ["dessert"]],
        ["snacks", ["snack", "appetizer", "fingerfood"]],
        ["lunch", ["lunch"]],
        ["dinner", ["dinner", "main course", "main dish"]]
    ];
    for (const [category, words] of map) {
        if (types.some(t => words.includes(t))) return category;
    }
    return categorySelect.value; // no match: leave whatever is selected
}

importBtn.addEventListener("click", async function () {
    const url = recipeUrlInput.value.trim();
    if (!url) {
        recipeUrlInput.focus();
        return;
    }

    const originalText = importBtn.textContent;
    importBtn.disabled = true;
    importBtn.textContent = "Importing...";

    try {
        const data = await fetchRecipeFromUrl(url);

        recipeNameInput.value = data.title || "";
        if (data.readyInMinutes) cookTimeInput.value = data.readyInMinutes + " minutes";
        if (data.servings) yieldsInput.value = data.servings + (data.servings === 1 ? " serving" : " servings");
        setIngredients((data.extendedIngredients || []).map(i => i.original));
        instructionsInput.value = extractInstructions(data);
        categorySelect.value = guessCategory(data.dishTypes);

        // Keep an image the user already uploaded; otherwise use the site's photo
        // Replace an imported image, but never one the user uploaded (uploads start with "data:")
    if (!currentImage || currentImage.startsWith("http")) {
        currentImage = data.image || "";
        uploadLabel.textContent = data.image ? "Image imported" : "Upload Image";
    }
    } catch (err) {
    console.error("Recipe import error:", err);
    alert("Couldn't import that link: " + err.message);
    } finally {
        importBtn.disabled = false;
        importBtn.textContent = originalText;
    }
});

recipeUrlInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        importBtn.click();
    }
});

// ---------- First paint ----------
renderRecipes();


