"use strict";


/* =====================================================
   TEKNIVO - APP
===================================================== */

const config = window.TEKNIVO_CONFIG || {};

let db = null;

if (
    window.supabase &&
    config.SUPABASE_URL &&
    config.SUPABASE_PUBLISHABLE_KEY
) {
    db = window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY
    );
}


/* =====================================================
   KATEGORİLER
===================================================== */

const categories = [
    ["📱", "Telefon"],
    ["💻", "Laptop"],
    ["🖥️", "Masaüstü PC"],
    ["🎮", "Oyun Konsolu"],
    ["🎮", "Ekran Kartı"],
    ["⚙️", "İşlemci"],
    ["💾", "RAM / SSD"],
    ["🖥️", "Monitör"],
    ["⌨️", "Klavye / Mouse"],
    ["🎧", "Kulaklık"],
    ["📷", "Kamera"],
    ["⌚", "Akıllı Saat"],
    ["📱", "Tablet"],
    ["🔌", "Diğer"]
];


/* =====================================================
   DOM
===================================================== */

const grid =
    document.getElementById("listingGrid");

const count =
    document.getElementById("listingCount");

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const categoryFilter =
    document.getElementById("categoryFilter");

const cityFilter =
    document.getElementById("cityFilter");

const minPrice =
    document.getElementById("minPrice");

const maxPrice =
    document.getElementById("maxPrice");

const sortSelect =
    document.getElementById("sortSelect");

const applyFilters =
    document.getElementById("applyFilters");

const clearFilters =
    document.getElementById("clearFilters");

const mobileFilterBtn =
    document.getElementById("mobileFilterBtn");

const filters =
    document.getElementById("filters");


/* =====================================================
   ESCAPE
===================================================== */

function escapeHtml(value = "") {

    return String(value).replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
}


/* =====================================================
   PRICE
===================================================== */

function formatPrice(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "Fiyat yok";
    }

    return new Intl.NumberFormat(
        "tr-TR",
        {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0
        }
    ).format(number);
}


/* =====================================================
   DATE
===================================================== */

function formatDate(value) {

    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "tr-TR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);
}


/* =====================================================
   CATEGORY UI
===================================================== */

function renderCategories() {

    const element =
        document.getElementById("categories");

    if (!element) return;

    element.innerHTML =
        categories.map(item => {

            return `
                <button
                    class="category"
                    onclick="filterCategory('${escapeHtml(item[1])}')"
                    type="button"
                >
                    <span>${item[0]}</span>
                    ${escapeHtml(item[1])}
                </button>
            `;

        }).join("");
}


/* =====================================================
   IMAGE
===================================================== */

function getImage(item) {

    if (
        !item.listing_images ||
        !item.listing_images.length
    ) {
        return null;
    }

    const images =
        [...item.listing_images].sort(
            (a, b) =>
                (Number(a.sort_order) || 0) -
                (Number(b.sort_order) || 0)
        );

    return images[0]?.image_url || null;
}


/* =====================================================
   CARD
===================================================== */

function createCard(item) {

    const image = getImage(item);

    const imageHTML = image

        ? `
            <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(item.title)}"
                loading="lazy"
            >
        `

        : `
            <div class="no-image">
                <span class="no-image-icon">📦</span>
                Fotoğraf yok
            </div>
        `;


    const brandModel = [
        item.brand,
        item.model
    ]
        .filter(Boolean)
        .join(" · ");


    return `
        <article
            class="listing-card"
            onclick="openListing('${escapeHtml(item.id)}')"
        >

            <div class="listing-image">
                ${imageHTML}
            </div>

            <div class="listing-content">

                <div class="listing-category">
                    ${escapeHtml(item.category || "Teknoloji")}
                </div>

                <div class="listing-title">
                    ${escapeHtml(item.title || "İsimsiz ilan")}
                </div>

                ${
                    brandModel
                        ? `
                            <div class="listing-brand">
                                ${escapeHtml(brandModel)}
                            </div>
                        `
                        : ""
                }

                <div class="listing-price">
                    ${formatPrice(item.price)}
                </div>

                <div class="listing-info">

                    <span>
                        📍 ${escapeHtml(
                            item.city || "Konum yok"
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            item.condition || ""
                        )}
                    </span>

                </div>

            </div>

        </article>
    `;
}


/* =====================================================
   GET CONDITIONS
===================================================== */

function getConditions() {

    return [
        ...document.querySelectorAll(
            ".condition-filter:checked"
        )
    ].map(input => input.value);
}


/* =====================================================
   LOAD LISTINGS
===================================================== */

