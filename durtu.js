// =====================================================
//  KUPONSUZ – durtu.js
//  "Canım kupon yapmak istiyor" anının tüm mantığı
// =====================================================

const DURTU_SURESI = 10 * 60;              // saniye cinsinden: 10 dakika
const SAYAC_CEVRESI = 2 * Math.PI * 66;    // sayaç halkasının çevresi

// Her etkinliğin dürtü anında nasıl önerileceği.
// ekrandanUzak: telefonu elden bırakmayı sağlıyor mu?
const ETKINLIK_ONERILERI = {
  "Yürüyüş":          { oneri: "Kısa bir yürüyüşe çık", ekrandanUzak: true },
  "Kitap okumak":     { oneri: "Kitabından 10 sayfa oku", ekrandanUzak: true },
  "Dizi / film":      { oneri: "Sevdiğin dizinin bir bölümünü aç", ekrandanUzak: false },
  "Egzersiz":         { oneri: "10 dakika egzersiz yap", ekrandanUzak: true },
  "Pilates / yoga":   { oneri: "10 dakikalık bir pilates ya da yoga akışı yap", ekrandanUzak: true },
  "Müzik dinlemek":   { oneri: "Sevdiğin bir albümü aç, gözlerini kapat", ekrandanUzak: true },
  "Birini aramak":    { oneri: "Sevdiğin birini ara", ekrandanUzak: true },
  "Yemek yapmak":     { oneri: "Kendine bir şey hazırla", ekrandanUzak: true },
  "Duş almak":        { oneri: "Ilık bir duş al", ekrandanUzak: true },
  "Nefes egzersizi":  { oneri: "Sayaçla birlikte derin nefes al", ekrandanUzak: true },
  "Temiz hava almak": { oneri: "Balkona ya da dışarı çık, biraz hava al", ekrandanUzak: true }
};

const VARSAYILAN_ETKINLIKLER = ["Yürüyüş", "Nefes egzersizi", "Birini aramak"];
const VARSAYILAN_NOT = "Bu istek geçici. Kasandaki para ise gerçek.";

const TETIKLEYICILER = [
  "Maç izliyorum", "Canım sıkıldı", "Maaş yattı",
  "Para sıkıntısı", "Arkadaşlar oynuyor", "Reklam gördüm"
];

let aktifDurtu = null;       // { baslangic, tetikleyici, etkinlik }
let sayacZamanlayici = null;
let oneriKaydirma = 0;

function profilGetir() {
  return JSON.parse(localStorage.getItem("profil")) || {};
}

function ilkHarfiKucult(metin) {
  return metin.charAt(0).toLocaleLowerCase("tr-TR") + metin.slice(1);
}

// =====================================================
//  BAŞLATMA VE SAYAÇ
// =====================================================
function durtuBaslat() {
  aktifDurtu = { baslangic: Date.now(), tetikleyici: null, etkinlik: null };
  oneriKaydirma = 0;
  bul("oneriMesaji").textContent = "";

  notuGoster();
  hedefiHatirlat();
  tetikleyicileriGoster();
  onerileriGoster();

  ekranaGit("durtu");
  clearInterval(sayacZamanlayici);
  sayaciGuncelle();
  sayacZamanlayici = setInterval(sayaciGuncelle, 1000);
}

function sayaciGuncelle() {
  const gecen = Math.floor((Date.now() - aktifDurtu.baslangic) / 1000);
  const kalan = Math.max(0, DURTU_SURESI - gecen);

  const dakika = Math.floor(kalan / 60);
  const saniye = kalan % 60;
  bul("sayacZaman").textContent = dakika + ":" + String(saniye).padStart(2, "0");

  const oran = (DURTU_SURESI - kalan) / DURTU_SURESI;
  bul("sayacDolgu").setAttribute("stroke-dasharray", (SAYAC_CEVRESI * oran) + " " + SAYAC_CEVRESI);

  // Dört saniye nefes al, dört saniye ver
  bul("nefesYazisi").textContent = Math.floor(gecen / 4) % 2 === 0 ? "Nefes al" : "Nefes ver";

  if (kalan === 0) {
    clearInterval(sayacZamanlayici);
    sonucSorusunuAc();
  }
}

