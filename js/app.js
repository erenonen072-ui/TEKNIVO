/* =========================================================
   TEKNIVO - MARKETPLACE APP
   ========================================================= */

const config = window.TEKNIVO_CONFIG;

let supabaseClient = null;

if (
    config &&
    config.SUPABASE_URL &&
    config.SUPABASE_PUBLISHABLE_KEY
) {
    supabaseClient = supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY
    );
}


/* =========================================================
   KATEGORİLER
   ========================================================= */

const categories = [
    ["📱", "Telefon"],
    ["💻", "Laptop"],
    ["🖥️", "Masaüstü PC"],
    ["🎮", "Oyun Konsolu"],
    ["🧠", "Ekran Kartı"],
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


function renderCategories() {

    const element =
        document.getElementById("categories");

    if (!element) return;

    element.innerHTML = `
        <button
            class="category active"
            data-category=""
        >
            <span class="category-icon">▦</span>
            <span class="category-name">Tümü</span>
        </button>

        ${
            categories.map(category => `
                <button
                    class="category"
                    data-category="${escapeHtml(category[1])}"
                >
                    <span class="category-icon">
                        ${category[0]}
                    </span>

                    <span class="category-name">
                        ${escapeHtml(category[1])}
                    </span>
                </button>
            `).join("")
        }
    `;

    document
        .querySelectorAll(".category")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".category")
                        .forEach(item =>
                            item.classList.remove("active")
                        );

                    button.classList.add("active");

                    loadListings(
                        button.dataset.category || ""
                    );

                }
            );

        });
}


/* =========================================================
   PARA
   ========================================================= */

function formatPrice(price) {

    if (price === null || price === undefined) {
        return "Fiyat belirtilmemiş";
    }

    return new Intl.NumberFormat(
        "tr-TR",
        {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0
        }
    ).format(price);

}


/* =========================================================
   HTML GÜVENLİĞİ
   ========================================================= */

function escapeHtml(value = "") {

    return String(value).replace(
        /[&<>"']/g,
        character => {

            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return map[character];

        }
    );

}


/* =========================================================
   TARİH
   ========================================================= */

function formatDate(date) {

    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        return "";
    }

    const now = new Date();

    const diff =
        Math.floor(
            (now - d) / 1000
        );

    if (diff < 60) {
        return "Az önce";
    }

    if (diff < 3600) {
        return `${Math.floor(diff / 60)} dk önce`;
    }

    if (diff < 86400) {
        return `${Math.floor(diff / 3600)} saat önce`;
    }

    if (diff < 604800) {
        return `${Math.floor(diff / 86400)} gün önce`;
    }

    return d.toLocaleDateString(
        "tr-TR",
        {
            day: "numeric",
            month: "short"
        }
    );

}


/* =========================================================
   İLANLARI GETİR
   ========================================================= */