async function loadListings() {

    if (!grid) return;


    if (!db) {

        grid.innerHTML = `
            <div class="loading">

                <strong>
                    Supabase bağlantısı bulunamadı.
                </strong>

                <p>
                    js/config.js dosyanı kontrol et.
                </p>

            </div>
        `;

        return;
    }


    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            İlanlar yükleniyor...
        </div>
    `;


    const search =
        searchInput?.value.trim() || "";

    const category =
        categoryFilter?.value || "";

    const city =
        cityFilter?.value.trim() || "";

    const min =
        minPrice?.value || "";

    const max =
        maxPrice?.value || "";

    const conditions =
        getConditions();

    const sort =
        sortSelect?.value || "newest";


    let query =
        db
            .from("listings")
            .select(`
                id,
                title,
                category,
                brand,
                model,
                condition,
                price,
                city,
                views,
                created_at,
                listing_images (
                    image_url,
                    sort_order
                )
            `)
            .eq("status", "active");


    /* CATEGORY */

    if (category) {
        query = query.eq(
            "category",
            category
        );
    }


    /* CITY */

    if (city) {
        query = query.ilike(
            "city",
            `%${city}%`
        );
    }


    /* PRICE */

    if (min) {
        query = query.gte(
            "price",
            Number(min)
        );
    }

    if (max) {
        query = query.lte(
            "price",
            Number(max)
        );
    }


    /* CONDITION */

    if (conditions.length === 1) {

        query = query.eq(
            "condition",
            conditions[0]
        );

    } else if (conditions.length > 1) {

        query = query.in(
            "condition",
            conditions
        );

    }


    /* SEARCH */

    if (search) {

        const safe =
            search
                .replace(/,/g, " ")
                .replace(/[()]/g, " ")
                .trim();

        if (safe) {

            query = query.or(
                [
                    `title.ilike.%${safe}%`,
                    `brand.ilike.%${safe}%`,
                    `model.ilike.%${safe}%`,
                    `category.ilike.%${safe}%`,
                    `city.ilike.%${safe}%`
                ].join(",")
            );

        }

    }


    /* SORT */

    if (sort === "price-low") {

        query = query.order(
            "price",
            {
                ascending: true,
                nullsFirst: false
            }
        );

    } else if (sort === "price-high") {

        query = query.order(
            "price",
            {
                ascending: false,
                nullsFirst: false
            }
        );

    } else if (sort === "popular") {

        query = query.order(
            "views",
            {
                ascending: false,
                nullsFirst: false
            }
        );

    } else {

        query = query.order(
            "created_at",
            {
                ascending: false
            }
        );

    }


    query = query.limit(60);


    const {
        data,
        error
    } = await query;


    if (error) {

        console.error(
            "TEKNIVO Supabase:",
            error
        );

        grid.innerHTML = `
            <div class="loading">

                <strong>
                    İlanlar yüklenemedi.
                </strong>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        if (count) {
            count.textContent =
                "0 ilan bulundu";
        }

        grid.innerHTML = `
            <div class="loading">

                <div style="font-size:45px">
                    🔎
                </div>

                <strong>
                    İlan bulunamadı
                </strong>

                <p>
                    Filtrelerini veya arama kelimeni değiştirmeyi dene.
                </p>

            </div>
        `;

        return;
    }


    if (count) {

        count.textContent =
            `${data.length} ilan bulundu`;

    }


    grid.innerHTML =
        data.map(createCard).join("");
}


/* =====================================================
   CATEGORY
===================================================== */

function filterCategory(category) {

    if (categoryFilter) {
        categoryFilter.value =
            category;
    }

    document
        .querySelectorAll(".category")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    const buttons =
        document.querySelectorAll(
            ".category"
        );

    buttons.forEach(button => {

        if (
            button.textContent
                .trim()
                .includes(category)
        ) {
            button.classList.add(
                "active"
            );
        }

    });


    loadListings();

    window.scrollTo({
        top:
            document.querySelector(
                ".market"
            )?.offsetTop - 80 || 0,

        behavior: "smooth"
    });
}


/* =====================================================
   SEARCH
===================================================== */

function searchListings() {

    loadListings();

    window.scrollTo({
        top:
            document.querySelector(
                ".market"
            )?.offsetTop - 80 || 0,

        behavior: "smooth"
    });
}


/* =====================================================
   CLEAR
===================================================== */

function clearAllFilters() {

    if (searchInput)
        searchInput.value = "";

    if (categoryFilter)
        categoryFilter.value = "";

    if (cityFilter)
        cityFilter.value = "";

    if (minPrice)
        minPrice.value = "";

    if (maxPrice)
        maxPrice.value = "";

    document
        .querySelectorAll(
            ".condition-filter"
        )
        .forEach(input => {
            input.checked = false;
        });

    if (sortSelect)
        sortSelect.value = "newest";


    document
        .querySelectorAll(".category")
        .forEach(button => {
            button.classList.remove(
                "active"
            );
        });


    const first =
        document.querySelector(
            ".category"
        );

    if (first) {
        first.classList.add(
            "active"
        );
    }


    loadListings();
}


/* =====================================================
   DETAIL
===================================================== */

function openListing(id) {

    if (!id) return;

    window.location.href =
        `/ilan.html?id=${encodeURIComponent(id)}`;
}


/* =====================================================
   EVENTS
===================================================== */

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        searchListings
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {
                searchListings();
            }

        }
    );

}


if (applyFilters) {

    applyFilters.addEventListener(
        "click",
        () => {

            loadListings();

            if (filters) {
                filters.classList.remove(
                    "open"
                );
            }

        }
    );

}


if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        clearAllFilters
    );

}


if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        loadListings
    );

}


if (mobileFilterBtn) {

    mobileFilterBtn.addEventListener(
        "click",
        () => {

            filters?.classList.toggle(
                "open"
            );

        }
    );

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCategories();

        loadListings();

    }
);
