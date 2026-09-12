const config = window.TEKNIVO_CONFIG;

let supabaseClient = null;

if (
    config.SUPABASE_URL &&
    config.SUPABASE_PUBLISHABLE_KEY
) {

    supabaseClient =
        supabase.createClient(
            config.SUPABASE_URL,
            config.SUPABASE_PUBLISHABLE_KEY
        );
}


/* KATEGORİLER */

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


const categoriesElement =
    document.getElementById("categories");


categoriesElement.innerHTML =
    categories.map(category => {

        return `

        <div
            class="category"
            onclick="filterCategory('${escapeHtml(category[1])}')"
        >

            <span class="category-icon">
                ${category[0]}
            </span>

            <span class="category-name">
                ${category[1]}
            </span>

        </div>

        `;

    }).join("");



/* PARA */

function formatPrice(price) {

    return new Intl.NumberFormat(
        "tr-TR",
        {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0
        }
    ).format(price);

}



/* HTML GÜVENLİĞİ */

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



/* İLANLARI GETİR */

async function loadListings(category = "") {

    const grid =
        document.getElementById("listingGrid");


    if (!supabaseClient) {

        grid.innerHTML = `

            <div class="loading">

                <strong>Supabase bağlantısı yapılmadı.</strong>

                <br><br>

                <small>
                    js/config.js dosyasına
                    Supabase bilgilerini ekle.
                </small>

            </div>

        `;

        return;
    }


    grid.innerHTML = `

        <div class="loading">
            İlanlar yükleniyor...
        </div>

    `;


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
                listing_images (
                    image_url,
                    sort_order
                )
            `)

            .eq("status", "active")

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(40);



    if (category) {

        query =
            query.eq(
                "category",
                category
            );

    }



    const search =
        document
            .getElementById("searchInput")
            .value
            .trim();


    if (search) {

        query =
            query.or(
                `title.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`
            );

    }



    const {
        data,
        error
    } = await query;



    if (error) {

        console.error(error);

        grid.innerHTML = `

            <div class="loading">

                İlanlar yüklenemedi.

                <br><br>

                <small>
                    ${escapeHtml(error.message)}
                </small>

            </div>

        `;

        return;
    }



    if (!data || data.length === 0) {

        grid.innerHTML = `

            <div class="loading">

                Henüz ilan bulunamadı.

                <br><br>

                <a
                    href="ilan-ver.html"
                    style="color:#635bff;font-weight:900"
                >
                    İlk ilanı sen ver →
                </a>

            </div>

        `;

        return;

    }



    grid.innerHTML =
        data.map(createListingCard).join("");

}



/* İLAN KARTI */

function createListingCard(item) {

    let image = null;


    if (
        item.listing_images &&
        item.listing_images.length
    ) {

        const sorted =
            [...item.listing_images]
                .sort(
                    (a,b) =>
                        (a.sort_order || 0) -
                        (b.sort_order || 0)
                );

        image =
            sorted[0]?.image_url;

    }



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

        "📦 Fotoğraf yok";



    return `

        <article class="listing-card">

            <div class="listing-image">

                ${imageHTML}

            </div>


            <div class="listing-content">

                <div class="listing-category">

                    ${escapeHtml(item.category)}

                </div>


                <div class="listing-title">

                    ${escapeHtml(item.title)}

                </div>


                <div class="listing-price">

                    ${formatPrice(item.price)}

                </div>


                <div class="listing-info">

                    📍
                    ${escapeHtml(
                        item.city ||
                        "Şehir belirtilmedi"
                    )}

                    ·

                    ${escapeHtml(
                        item.condition
                    )}

                </div>

            </div>

        </article>

    `;

}



/* KATEGORİ */

function filterCategory(category) {

    document
        .getElementById("ilanlar")
        .scrollIntoView({
            behavior: "smooth"
        });


    loadListings(category);

}



/* ARAMA */

function searchListings() {

    document
        .getElementById("ilanlar")
        .scrollIntoView({
            behavior: "smooth"
        });


    loadListings();

}



/* BAŞLANGIÇ */

loadListings();