// =====================================================
//  EKRANDAKİ İÇERİK
// =====================================================
function notuGoster() {
  const profil = profilGetir();
  if (profil.not) {
    bul("notBaslik").textContent = "Kendine yazdığın not";
    bul("notMetni").textContent = "“" + profil.not + "”";
    bul("notAlt").textContent = "";
  } else {
    bul("notBaslik").textContent = "Hatırla";
    bul("notMetni").textContent = VARSAYILAN_NOT;
    bul("notAlt").textContent = "Kendi notunu Destek sayfasından ekleyebilirsin.";
  }
}

function hedefiHatirlat() {
  if (hedef === null) {
    bul("durtuHedef").textContent = "";
    return;
  }
  const kalan = hedef.tutar - (toplam - hedef.baslangic);
  bul("durtuHedef").textContent = hedef.ad + " hedefine " + paraYaz(kalan) + " kaldı.";
}

function tetikleyicileriGoster() {
  const alan = bul("tetikleyiciler");
  alan.innerHTML = "";
  for (const tetik of TETIKLEYICILER) {
    const cip = document.createElement("button");
    cip.className = "cip";
    cip.textContent = tetik;
    cip.setAttribute("aria-pressed", aktifDurtu.tetikleyici === tetik ? "true" : "false");
    cip.addEventListener("click", function () {
      // Aynı seçeneğe tekrar dokunulursa seçim kalkar
      aktifDurtu.tetikleyici = aktifDurtu.tetikleyici === tetik ? null : tetik;
      oneriKaydirma = 0;
      tetikleyicileriGoster();
      onerileriGoster();
    });
    alan.append(cip);
  }
}

// Kişinin listesinden, işe yarayanları öne alarak öneri sırası çıkarır
function onerileriHazirla() {
  const profil = profilGetir();
  const kendiSecti = Array.isArray(profil.etkinlikler) && profil.etkinlikler.length > 0;
  let liste = kendiSecti ? profil.etkinlikler.slice() : VARSAYILAN_ETKINLIKLER.slice();

  // Maç izlerken ekranda kalmayı gerektiren öneriler elenir
  if (aktifDurtu.tetikleyici === "Maç izliyorum") {
    const uzaklar = liste.filter(ad => !ETKINLIK_ONERILERI[ad] || ETKINLIK_ONERILERI[ad].ekrandanUzak);
    if (uzaklar.length > 0) liste = uzaklar;
  }

  // Daha önce kaç kez işe yaradığını say, çok işe yarayan öne geçsin
  const basari = {};
  for (const durtu of durtuler) {
    if (durtu.sonuc === "gecti" && durtu.etkinlik) {
      basari[durtu.etkinlik] = (basari[durtu.etkinlik] || 0) + 1;
    }
  }
  liste.sort((a, b) => (basari[b] || 0) - (basari[a] || 0));

  return liste.map(function (ad) {
    let ayrinti = kendiSecti ? "Senin listenden" : "Başlangıç önerisi";
    if (basari[ad]) {
      ayrinti = "Daha önce " + basari[ad] + " kez işe yaradı";
    }
    return {
      ad: ad,
      metin: ETKINLIK_ONERILERI[ad] ? ETKINLIK_ONERILERI[ad].oneri : ad,
      ayrinti: ayrinti
    };
  });
}

