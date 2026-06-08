document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

const app = document.getElementById("app");

let currentImages = [];
let currentIndex = 0;

fetch("/brands.json")
.then(r => r.json())
.then(data => {
    const path = decodeURIComponent(location.pathname.replace(/^\/|\/$/g, ""));

    if (path === "") {
        renderBrands(data);
        return;
    }

    const parts = path.split("/");

    if (parts.length === 1) {
        renderBrandItems(data, parts[0]);
        return;
    }

    if (parts.length === 2) {
        renderSecondLevel(data, parts[0], parts[1]);
        return;
    }

    if (parts.length === 3) {
        renderCategoryModel(data, parts[0], parts[1], parts[2]);
        return;
    }
});

const brandOrder = [
    "Adidas",
    "Nike",
    "Asics",
    "New Balance",
    "On Cloud",
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

function sortBrands(data) {
    return Object.keys(data).sort((a, b) => {
        const ia = brandOrder.indexOf(a);
        const ib = brandOrder.indexOf(b);

        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;

        return ia - ib;
    });
}

function renderBrands(data) {
    let html = `<h1>Brands</h1><div class="grid">`;

    sortBrands(data).forEach(brand => {
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

function renderBrandItems(data, brandSlug) {
    const brand = Object.keys(data).find(b => data[b].slug === brandSlug);

    if (!brand) {
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    let html = `
    <a href="/" class="back-btn">← Brands</a>
    <h1>${brand}</h1>
    <div class="grid">
    `;

    Object.keys(data[brand].items).forEach(item => {
        const itemData = data[brand].items[item];

        html += `
        <a href="/${brandSlug}/${itemData.slug}" class="card">
            <img src="${itemData.cover}" loading="lazy">
            <div class="card-body">
                <div class="card-title">${item}</div>
            </div>
        </a>
        `;
    });

    html += "</div>";
    app.innerHTML = html;
}

function renderSecondLevel(data, brandSlug, itemSlug) {
    const brand = Object.keys(data).find(b => data[b].slug === brandSlug);

    if (!brand) {
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    const item = Object.keys(data[brand].items)
        .find(i => data[brand].items[i].slug === itemSlug);

    if (!item) {
        app.innerHTML = "<h1>Folder Not Found</h1>";
        return;
    }

    const itemData = data[brand].items[item];

    if (itemData.type === "model") {
        renderGallery(brand, brandSlug, item, itemData.images);
        return;
    }

    if (itemData.type === "category") {
        let html = `
        <a href="/${brandSlug}" class="back-btn">← ${brand}</a>
        <h1>${item}</h1>
        <div class="grid">
        `;

        Object.keys(itemData.models).forEach(model => {
            const modelData = itemData.models[model];

            html += `
            <a href="/${brandSlug}/${itemSlug}/${modelData.slug}" class="card">
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
}

function renderCategoryModel(data, brandSlug, categorySlug, modelSlug) {
    const brand = Object.keys(data).find(b => data[b].slug === brandSlug);

    if (!brand) {
        app.innerHTML = "<h1>Brand Not Found</h1>";
        return;
    }

    const category = Object.keys(data[brand].items)
        .find(i => data[brand].items[i].slug === categorySlug);

    if (!category) {
        app.innerHTML = "<h1>Category Not Found</h1>";
        return;
    }

    const categoryData = data[brand].items[category];

    if (categoryData.type !== "category") {
        app.innerHTML = "<h1>Not Found</h1>";
        return;
    }

    const model = Object.keys(categoryData.models)
        .find(m => categoryData.models[m].slug === modelSlug);

    if (!model) {
        app.innerHTML = "<h1>Model Not Found</h1>";
        return;
    }

    renderGallery(
        model,
        `/${brandSlug}/${categorySlug}`,
        model,
        categoryData.models[model].images
    );
}

function renderGallery(title, backLink, heading, images) {
    let html = `
    <a href="${backLink}" class="back-btn">← Back</a>
    <h1>${heading}</h1>
    <div class="gallery">
    `;

    images.forEach((img, index) => {
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

function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");

    document.querySelectorAll(".gallery-img").forEach(img => {
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

        if (currentIndex < 0) {
            currentIndex = currentImages.length - 1;
        }

        openImage();
    };

    document.getElementById("nextBtn").onclick = () => {
        currentIndex++;

        if (currentIndex >= currentImages.length) {
            currentIndex = 0;
        }

        openImage();
    };

    document.addEventListener("keydown", e => {
        if (lightbox.style.display !== "flex") return;

        if (e.key === "ArrowLeft") {
            document.getElementById("prevBtn").click();
        }

        if (e.key === "ArrowRight") {
            document.getElementById("nextBtn").click();
        }

        if (e.key === "Escape") {
            lightbox.style.display = "none";
        }
    });

    lightbox.onclick = e => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    };

    function openImage() {
        lightbox.style.display = "flex";
        lightboxImg.src = currentImages[currentIndex];
    }
}
