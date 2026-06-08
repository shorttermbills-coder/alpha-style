document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

const app = document.getElementById("app");

let currentImages = [];
let currentIndex = 0;

const brandOrder = [
    "Adidas",
    "Nike",
    "Asics",
    "New Balance",
    "On Cloud",
    "ON Cloud",
    "Puma",
    "Kids",
    "Hoka",
    "Brooks",
    "Vans",
    "Bape STA",
    "Converse",
    "Uggs",
    "Crocs"
];

const modelOrder = {
    "Adidas": [
        "Samba",
        "Samba Jane",
        "Adizero",
        "Campus",
        "Spezial",
        "Japan",
        "SL 72 RS"
    ],

    "Nike": [
        "Vomero",
        "V2K",
        "RNR",
        "P-6000",
        "Initiator",
        "Dunk",
        "Jordan 1 low",
        "Jordan 1 high",
        "Jordan 4",
        "Air max",
        "M2K",
        "Kobe",
        "LDWaffle",
        "Blazer",
        "Uptempo",
        "Others"
    ],

    "New Balance": [
        "NB 740",
        "NB 530",
        "NB 327",
        "NB 9060",
        "NB 550",
        "Miu Miu",
        "Others"
    ],

    "Asics": [
        "Kayano 14",
        "NYC",
        "Running Shoes",
        "Asics Sabot",
        "Ballet TGR",
        "Contend"
    ]
};

function sortedModelsForBrand(brand, models){
    const order = modelOrder[brand];

    if(!order){
        return models;
    }

    return models.sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);

        if(ia === -1 && ib === -1) return 0;
        if(ia === -1) return 1;
        if(ib === -1) return -1;

        return ia - ib;
    });
}

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
        renderSecondLevel(data, parts[0], parts[1]);
        return;
    }

    if(parts.length === 3){
        renderCategoryModel(data, parts[0], parts[1], parts[2]);
        return;
    }

    app.innerHTML = "<h1>Not Found</h1>";
});

function brandRank(name){
    const exactIndex = brandOrder.indexOf(name);

    if(exactIndex !== -1){
        return exactIndex;
    }

    const lowerIndex = brandOrder
        .map(x => x.toLowerCase())
        .indexOf(name.toLowerCase());

    return lowerIndex;
}

function sortedBrands(data){
    return Object.keys(data).sort((a,b) => {

        const ia = brandRank(a);
        const ib = brandRank(b);

        if(ia === -1 && ib === -1) return a.localeCompare(b);
        if(ia === -1) return 1;
        if(ib === -1) return -1;

        return ia - ib;
    });
}

function renderBrands(data){

    let html = `
    <h1>Brands</h1>
    <div class="grid">
    `;

    sortedBrands(data).forEach(brand => {

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
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    let html = `
    <a href="/" class="back-btn">← Brands</a>

    <h1>${brand}</h1>

    <div class="grid">
    `;

    sortedModelsForBrand(brand, Object.keys(data[brand].models)).forEach(model => {

        const modelData = data[brand].models[model];

        html += `
        <a href="/${brandSlug}/${modelData.slug}" class="card">
            <img src="${modelData.cover}" loading="lazy">

            <div class="card-body">
                <div class="card-title">${model}</div>
            </div>
        </a>
        `;

    });

    html += "</div>";

    app.innerHTML = html;
}

function renderSecondLevel(data, brandSlug, modelSlug){

    const brand = Object.keys(data)
        .find(b => data[b].slug === brandSlug);

    if(!brand){
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    const model = Object.keys(data[brand].models)
        .find(m => data[brand].models[m].slug === modelSlug);

    if(!model){
        app.innerHTML = "<h1>Folder Not Found</h1>";
        return;
    }

    const modelData = data[brand].models[model];

    if(modelData.type === "category"){
        renderCategory(data, brand, brandSlug, model, modelSlug);
        return;
    }

    renderGallery(model, `/${brandSlug}`, modelData.images);
}

function renderCategory(data, brand, brandSlug, category, categorySlug){

    const categoryData = data[brand].models[category];

    let html = `
    <a href="/${brandSlug}" class="back-btn">← ${brand}</a>

    <h1>${category}</h1>

    <div class="grid">
    `;

    Object.keys(categoryData.models).forEach(model => {

        const modelData = categoryData.models[model];

        html += `
        <a href="/${brandSlug}/${categorySlug}/${modelData.slug}" class="card">
            <img src="${modelData.cover}" loading="lazy">

            <div class="card-body">
                <div class="card-title">${model}</div>
            </div>
        </a>
        `;

    });

    html += "</div>";

    app.innerHTML = html;
}

function renderCategoryModel(data, brandSlug, categorySlug, modelSlug){

    const brand = Object.keys(data)
        .find(b => data[b].slug === brandSlug);

    if(!brand){
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    const category = Object.keys(data[brand].models)
        .find(c => data[brand].models[c].slug === categorySlug);

    if(!category){
        app.innerHTML = "<h1>Category Not Found</h1>";
        return;
    }

    const categoryData = data[brand].models[category];

    if(categoryData.type !== "category"){
        app.innerHTML = "<h1>Not Found</h1>";
        return;
    }

    const model = Object.keys(categoryData.models)
        .find(m => categoryData.models[m].slug === modelSlug);

    if(!model){
        app.innerHTML = "<h1>Model Not Found</h1>";
        return;
    }

    renderGallery(
        model,
        `/${brandSlug}/${categorySlug}`,
        categoryData.models[model].images
    );
}

function renderGallery(title, backLink, images){

    let html = `
    <a href="${backLink}" class="back-btn">← Back</a>

    <h1>${title}</h1>

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