function onerileriGoster() {
  const hepsi = onerileriHazirla();
  let gosterilecek = hepsi;

  if (hepsi.length > 3) {
    gosterilecek = [];
    for (let i = 0; i < 3; i++) {
      gosterilecek.push(hepsi[(oneriKaydirma + i) % hepsi.length]);
    }
  }
  bul("baskaOneri").hidden = hepsi.length <= 3;

  const alan = bul("oneriListesi");
  alan.innerHTML = "";

  gosterilecek.forEach(function (oneri, sira) {
    let metin = oneri.metin;
    let ayrinti = oneri.ayrinti;
    if (sira === 0 && aktifDurtu.tetikleyici === "Maç izliyorum") {
      metin = "Maçı kapat, " + ilkHarfiKucult(metin);
      ayrinti = "Tetikleyicine göre önerildi";
    }

    const kart = document.createElement("button");
    kart.className = "oneri";
    kart.setAttribute("aria-pressed", aktifDurtu.etkinlik === oneri.ad ? "true" : "false");

    const yazi = document.createElement("span");
    yazi.className = "oneri-metin";
    const baslik = document.createElement("span");
    baslik.className = "oneri-baslik";
    baslik.textContent = metin;
    const alt = document.createElement("span");
    alt.className = "oneri-alt";
    alt.textContent = ayrinti;
    yazi.append(baslik, alt);
    kart.append(yazi);

    if (aktifDurtu.etkinlik === oneri.ad) {
      const tik = document.createElement("span");
      tik.innerHTML = svg('<path d="M5 12l5 5 9-10"/>', 22);
      kart.append(tik);
    }

    kart.addEventListener("click", function () {
      aktifDurtu.etkinlik = oneri.ad;
      bul("oneriMesaji").textContent = "Harika. Sen etkinliğindeyken sayaç işlemeye devam ediyor.";
      onerileriGoster();
    });

    alan.append(kart);
  });
}

bul("baskaOneri").addEventListener("click", function () {
  oneriKaydirma = oneriKaydirma + 3;
  onerileriGoster();
});

// =====================================================
//  SONUÇ
// =====================================================
function durtuyuKaydet(sonuc) {
  clearInterval(sayacZamanlayici);
  if (aktifDurtu === null) return;
  durtuler.push({
    tarih: new Date(aktifDurtu.baslangic).toISOString(),
    tetikleyici: aktifDurtu.tetikleyici,
    etkinlik: aktifDurtu.etkinlik,
    sonuc: sonuc
  });
  kaydet();
}

function sonucSorusunuAc() {
  bul("sonucSoru").hidden = false;
  bul("sonucGecti").hidden = true;
  bul("sonucDevam").hidden = true;
  ekranaGit("durtu-sonuc");
}

function gectiGoster() {
  const etkinlik = aktifDurtu ? aktifDurtu.etkinlik : null;
  durtuyuKaydet("gecti");

  const buAy = new Date();
  const buAyAtlatilan = durtuler.filter(function (d) {
    const tarih = new Date(d.tarih);
    return d.sonuc === "gecti" && tarih.getMonth() === buAy.getMonth() && tarih.getFullYear() === buAy.getFullYear();
  }).length;

  bul("gectiMetni").textContent = "Bu ay atlattığın " + buAyAtlatilan + ". dürtü. Her seferinde biraz daha kolaylaşıyor.";
  bul("gectiEtkinlik").textContent = etkinlik
    ? "Bu sefer işe yarayan: " + ilkHarfiKucult(etkinlik) + ". Bir dahaki sefere önerilerinde onu öne alacağız."
    : "";

  bul("sonucSoru").hidden = true;
  bul("sonucGecti").hidden = false;
  bul("sonucDevam").hidden = true;
  ekranaGit("durtu-sonuc");

  aktifDurtu = null;
  kasayiGuncelle(); // yeni dürtü rozeti var mı diye bakar
}

bul("cevapGecti").addEventListener("click", gectiGoster);
bul("istekGecti").addEventListener("click", gectiGoster);

bul("cevapDevam").addEventListener("click", function () {
  durtuyuKaydet("devam");
  aktifDurtu = null;
  bul("sonucSoru").hidden = true;
  bul("sonucDevam").hidden = false;
});

bul("biraDahaBekle").addEventListener("click", durtuBaslat);

bul("durtuKapat").addEventListener("click", function () {
  durtuyuKaydet("yarida");
  aktifDurtu = null;
  ekranaGit("kasa");
});

// Uygulamadaki bütün "dürtü" girişleri
document.querySelectorAll(".durtu-baslat").forEach(function (dugme) {
  dugme.addEventListener("click", durtuBaslat);
});
