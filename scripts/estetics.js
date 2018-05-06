function changeName(){

    var input = document.getElementById("changeValue").value;
    
    if (input != "") {
        if ( /[^A-Za-z\d]/.test(input)) {
            alert("Please enter only letter and numeric characters");
            return false;
        }
    }

    document.getElementById('name').innerHTML = input;
    localStorage['name'] = input;
}

function toggleSidebar(sidebarId, show){

    let sidebar = document.getElementById(sidebarId);
    let label = document.getElementById("toggle_"+sidebarId+"_label");
    let alignment = "left";

    if(window.getComputedStyle(label).right == "0px" 
        || window.getComputedStyle(label).right == "200px"){
        alignment = "right";
    }

    if(show === true){
        sidebar.classList.remove("fadeIn");
        sidebar.classList.add("fadeOut");
    }
    else if(show === false){
        sidebar.classList.add("fadeIn");
        sidebar.classList.remove("fadeOut");
    }
    
    if(sidebar.classList.contains("fadeIn")){
        sidebar.classList.remove("fadeIn");
        sidebar.classList.add("fadeOut");
        if(alignment == "right")
            label.style.right = "0px";
        else
            label.style.left = "0px";

    }
    else{
        sidebar.classList.remove("fadeOut");
        sidebar.classList.add("fadeIn");
        if(alignment == "right")
            label.style.right = "200px";
        else
            label.style.left = "200px";
    }
}