async function loadListings(category = "") {

    const grid =
        document.getElementById("listingGrid");

    if (!grid) return;


    /* SUPABASE KONTROL */

    if (!supabaseClient) {

        grid.innerHTML = `
            <div class="loading">
                <strong>Supabase bağlantısı bulunamadı.</strong>
                <br><br>
                <small>
                    js/config.js dosyanı kontrol et.
                </small>
            </div>
        `;

        return;
    }


    /* LOADING */

    grid.innerHTML = `
        <div class="loading">
            İlanlar yükleniyor...
        </div>
    `;


    /* ARAMA */

    const searchElement =
        document.getElementById("searchInput");

    const search =
        searchElement
            ? searchElement.value.trim()
            : "";


    /* SORGULAMA */

    let query =
        supabaseClient
            .from("listings")
            .select(`
                id,
                title,
                category,
                brand,
                model,
                price,
                city,
                condition,
                created_at,
                views,
                listing_images (
                    image_url,
                    sort_order
                )
            `)
            .eq(
                "status",
                "active"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(40);


    /* KATEGORİ */

    if (category) {

        query =
            query.eq(
                "category",
                category
            );

    }


    /* ARAMA */

    if (search) {

        const safeSearch =
            search
                .replace(/,/g, "")
                .replace(/[()]/g, "");

        query =
            query.or(
                `title.ilike.%${safeSearch}%,brand.ilike.%${safeSearch}%,model.ilike.%${safeSearch}%`
            );

    }


    const {
        data,
        error
    } = await query;


    /* HATA */

    if (error) {

        console.error(
            "TEKNIVO Supabase:",
            error
        );

        grid.innerHTML = `
            <div class="loading">
                <strong>İlanlar yüklenemedi.</strong>
                <br><br>
                <small>
                    ${escapeHtml(error.message)}
                </small>
            </div>
        `;

        return;
    }


    /* İLAN YOK */

    if (!data || data.length === 0) {

        grid.innerHTML = `
            <div class="loading">
                <strong>Henüz ilan bulunamadı.</strong>

                <br><br>

                <a
                    href="/ilan-ver.html"
                    style="
                        color:#635bff;
                        font-weight:800;
                    "
                >
                    İlk ilanı sen ver →
                </a>
            </div>
        `;

        updateCount(0);

        return;
    }


    /* SAYI */

    updateCount(data.length);


    /* KARTLAR */

    grid.innerHTML =
        data
            .map(createListingCard)
            .join("");

}


/* =========================================================
   İLAN SAYISI
   ========================================================= */

function updateCount(count) {

    const element =
        document.getElementById(
            "listingCount"
        );

    if (!element) return;

    element.textContent =
        `${count} ilan`;

}


/* =========================================================
   RESİM
   ========================================================= */

function getListingImage(item) {

    if (
        !item.listing_images ||
        !item.listing_images.length
    ) {
        return null;
    }

    const sorted =
        [...item.listing_images]
            .sort(
                (a, b) =>
                    (a.sort_order || 0) -
                    (b.sort_order || 0)
            );

    return sorted[0]?.image_url || null;

}


/* =========================================================
   İLAN KARTI
   ========================================================= */

function createListingCard(item) {

    const image =
        getListingImage(item);


    const imageHTML =
        image

        ?

        `
            <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(item.title)}"
                loading="lazy"
            >
        `

        :

        `
            <div class="no-image">
                <span>📦</span>
                Fotoğraf yok
            </div>
        `;


    const brandModel =
        [
            item.brand,
            item.model
        ]
        .filter(Boolean)
        .join(" ");


    return `

        <article
            class="listing-card"
            data-category="${escapeHtml(
                item.category || ""
            )}"
            onclick="openListing('${escapeHtml(item.id)}')"
        >

            <div class="listing-image">

                ${imageHTML}

            </div>


            <div class="listing-content">

                <div class="listing-category">

                    ${escapeHtml(
                        item.category || "Teknoloji"
                    )}

                </div>


                <h3 class="listing-title">

                    ${escapeHtml(
                        item.title
                    )}

                </h3>


                ${
                    brandModel

                    ?

                    `
                    <div class="listing-model">
                        ${escapeHtml(
                            brandModel
                        )}
                    </div>
                    `

                    :

                    ""
                }


                <div class="listing-price">

                    ${formatPrice(
                        item.price
                    )}

                </div>


                <div class="listing-info">

                    <span>
                        📍
                        ${escapeHtml(
                            item.city ||
                            "Şehir belirtilmedi"
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            item.condition ||
                            ""
                        )}
                    </span>

                </div>


                <div class="listing-date">

                    ${formatDate(
                        item.created_at
                    )}

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   İLAN DETAYI
   ========================================================= */

function openListing(id) {

    if (!id) return;

    window.location.href =
        `/ilan.html?id=${encodeURIComponent(id)}`;

}


/* =========================================================
   ARAMA
   ========================================================= */

function searchListings() {

    loadListings();

}


/* =========================================================
   ENTER İLE ARAMA
   ========================================================= */

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );

    const button =
        document.getElementById(
            "searchBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            searchListings
        );

    }


    if (input) {

        input.addEventListener(
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

}


/* =========================================================
   BAŞLANGIÇ
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCategories();

        setupSearch();

        loadListings();

    }
);
