document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

const app = document.getElementById("app");

let currentImages = [];
let currentIndex = 0;

fetch("/brands.json")
.then(r => r.json())
.then(data => {

    const path = decodeURIComponent(
        location.pathname.replace(/^\/|\/$/g, "")
    );

    if(path === ""){
        renderBrands(data);
        return;
    }

    const parts = path.split("/");

    if(parts.length === 1){
        renderModels(data, parts[0]);
        return;
    }

    if(parts.length === 2){
        renderImages(data, parts[0], parts[1]);
    }

});

function renderBrands(data){

    let html = `
    <h1>Brands</h1>
    <div class="grid">
    `;

    Object.keys(data).forEach(brand => {

        html += `
        <a href="/${data[brand].slug}" class="card">
            <img src="${data[brand].cover}" loading="lazy">

            <div class="card-body">
                <div class="card-title">${brand}</div>
            </div>
        </a>
        `;

    });

    html += "</div>";
    app.innerHTML = html;
}

function renderModels(data, brandSlug){

    const brand = Object.keys(data)
        .find(b => data[b].slug === brandSlug);

    if(!brand){
        app.innerHTML = "<h1>Not Found</h1>";
        return;
    }

    let html = `
    <a href="/" class="back-btn">← Brands</a>
    <h1>${brand}</h1>
    <div class="grid">
    `;

    Object.keys(data[brand].models).forEach(model => {

        const modelData = data[brand].models[model];

        html += `
        <a href="/${brandSlug}/${modelData.slug}" class="card">
            <img src="${modelData.cover}" loading="lazy">

            <div class="card-body">
                <div class="card-title">${model}</div>
                <div class="card-count">
                    ${modelData.images.length} Photos
                </div>
            </div>
        </a>
        `;

    });

    html += "</div>";
    app.innerHTML = html;
}

function renderImages(data, brandSlug, modelSlug){

    const brand = Object.keys(data)
        .find(b => data[b].slug === brandSlug);

    if(!brand){
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    const model = Object.keys(data[brand].models)
        .find(m => data[brand].models[m].slug === modelSlug);

    if(!model){
        app.innerHTML = "<h1>Model Not Found</h1>";
        return;
    }

    const images = data[brand].models[model].images;

    let html = `
    <a href="/${brandSlug}" class="back-btn">← ${brand}</a>
    <h1>${model}</h1>
    <div class="gallery">
    `;

    images.forEach((img,index) => {
        html += `
        <img
            src="${img}"
            class="gallery-img"
            data-index="${index}"
            loading="lazy"
        >
        `;
    });

    html += "</div>";
    app.innerHTML = html;

    currentImages = images;
    initLightbox();
}

function initLightbox(){

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");

    document.querySelectorAll(".gallery-img")
        .forEach(img => {

            img.addEventListener("click", () => {
                currentIndex = Number(img.dataset.index);
                openImage();
            });

        });

    document.getElementById("closeBtn").onclick = () => {
        lightbox.style.display = "none";
    };

    document.getElementById("prevBtn").onclick = () => {
        currentIndex--;

        if(currentIndex < 0){
            currentIndex = currentImages.length - 1;
        }

        openImage();
    };

    document.getElementById("nextBtn").onclick = () => {
        currentIndex++;

        if(currentIndex >= currentImages.length){
            currentIndex = 0;
        }

        openImage();
    };

    document.addEventListener("keydown", e => {

        if(lightbox.style.display !== "flex"){
            return;
        }

        if(e.key === "ArrowLeft"){
            document.getElementById("prevBtn").click();
        }

        if(e.key === "ArrowRight"){
            document.getElementById("nextBtn").click();
        }

        if(e.key === "Escape"){
            lightbox.style.display = "none";
        }

    });

    lightbox.onclick = e => {
        if(e.target === lightbox){
            lightbox.style.display = "none";
        }
    };

    function openImage(){
        lightbox.style.display = "flex";
        lightboxImg.src = currentImages[currentIndex];
    }
}