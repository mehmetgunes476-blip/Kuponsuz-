// =====================================================
//  KUPONSUZ – tanisma.js
// =====================================================

const tanismaEkrani = bul("tanisma");
const uygulamaEkrani = bul("uygulama");

let secilenAmac = null;
let seciliEtkinlikler = VARSAYILAN_ETKINLIKLER.slice();
let ozelEtkinlikler = [];
let duzenlemeModu = false;   // Destek sayfasından açıldıysa true

// Sadece istenen adımı göster, diğerlerini gizle
function adimGoster(adimId) {
  document.querySelectorAll(".adim").forEach(function (adim) {
    adim.hidden = adim.id !== adimId;
  });
  window.scrollTo(0, 0);
}

function uygulamayiAc(profil) {
  tanismaEkrani.hidden = true;
  uygulamaEkrani.hidden = false;

  bul("amacYazisi").textContent = profil.amac === "birakmak"
    ? "Amacın bahsi bırakmak. Kupon yapmadığın her gün bir adım."
    : "Amacın bahsi azaltmak. Küçük adımlar da sayılır.";

  ekranaGit("kasa");
}

// ---- İleri düğmeleri ----
document.querySelectorAll("[data-sonraki]").forEach(function (buton) {
  buton.addEventListener("click", function () {
    adimGoster(buton.dataset.sonraki);
  });
});

// ---- Amaç seçimi -> etkinlik adımı ----
document.querySelectorAll("[data-amac]").forEach(function (buton) {
  buton.addEventListener("click", function () {
    secilenAmac = buton.dataset.amac;
    etkinlikleriGoster();
    adimGoster("adim5");
  });
});

// ---- Etkinlik seçimi ----
function etkinlikleriGoster() {
  const alan = bul("etkinlikCipleri");
  alan.innerHTML = "";
  const hepsi = Object.keys(ETKINLIK_ONERILERI).concat(ozelEtkinlikler);

  for (const ad of hepsi) {
    const cip = document.createElement("button");
    cip.className = "cip";
    cip.textContent = ad;
    cip.setAttribute("aria-pressed", seciliEtkinlikler.includes(ad) ? "true" : "false");
    cip.addEventListener("click", function () {
      if (seciliEtkinlikler.includes(ad)) {
        seciliEtkinlikler = seciliEtkinlikler.filter(x => x !== ad);
      } else {
        seciliEtkinlikler.push(ad);
      }
      etkinlikleriGoster();
    });
    alan.append(cip);
  }
}

bul("etkinlikEkle").addEventListener("click", function () {
  const ad = bul("yeniEtkinlik").value.trim();
  const zatenVar = ETKINLIK_ONERILERI[ad] || ozelEtkinlikler.includes(ad);
  if (ad === "" || zatenVar) return;
  ozelEtkinlikler.push(ad);
  seciliEtkinlikler.push(ad);
  bul("yeniEtkinlik").value = "";
  etkinlikleriGoster();
});

bul("etkinlikDevam").addEventListener("click", function () {
  adimGoster("adim6");
  bul("kendineNot").focus();
});

// ---- Not ve bitiş ----
function tanismayiBitir(notuKaydet) {
  const profil = JSON.parse(localStorage.getItem("profil")) || {};

  if (!duzenlemeModu) {
    profil.amac = secilenAmac;
    profil.baslangicTarihi = new Date().toISOString();
  }
  profil.etkinlikler = seciliEtkinlikler.slice();
  if (notuKaydet) {
    profil.not = bul("kendineNot").value.trim();
  }

  localStorage.setItem("profil", JSON.stringify(profil));
  uygulamayiAc(profil);

  if (duzenlemeModu) {
    duzenlemeModu = false;
    ekranaGit("destek");
    bildirimGoster("Kaydedildi. Önerilerin artık buna göre çıkacak.");
  }
}

bul("tanismaBitir").addEventListener("click", function () {
  tanismayiBitir(true);
});

bul("notuAtla").addEventListener("click", function () {
  tanismayiBitir(false);
});

// ---- Destek sayfasından düzenleme ----
bul("kisiselDuzenle").addEventListener("click", function () {
  const profil = JSON.parse(localStorage.getItem("profil")) || {};
  duzenlemeModu = true;

  seciliEtkinlikler = (profil.etkinlikler && profil.etkinlikler.length > 0)
    ? profil.etkinlikler.slice()
    : VARSAYILAN_ETKINLIKLER.slice();
  ozelEtkinlikler = seciliEtkinlikler.filter(ad => !ETKINLIK_ONERILERI[ad]);
  bul("kendineNot").value = profil.not || "";

  uygulamaEkrani.hidden = true;
  tanismaEkrani.hidden = false;
  etkinlikleriGoster();
  adimGoster("adim5");
});

// ---- Test için: tanışma ekranını baştan göster ----
bul("tanismayiSifirla").addEventListener("click", function () {
  localStorage.removeItem("profil");
  location.reload();
});

// ---- Sayfa açılınca ----
const kayitliProfil = JSON.parse(localStorage.getItem("profil"));

if (kayitliProfil) {
  uygulamayiAc(kayitliProfil);
} else {
  tanismaEkrani.hidden = false;
  adimGoster("adim1");
}
