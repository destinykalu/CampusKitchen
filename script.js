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




