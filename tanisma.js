// ---- Tanışma ekranı ----
const tanismaEkrani = document.getElementById("tanisma");
const uygulamaEkrani = document.getElementById("uygulama");
const amacYazisi = document.getElementById("amacYazisi");

// Sadece istenen adımı göster, diğerlerini gizle
function adimGoster(adimId) {
  document.querySelectorAll(".adim").forEach(function (adim) {
    adim.hidden = adim.id !== adimId;
  });
}

function uygulamayiAc(profil) {
  tanismaEkrani.hidden = true;
  uygulamaEkrani.hidden = false;

  if (profil.amac === "birakmak") {
    amacYazisi.textContent = "Amacın bahsi bırakmak. Kupon yapmadığın her gün bir adım.";
  } else {
    amacYazisi.textContent = "Amacın bahsi azaltmak. Küçük adımlar da sayılır.";
  }
}

// "İleri" düğmeleri: her biri data-sonraki içinde yazan adıma gider
document.querySelectorAll("[data-sonraki]").forEach(function (buton) {
  buton.addEventListener("click", function () {
    adimGoster(buton.dataset.sonraki);
  });
});

// Amaç düğmeleri: seçimi kaydet ve uygulamayı aç
document.querySelectorAll("[data-amac]").forEach(function (buton) {
  buton.addEventListener("click", function () {
    const profil = {
      amac: buton.dataset.amac,
      baslangicTarihi: new Date().toISOString()
    };
    localStorage.setItem("profil", JSON.stringify(profil));
    uygulamayiAc(profil);
  });
});

// Test için: tanışma ekranını baştan göster
document.getElementById("tanismayiSifirla").addEventListener("click", function () {
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