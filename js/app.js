"use strict";

/* =====================================================
   TEKNIVO - APP
   AL / SAT / KİRALA
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
    ["📽️", "Projeksiyon"],
    ["🎤", "Mikrofon"],
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

const listingTypeFilter =
    document.getElementById("listingTypeFilter");

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
        return "Fiyat belirtilmemiş";
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
   LISTING TYPE
===================================================== */

function getListingType(item) {

    return (
        item.listing_type ||
        item.type ||
        "sale"
    ).toLowerCase();
}

/* =====================================================
   TYPE BADGE
===================================================== */

function createTypeBadge(item) {

    const type =
        getListingType(item);

    if (type === "rent") {

        return `
            <span class="listing-type-badge rent">
                KİRALIK
            </span>
        `;

    }

    return `
        <span class="listing-type-badge sale">
            SATILIK
        </span>
    `;
}

/* =====================================================
   PRICE HTML
===================================================== */

function createPriceHTML(item) {

    const type =
        getListingType(item);

    if (type === "rent") {

        const daily =
            Number(item.daily_price);

        const weekly =
            Number(item.weekly_price);

        if (
            Number.isFinite(daily) &&
            daily > 0
        ) {

            return `
                <div class="listing-price">
                    ${formatPrice(daily)}
                </div>

                <div class="rental-price">
                    / gün
                    ${
                        Number.isFinite(weekly) &&
                        weekly > 0
                            ? ` · ${formatPrice(weekly)} / hafta`
                            : ""
                    }
                </div>
            `;

        }

        /*
         * Günlük fiyat girilmemişse
         * normal price alanını kullan.
         */

        if (
            Number.isFinite(Number(item.price)) &&
            Number(item.price) > 0
        ) {

            return `
                <div class="listing-price">
                    ${formatPrice(item.price)}
                </div>

                <div class="rental-price">
                    / gün
                </div>
            `;
        }

        return `
            <div class="listing-price">
                Fiyat sorunuz
            </div>
        `;
    }

    return `
        <div class="listing-price">
            ${formatPrice(item.price)}
        </div>
    `;
}

/* =====================================================
   CARD
===================================================== */

function createCard(item) {

    const image =
        getImage(item);

    const type =
        getListingType(item);

    const imageHTML = image
        ? `
            <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(item.title || "Teknoloji ürünü")}"
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

    const deposit =
        Number(item.deposit);

    const depositHTML =
        type === "rent" &&
        Number.isFinite(deposit) &&
        deposit > 0
            ? `
                <div
                    style="
                        font-size:12px;
                        color:#777;
                        margin-top:5px;
                    "
                >
                    Depozito: ${formatPrice(deposit)}
                </div>
            `
            : "";

    return `
        <article
            class="listing-card"
            data-type="${escapeHtml(type)}"
            onclick="openListing('${escapeHtml(item.id)}')"
        >

            <div class="listing-image">

                ${imageHTML}

            </div>

            <div class="listing-content">

                ${createTypeBadge(item)}

                <div class="listing-category">
                    ${escapeHtml(
                        item.category ||
                        "Teknoloji"
                    )}
                </div>

                <div class="listing-title">
                    ${escapeHtml(
                        item.title ||
                        "İsimsiz ilan"
                    )}
                </div>

                ${
                    brandModel
                        ? `
                            <div class="listing-brand">
                                ${escapeHtml(
                                    brandModel
                                )}
                            </div>
                        `
                        : ""
                }

                ${createPriceHTML(item)}

                ${depositHTML}

                <div class="listing-info">

                    <span>
                        📍 ${escapeHtml(
                            item.city ||
                            "Konum yok"
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            item.condition ||
                            ""
                        )}
                    </span>

                </div>

            </div>

        </article>
    `;
}

/* =====================================================
   CONDITIONS
===================================================== */

function getConditions() {

    return [
        ...document.querySelectorAll(
            ".condition-filter:checked"
        )
    ].map(
        input => input.value
    );
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
        sortSelect?.value ||
        "newest";

    const listingType =
        listingTypeFilter?.value || "";


    /* =================================================
       QUERY
    ================================================= */

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
                listing_type,
                daily_price,
                weekly_price,
                deposit,
                listing_images (
                    image_url,
                    sort_order
                )
            `)
            .eq(
                "status",
                "active"
            );


    /* =================================================
       SATILIK / KİRALIK
    ================================================= */

    if (
        listingType === "sale" ||
        listingType === "rent"
    ) {

        query =
            query.eq(
                "listing_type",
                listingType
            );
    }


    /* =================================================
       CATEGORY
    ================================================= */

    if (category) {

        query =
            query.eq(
                "category",
                category
            );
    }


    /* =================================================
       CITY
    ================================================= */

    if (city) {

        query =
            query.ilike(
                "city",
                `%${city}%`
            );
    }


    /* =================================================
       PRICE
    ================================================= */

    if (min) {

        query =
            query.gte(
                "price",
                Number(min)
            );
    }

    if (max) {

        query =
            query.lte(
                "price",
                Number(max)
            );
    }


    /* =================================================
       CONDITION
    ================================================= */

    if (
        conditions.length === 1
    ) {

        query =
            query.eq(
                "condition",
                conditions[0]
            );

    } else if (
        conditions.length > 1
    ) {

        query =
            query.in(
                "condition",
                conditions
            );
    }


    /* =================================================
       SEARCH
    ================================================= */

    if (search) {

        const safe =
            search
                .replace(/,/g, " ")
                .replace(/[()]/g, " ")
                .trim();

        if (safe) {

            query =
                query.or(
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


    /* =================================================
       SORT
    ================================================= */

    if (
        sort === "price-low"
    ) {

        query =
            query.order(
                "price",
                {
                    ascending: true,
                    nullsFirst: false
                }
            );

    } else if (
        sort === "price-high"
    ) {

        query =
            query.order(
                "price",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );

    } else if (
        sort === "popular"
    ) {

        query =
            query.order(
                "views",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );

    } else {

        query =
            query.order(
                "created_at",
                {
                    ascending: false
                }
            );
    }


    query =
        query.limit(60);


    /* =================================================
       EXECUTE
    ================================================= */

    const {
        data,
        error
    } = await query;


    /* =================================================
       ERROR
    ================================================= */

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
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>
        `;

        return;
    }


    /* =================================================
       EMPTY
    ================================================= */

    if (
        !data ||
        data.length === 0
    ) {

        if (count) {

            count.textContent =
                "0 ilan bulundu";
        }

        grid.innerHTML = `
            <div class="loading">

                <div
                    style="
                        font-size:45px;
                        margin-bottom:10px;
                    "
                >
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


    /* =================================================
       COUNT
    ================================================= */

    if (count) {

        count.textContent =
            `${data.length} ilan bulundu`;
    }


    /* =================================================
       RENDER
    ================================================= */

    grid.innerHTML =
        data
            .map(createCard)
            .join("");
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
        .querySelectorAll(
            ".category"
        )
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

    if (listingTypeFilter)
        listingTypeFilter.value = "";

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
        .querySelectorAll(
            ".category"
        )
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


    /* Üstteki Tümü / Satılık / Kiralık */

    document
        .querySelectorAll(
            ".trade-btn"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    const allTrade =
        document.querySelector(
            '.trade-btn[data-type="all"]'
        );

    if (allTrade) {

        allTrade.classList.add(
            "active"
        );
    }


    const rentalInfo =
        document.getElementById(
            "rentalInfo"
        );

    if (rentalInfo) {

        rentalInfo.style.display =
            "none";
    }


    const listingTitle =
        document.getElementById(
            "listingTitle"
        );

    if (listingTitle) {

        listingTitle.textContent =
            "Yeni İlanlar";
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


if (listingTypeFilter) {

    listingTypeFilter.addEventListener(
        "change",
        loadListings
    );
}

/* =====================================================
   ÜST SATILIK / KİRALIK BUTONLARI
===================================================== */

document
    .querySelectorAll(
        ".trade-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const type =
                    this.dataset.type;

                document
                    .querySelectorAll(
                        ".trade-btn"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });

                this.classList.add(
                    "active"
                );


                if (listingTypeFilter) {

                    listingTypeFilter.value =
                        type === "all"
                            ? ""
                            : type;

                }


                const rentalInfo =
                    document.getElementById(
                        "rentalInfo"
                    );

                const listingTitle =
                    document.getElementById(
                        "listingTitle"
                    );


                if (
                    type === "rent"
                ) {

                    if (rentalInfo) {

                        rentalInfo.style.display =
                            "block";
                    }

                    if (listingTitle) {

                        listingTitle.textContent =
                            "Kiralık İlanlar";
                    }

                } else if (
                    type === "sale"
                ) {

                    if (rentalInfo) {

                        rentalInfo.style.display =
                            "none";
                    }

                    if (listingTitle) {

                        listingTitle.textContent =
                            "Satılık İlanlar";
                    }

                } else {

                    if (rentalInfo) {

                        rentalInfo.style.display =
                            "none";
                    }

                    if (listingTitle) {

                        listingTitle.textContent =
                            "Yeni İlanlar";
                    }
                }


                loadListings();

            }
        );

    });

/* =====================================================
   URL TYPE
===================================================== */

function loadTypeFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const type =
        params.get("type");

    if (
        type !== "rent" &&
        type !== "sale"
    ) {
        return;
    }


    if (listingTypeFilter) {

        listingTypeFilter.value =
            type;
    }


    document
        .querySelectorAll(
            ".trade-btn"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.type ===
                type
            );

        });


    const listingTitle =
        document.getElementById(
            "listingTitle"
        );

    if (listingTitle) {

        listingTitle.textContent =
            type === "rent"
                ? "Kiralık İlanlar"
                : "Satılık İlanlar";
    }


    const rentalInfo =
        document.getElementById(
            "rentalInfo"
        );

    if (rentalInfo) {

        rentalInfo.style.display =
            type === "rent"
                ? "block"
                : "none";
    }
}

/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCategories();

        loadTypeFromURL();

        loadListings();

    }
);


/* =====================================================
   GLOBAL
===================================================== */

window.filterCategory =
    filterCategory;

window.openListing =
    openListing;

window.loadListings =
    loadListings;

window.searchListings =
    searchListings;

window.clearAllFilters =
    clearAllFilters;
